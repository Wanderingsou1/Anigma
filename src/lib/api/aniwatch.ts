// HiAnime data is fetched from a self-hosted scraping service (see /stream-api),
// NOT scraped in-process. hianime.to blocks Vercel's datacenter IPs, so the
// scraper must run on a non-datacenter host. Deploy /stream-api on Railway /
// Render / a VPS, then set:
//   STREAM_API_URL=https://your-stream-api.example.com
//   STREAM_API_KEY=...            (optional; must match the service's API_KEY)
// When STREAM_API_URL is unset, all functions no-op gracefully and the app
// falls back to its other providers.

const API_BASE = (process.env.STREAM_API_URL ?? "").replace(/\/$/, "");
const API_KEY = process.env.STREAM_API_KEY ?? "";

export interface HiAnimeEpisode {
  id: string;
  number: number;
  title: string;
  isFiller: boolean;
}

export interface HiAnimeSource {
  url: string;
  type: "m3u8" | "mp4";
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  const sep = path.includes("?") ? "&" : "?";
  const url = `${API_BASE}${path}${API_KEY ? `${sep}key=${encodeURIComponent(API_KEY)}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`stream-api ${path} -> HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (!json?.success || !json.data) return null;
    return json.data;
  } catch (err) {
    console.error(`stream-api ${path} failed:`, err);
    return null;
  }
}

/** Find the hianime anime ID from a title string */
export async function searchHiAnime(title: string): Promise<string | null> {
  const data = await apiGet<{ animes?: { id?: string }[] }>(
    `/search?q=${encodeURIComponent(title)}`
  );
  return data?.animes?.[0]?.id ?? null;
}

/** Get all episodes for a hianime anime id */
export async function getHiAnimeEpisodes(
  hiAnimeId: string
): Promise<HiAnimeEpisode[]> {
  const data = await apiGet<{
    episodes?: { episodeId?: string; number: number; title?: string; isFiller?: boolean }[];
  }>(`/episodes?animeId=${encodeURIComponent(hiAnimeId)}`);

  return (data?.episodes ?? []).map((ep) => ({
    id: ep.episodeId ?? String(ep.number),
    number: ep.number,
    title: ep.title ?? `Episode ${ep.number}`,
    isFiller: ep.isFiller ?? false,
  }));
}

/** Get streaming sources for a hianime episode id */
export async function getHiAnimeSources(
  episodeId: string,
  category: "sub" | "dub" = "sub"
): Promise<HiAnimeSource[]> {
  const data = await apiGet<{ sources?: { url: string; type?: string }[] }>(
    `/sources?episodeId=${encodeURIComponent(episodeId)}&category=${category}`
  );

  return (data?.sources ?? []).map((s) => ({
    url: s.url,
    type: (s.type === "mp4" ? "mp4" : "m3u8") as "m3u8" | "mp4",
  }));
}
