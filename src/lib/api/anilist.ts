import type { AnimeData, PaginatedResponse } from "./types";

const ANILIST_URL = "https://graphql.anilist.co";

/** Thrown when AniList itself is down/blocking requests (403/502/503/504), as opposed to a query bug. */
export class AniListUnavailableError extends Error {
  constructor(message = "The AniList API is temporarily unavailable. Please try again shortly.") {
    super(message);
    this.name = "AniListUnavailableError";
  }
}

const MEDIA_FIELDS = `
  id idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { large extraLarge }
  bannerImage
  averageScore popularity
  episodes status season seasonYear
  genres studios(isMain: true) { nodes { name } }
  format
  startDate { year }
  trailer { id site }
  tags { name }
  duration
`;

async function query<T>(gql: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
    next: { revalidate: 600 },
  });
  if (res.status === 403 || res.status === 502 || res.status === 503 || res.status === 504) {
    throw new AniListUnavailableError();
  }
  if (!res.ok) throw new Error(`AniList query failed: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList error");
  return json.data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(media: any): AnimeData {
  const malId: number = media.idMal ?? 0;
  const anilistId: number = media.id ?? 0;
  const title: string =
    media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "";
  const studios: string[] = (media.studios?.nodes ?? []).map((n: { name: string }) => n.name);
  const genres: string[] = media.genres ?? [];
  const imageUrl: string = media.coverImage?.extraLarge ?? media.coverImage?.large ?? "";
  const bannerUrl: string = media.bannerImage ?? imageUrl;

  const status = (() => {
    const s = (media.status ?? "").toLowerCase();
    if (s === "releasing") return "ongoing";
    if (s === "finished") return "completed";
    if (s === "not_yet_released") return "upcoming";
    if (s === "cancelled") return "cancelled";
    if (s === "hiatus") return "hiatus";
    return s || "unknown";
  })();

  const rating = media.averageScore ? media.averageScore / 10 : 0;
  const year: number = media.seasonYear ?? media.startDate?.year ?? new Date().getFullYear();
  const season: string = media.season
    ? media.season.charAt(0) + media.season.slice(1).toLowerCase()
    : "";
  const trailerUrl =
    media.trailer?.site === "youtube"
      ? `https://www.youtube.com/watch?v=${media.trailer.id}`
      : undefined;
  const trailerEmbedUrl =
    media.trailer?.site === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${media.trailer.id}`
      : undefined;

  return {
    id: `anilist::${anilistId}`,
    malId,
    anilistId,
    title,
    titleJapanese: media.title?.native ?? "",
    titleEnglish: media.title?.english ?? media.title?.romaji ?? "",
    synopsis: media.description ?? "",
    genres,
    type: media.format === "TV_SHORT" ? "TV" : (media.format ?? "TV"),
    status,
    rating,
    members: media.popularity ?? undefined,
    popularity: media.popularity ?? undefined,
    episodes: media.episodes ?? 0,
    currentEpisode: media.episodes ?? 0,
    year,
    season,
    studio: studios[0] ?? "Unknown",
    studios,
    duration: media.duration ? `${media.duration} min` : "",
    source: "AniList",
    imageUrl,
    imageLargeUrl: imageUrl,
    bannerUrl,
    trailerUrl,
    trailerEmbedUrl,
    tags: (media.tags ?? []).slice(0, 4).map((t: { name: string }) => t.name),
    airing: status === "ongoing",
  };
}

export async function getTrendingAnime(page = 1, perPage = 20): Promise<AnimeData[]> {
  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, status: RELEASING, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  );
  return (data.Page?.media ?? []).map(normalize);
}

export async function getTopRatedAnime(page = 1, perPage = 20): Promise<AnimeData[]> {
  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  );
  return (data.Page?.media ?? []).map(normalize);
}

export async function getOngoingAnime(page = 1, perPage = 20): Promise<AnimeData[]> {
  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  );
  return (data.Page?.media ?? []).map(normalize);
}

export async function getCompletedAnime(page = 1, perPage = 20): Promise<AnimeData[]> {
  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: FINISHED, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  );
  return (data.Page?.media ?? []).map(normalize);
}

/** Anime with averageScore >= 80 (AniList has no min-score query arg, so we over-fetch and filter). */
export async function getRecommendedAnime(perPage = 10): Promise<AnimeData[]> {
  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page: 1, perPage: perPage * 3 }
  );
  return (data.Page?.media ?? [])
    .map(normalize)
    .filter((a) => a.rating >= 8)
    .slice(0, perPage);
}

export async function getNewReleases(page = 1, perPage = 24): Promise<PaginatedResponse<AnimeData>> {
  // AniList sorts null startDate entries first in DESC order, which surfaces old/undated
  // titles ahead of genuinely recent ones — excluding anything older than ~2 years works
  // around that and keeps this feed meaningfully "new".
  const cutoffYear = new Date().getFullYear() - 2;
  const startDateGreater = cutoffYear * 10000 + 101; // FuzzyDateInt format YYYYMMDD

  const data = await query<{ Page: { media: unknown[]; pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean } } }>(
    `query ($page: Int, $perPage: Int, $startDateGreater: FuzzyDateInt) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: START_DATE_DESC, status_in: [RELEASING, FINISHED], startDate_greater: $startDateGreater, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage, startDateGreater }
  );
  return {
    data: (data.Page?.media ?? []).map(normalize),
    pagination: {
      lastVisiblePage: data.Page?.pageInfo?.lastPage ?? page,
      hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
      currentPage: data.Page?.pageInfo?.currentPage ?? page,
      totalItems: data.Page?.pageInfo?.total ?? 0,
    },
  };
}

export async function getPopularAnime(page = 1, perPage = 24): Promise<PaginatedResponse<AnimeData>> {
  const data = await query<{ Page: { media: unknown[]; pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean } } }>(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  );
  return {
    data: (data.Page?.media ?? []).map(normalize),
    pagination: {
      lastVisiblePage: data.Page?.pageInfo?.lastPage ?? page,
      hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
      currentPage: data.Page?.pageInfo?.currentPage ?? page,
      totalItems: data.Page?.pageInfo?.total ?? 0,
    },
  };
}

export async function getPopularThisSeason(perPage = 20): Promise<AnimeData[]> {
  const now = new Date();
  const month = now.getMonth();
  const seasons = ["WINTER", "WINTER", "SPRING", "SPRING", "SPRING", "SUMMER", "SUMMER", "SUMMER", "FALL", "FALL", "FALL", "WINTER"];
  const season = seasons[month];
  const year = now.getFullYear();

  const data = await query<{ Page: { media: unknown[] } }>(
    `query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, season: $season, seasonYear: $year, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page: 1, perPage, season, year }
  );
  return (data.Page?.media ?? []).map(normalize);
}

// AniList treats these as tags, not genres — the "genre" filter would silently return nothing for them.
export const ANILIST_TAG_ONLY_GENRES = new Set([
  "isekai", "military", "samurai", "school", "seinen", "shounen", "super power",
]);

export type AniListSort =
  | "SEARCH_MATCH"
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC"
  | "TITLE_ROMAJI";

export interface SearchAniListOptions {
  genre?: string;
  tag?: string;
  format?: string; // AniList MediaFormat: TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC
  status?: "RELEASING" | "FINISHED" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  sort?: AniListSort;
}

export async function searchAniList(
  q: string,
  page = 1,
  perPage = 24,
  opts: SearchAniListOptions = {}
): Promise<PaginatedResponse<AnimeData>> {
  const sort = opts.sort ?? (q ? "SEARCH_MATCH" : "POPULARITY_DESC");
  const data = await query<{ Page: { media: unknown[]; pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean } } }>(
    `query ($q: String, $page: Int, $perPage: Int, $genre: String, $tag: String, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, search: $q, genre: $genre, tag: $tag, format: $format, status: $status, sort: $sort, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    {
      q: q || undefined,
      page,
      perPage,
      genre: opts.genre || undefined,
      tag: opts.tag || undefined,
      format: opts.format || undefined,
      status: opts.status || undefined,
      sort: [sort],
    }
  );
  return {
    data: (data.Page?.media ?? []).map(normalize),
    pagination: {
      lastVisiblePage: data.Page?.pageInfo?.lastPage ?? page,
      hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
      currentPage: data.Page?.pageInfo?.currentPage ?? page,
      totalItems: data.Page?.pageInfo?.total ?? 0,
    },
  };
}

/**
 * Resolve an AniList anime ID from a MyAnimeList ID. Needed because some
 * streaming providers (e.g. VidNest) key their catalog by AniList ID, not MAL.
 */
export async function getAniListIdByMalId(malId: number): Promise<number | null> {
  if (!malId) return null;
  try {
    const data = await query<{ Media: { id: number } | null }>(
      `query ($m: Int) { Media(idMal: $m, type: ANIME) { id } }`,
      { m: malId }
    );
    return data.Media?.id ?? null;
  } catch {
    return null;
  }
}

export async function getAnimeByAniListId(anilistId: number): Promise<AnimeData | null> {
  try {
    const data = await query<{ Media: unknown }>(
      `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
      { id: anilistId }
    );
    return data.Media ? normalize(data.Media) : null;
  } catch {
    return null;
  }
}
