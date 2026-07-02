import type {
  AnimeCharacter,
  AnimeData,
  AnimeEpisode,
  PaginatedResponse,
  ScheduleDay,
  SearchFilters,
} from "./types";

const BASE = "https://api.jikan.moe/v4";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Dedupe identical concurrent requests so the detail page's parallel calls
// (details/characters/recommendations/episodes) don't each re-hit Jikan.
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Fetch from Jikan with retry on 429 (rate limit) / 5xx. Jikan allows only
 * ~3 req/s, and the app fires several calls in parallel per page, so without
 * this a burst returns 429 → the anime appears as "not found".
 */
async function jikanFetch<T>(path: string): Promise<T> {
  const existing = inFlight.get(path);
  if (existing) return existing as Promise<T>;

  const run = (async (): Promise<T> => {
    const MAX_RETRIES = 4;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 } });
      if (res.ok) return (await res.json()) as T;

      // Retry on rate-limit and transient server errors with backoff.
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("retry-after")) * 1000;
        const backoff = retryAfter || 500 * Math.pow(2, attempt); // 0.5s,1s,2s,4s
        await sleep(backoff);
        continue;
      }
      throw new Error(`Jikan ${path} → ${res.status}`);
    }
    throw new Error(`Jikan ${path} → exhausted retries`);
  })();

  inFlight.set(path, run);
  try {
    return await run;
  } finally {
    inFlight.delete(path);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(item: any): AnimeData {
  const malId: number = item.mal_id ?? 0;
  const studios: string[] = Array.isArray(item.studios)
    ? item.studios.map((s: { name: string }) => s.name).filter(Boolean)
    : [];
  const genres: string[] = [
    ...(Array.isArray(item.genres) ? item.genres.map((g: { name: string }) => g.name) : []),
    ...(Array.isArray(item.themes) ? item.themes.map((g: { name: string }) => g.name) : []),
  ];
  const imageUrl: string =
    item.images?.webp?.large_image_url ??
    item.images?.jpg?.large_image_url ??
    item.images?.webp?.image_url ??
    item.images?.jpg?.image_url ??
    "";
  const status = (() => {
    const s = (item.status ?? "").toLowerCase();
    if (s.includes("airing")) return "ongoing";
    if (s.includes("finished") || s.includes("completed")) return "completed";
    if (s.includes("upcoming") || s.includes("not yet")) return "upcoming";
    return s || "unknown";
  })();

  return {
    id: `jikan::${malId}`,
    malId,
    title: item.title_english ?? item.title ?? "",
    titleJapanese: item.title_japanese ?? "",
    titleEnglish: item.title_english ?? item.title ?? "",
    synopsis: item.synopsis ?? "",
    genres,
    type: item.type ?? "TV",
    status,
    rating: item.score ?? 0,
    scored_by: item.scored_by ?? undefined,
    members: item.members ?? undefined,
    popularity: item.popularity ?? undefined,
    rank: item.rank ?? undefined,
    episodes: item.episodes ?? 0,
    currentEpisode: item.episodes ?? 0,
    year: item.year ?? item.aired?.prop?.from?.year ?? new Date().getFullYear(),
    season: item.season ? item.season.charAt(0).toUpperCase() + item.season.slice(1) : "",
    studio: studios[0] ?? "Unknown",
    studios,
    duration: item.duration ?? "",
    source: "Jikan / MAL",
    imageUrl,
    imageLargeUrl: imageUrl,
    bannerUrl: imageUrl,
    trailerUrl: item.trailer?.url ?? undefined,
    trailerEmbedUrl: item.trailer?.embed_url ?? undefined,
    tags: genres.slice(0, 4),
    airing: item.airing ?? status === "ongoing",
    aired: item.aired
      ? { from: item.aired.from ?? "", to: item.aired.to ?? "" }
      : undefined,
  };
}

export async function getTrendingAnime(page = 1, perPage = 20): Promise<AnimeData[]> {
  const { data } = await jikanFetch<{ data: unknown[] }>(
    `/top/anime?filter=airing&page=${page}&limit=${perPage}`
  );
  return (data ?? []).map(normalize);
}

export async function getTopAnime(
  filter: "bypopularity" | "favorite" | "airing" | "upcoming" | "" = "",
  page = 1,
  limit = 24
): Promise<PaginatedResponse<AnimeData>> {
  const filterParam = filter ? `&filter=${filter}` : "";
  const { data, pagination } = await jikanFetch<{
    data: unknown[];
    pagination: { last_visible_page: number; has_next_page: boolean; current_page: number; items: { total: number } };
  }>(`/top/anime?page=${page}&limit=${limit}${filterParam}`);
  return {
    data: (data ?? []).map(normalize),
    pagination: {
      lastVisiblePage: pagination?.last_visible_page ?? page,
      hasNextPage: pagination?.has_next_page ?? false,
      currentPage: pagination?.current_page ?? page,
      totalItems: pagination?.items?.total ?? 0,
    },
  };
}

export async function searchAnime(filters: SearchFilters): Promise<PaginatedResponse<AnimeData>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type && filters.type !== "All") params.set("type", filters.type.toUpperCase());
  if (filters.status && filters.status !== "All") {
    const statusMap: Record<string, string> = {
      ongoing: "airing",
      completed: "complete",
      upcoming: "upcoming",
    };
    params.set("status", statusMap[filters.status] ?? filters.status);
  }
  if (filters.genres) params.set("genres", filters.genres);
  if (filters.minScore) params.set("min_score", String(filters.minScore));
  if (filters.maxScore) params.set("max_score", String(filters.maxScore));
  if (filters.orderBy) params.set("order_by", filters.orderBy);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sfw) params.set("sfw", "true");

  const qs = params.toString();
  const { data, pagination } = await jikanFetch<{
    data: unknown[];
    pagination: { last_visible_page: number; has_next_page: boolean; current_page: number; items: { total: number } };
  }>(`/anime${qs ? `?${qs}` : ""}`);
  return {
    data: (data ?? []).map(normalize),
    pagination: {
      lastVisiblePage: pagination?.last_visible_page ?? 1,
      hasNextPage: pagination?.has_next_page ?? false,
      currentPage: pagination?.current_page ?? filters.page ?? 1,
      totalItems: pagination?.items?.total ?? 0,
    },
  };
}

export async function getAnimeById(id: string | number): Promise<AnimeData | null> {
  const raw = String(id);

  // AniList IDs → delegate to AniList module (idMal ≠ malId)
  if (raw.startsWith("anilist::")) {
    const anilistId = parseInt(raw.replace("anilist::", ""), 10);
    if (!isNaN(anilistId)) {
      const { getAnimeByAniListId } = await import("./anilist");
      return getAnimeByAniListId(anilistId);
    }
  }

  // jikan:: prefix or raw number → MAL ID lookup
  const malId = raw.replace(/^jikan::/, "").replace(/^.*::/, "");
  try {
    const { data } = await jikanFetch<{ data: unknown }>(`/anime/${malId}`);
    return data ? normalize(data) : null;
  } catch {
    return null;
  }
}

async function resolveMalId(id: string | number): Promise<number | null> {
  const raw = String(id);
  if (raw.startsWith("anilist::")) {
    const anime = await getAnimeById(raw);
    return anime?.malId ?? null;
  }
  const n = parseInt(raw.replace(/^jikan::/, "").replace(/^.*::/, ""), 10);
  return isNaN(n) ? null : n;
}

export async function getAnimeEpisodes(
  id: string | number,
  page = 1
): Promise<PaginatedResponse<AnimeEpisode>> {
  const malId = await resolveMalId(id);
  if (!malId) return { data: [], pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: page, totalItems: 0 } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, pagination } = await jikanFetch<{ data: any[]; pagination: any }>(
      `/anime/${malId}/episodes?page=${page}`
    );
    const episodes: AnimeEpisode[] = (data ?? []).map((ep) => ({
      id: `jikan::${malId}::ep::${ep.mal_id}`,
      malId: ep.mal_id ?? 0,
      number: ep.mal_id ?? 0, // Jikan v4: mal_id IS the episode number
      title: ep.title ?? ep.title_romanji ?? `Episode ${ep.mal_id}`,
      titleJapanese: ep.title_japanese ?? "",
      aired: ep.aired ?? "",
      filler: ep.filler ?? false,
      recap: ep.recap ?? false,
      imageUrl: ep.images?.jpg?.image_url ?? "",
    }));
    return {
      data: episodes,
      pagination: {
        lastVisiblePage: pagination?.last_visible_page ?? page,
        hasNextPage: pagination?.has_next_page ?? false,
        currentPage: pagination?.current_page ?? page,
        totalItems: pagination?.items?.total ?? episodes.length,
      },
    };
  } catch {
    return {
      data: [],
      pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: page, totalItems: 0 },
    };
  }
}

export async function getSeasonalAnime(
  year?: number,
  season?: string,
  page = 1
): Promise<PaginatedResponse<AnimeData>> {
  try {
    const now = new Date();
    const resolvedYear = year ?? now.getFullYear();
    const seasons = ["winter", "spring", "summer", "fall"];
    const monthToSeason = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];
    const resolvedSeason = season ?? seasons[monthToSeason[now.getMonth()]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, pagination } = await jikanFetch<{ data: any[]; pagination: any }>(
      `/seasons/${resolvedYear}/${resolvedSeason}?page=${page}`
    );
    return {
      data: (data ?? []).map(normalize),
      pagination: {
        lastVisiblePage: pagination?.last_visible_page ?? page,
        hasNextPage: pagination?.has_next_page ?? false,
        currentPage: pagination?.current_page ?? page,
        totalItems: pagination?.items?.total ?? 0,
      },
    };
  } catch {
    return getTopAnime("airing", page, 24);
  }
}

export async function getAnimeSchedule(day?: string): Promise<ScheduleDay[]> {
  try {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const now = new Date();
    const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const targetDay = day ?? days[todayIndex];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await jikanFetch<{ data: any[] }>(`/schedules?filter=${targetDay}`);
    return [{ day: targetDay, anime: (data ?? []).map(normalize) }];
  } catch {
    return [];
  }
}

export async function getAnimeByGenre(
  genreSlug: string,
  page = 1,
  limit = 24
): Promise<PaginatedResponse<AnimeData>> {
  const genreMap: Record<string, number> = {
    action: 1, adventure: 2, comedy: 4, drama: 8, fantasy: 10, horror: 14,
    mystery: 7, romance: 22, scifi: 24, "sci-fi": 24, "slice of life": 36,
    sports: 30, supernatural: 37, thriller: 41, suspense: 41,
    isekai: 62, mecha: 18, psychological: 40, historical: 13,
    shounen: 27, seinen: 42, shoujo: 25, josei: 43,
  };
  const genreId = genreMap[genreSlug.toLowerCase()];
  return searchAnime({ genres: genreId ? String(genreId) : undefined, q: genreId ? undefined : genreSlug, page, limit });
}

export async function getAnimeCharacters(id: string | number): Promise<AnimeCharacter[]> {
  const malId = await resolveMalId(id);
  if (!malId) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await jikanFetch<{ data: any[] }>(`/anime/${malId}/characters`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).slice(0, 12).map((entry: any) => ({
      malId: entry.character?.mal_id ?? 0,
      name: entry.character?.name ?? "",
      imageUrl:
        entry.character?.images?.webp?.image_url ??
        entry.character?.images?.jpg?.image_url ??
        "",
      role: entry.role ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      voiceActors: (entry.voice_actors ?? []).slice(0, 2).map((va: any) => ({
        name: va.person?.name ?? "",
        language: va.language ?? "",
        imageUrl: va.person?.images?.jpg?.image_url ?? "",
      })),
    }));
  } catch {
    return [];
  }
}

export async function getAnimeRecommendations(id: string | number): Promise<AnimeData[]> {
  const malId = await resolveMalId(id);
  if (!malId) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await jikanFetch<{ data: any[] }>(`/anime/${malId}/recommendations`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).slice(0, 12).map((rec: any) => normalize(rec.entry));
  } catch {
    return [];
  }
}

export async function getRandomAnime(): Promise<AnimeData | null> {
  try {
    const { data } = await jikanFetch<{ data: unknown }>("/random/anime");
    return data ? normalize(data) : null;
  } catch {
    return null;
  }
}
