import { HiAnime } from "aniwatch";

const scraper = new HiAnime.Scraper();

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

/** Find the hianime anime ID from a title string */
export async function searchHiAnime(title: string): Promise<string | null> {
  try {
    const results = await scraper.search(title);
    if (!results?.animes?.length) return null;
    return results.animes[0].id ?? null;
  } catch {
    return null;
  }
}

/** Get all episodes for a hianime anime id */
export async function getHiAnimeEpisodes(
  hiAnimeId: string
): Promise<HiAnimeEpisode[]> {
  try {
    const result = await scraper.getEpisodes(hiAnimeId);
    return (result?.episodes ?? []).map((ep) => ({
      id: ep.episodeId ?? String(ep.number),
      number: ep.number,
      title: ep.title ?? `Episode ${ep.number}`,
      isFiller: ep.isFiller ?? false,
    }));
  } catch {
    return [];
  }
}

/** Get streaming sources for a hianime episode id */
export async function getHiAnimeSources(
  episodeId: string,
  category: "sub" | "dub" = "sub"
): Promise<HiAnimeSource[]> {
  try {
    // getEpisodeSources(episodeId, server, category)
    const result = await scraper.getEpisodeSources(
      episodeId,
      HiAnime.Servers.VidStreaming,
      category
    );
    return (result?.sources ?? []).map((s: { url: string; type?: string }) => ({
      url: s.url,
      type: (s.type === "mp4" ? "mp4" : "m3u8") as "m3u8" | "mp4",
    }));
  } catch {
    return [];
  }
}
