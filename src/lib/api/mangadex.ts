import axios from "axios";
import { getCached } from "./cache";
import { MangaData } from "./types";

const MANGADEX_BASE = "https://api.mangadex.org";

/**
 * Search manga on MangaDex
 */
export async function searchManga(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<MangaData[]> {
  const cacheKey = `mangadex:search:${query}:${limit}:${offset}`;
  return getCached(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        title: query,
        limit: String(limit),
        offset: String(offset),
        "includes[]": "cover_art",
        "includes[]2": "author",
        "order[relevance]": "desc",
        "contentRating[]": "safe",
        "contentRating[]2": "suggestive",
      });

      // Fix the duplicate includes
      const url = `${MANGADEX_BASE}/manga?title=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&includes[]=cover_art&includes[]=author&order[relevance]=desc&contentRating[]=safe&contentRating[]=suggestive`;

      const response = await axios.get(url, { timeout: 10000 });
      const mangaList = response.data.data as Record<string, unknown>[];

      return mangaList.map(normalizeManga);
    },
    600
  );
}

/**
 * Get manga by ID from MangaDex
 */
export async function getMangaById(id: string): Promise<MangaData | null> {
  const cacheKey = `mangadex:manga:${id}`;
  return getCached(
    cacheKey,
    async () => {
      try {
        const url = `${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
        const response = await axios.get(url, { timeout: 10000 });
        return normalizeManga(response.data.data);
      } catch {
        return null;
      }
    },
    900
  );
}

/**
 * Get popular manga
 */
export async function getPopularManga(limit: number = 20): Promise<MangaData[]> {
  const cacheKey = `mangadex:popular:${limit}`;
  return getCached(
    cacheKey,
    async () => {
      const url = `${MANGADEX_BASE}/manga?limit=${limit}&includes[]=cover_art&includes[]=author&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`;
      const response = await axios.get(url, { timeout: 10000 });
      return (response.data.data as Record<string, unknown>[]).map(normalizeManga);
    },
    1800
  );
}

function normalizeManga(raw: Record<string, unknown>): MangaData {
  const id = raw.id as string;
  const attributes = raw.attributes as Record<string, unknown>;
  const relationships = raw.relationships as Array<Record<string, unknown>>;

  // Get title
  const title =
    (attributes?.title as Record<string, string>)?.en ??
    Object.values((attributes?.title as Record<string, string>) ?? {})[0] ??
    "";

  // Get alt titles
  const altTitlesRaw = (attributes?.altTitles as Array<Record<string, string>>) ?? [];
  const altTitles = altTitlesRaw.map((t) => Object.values(t)[0]).filter(Boolean);

  // Get description
  const descriptions = (attributes?.description as Record<string, string>) ?? {};
  const description = descriptions.en ?? Object.values(descriptions)[0] ?? "";

  // Get cover art
  let coverUrl = "";
  const coverRel = relationships?.find((r) => r.type === "cover_art");
  if (coverRel) {
    const coverAttrs = coverRel.attributes as Record<string, string> | undefined;
    const fileName = coverAttrs?.fileName;
    if (fileName) {
      coverUrl = `https://uploads.mangadex.org/covers/${id}/${fileName}.256.jpg`;
    }
  }

  // Get author
  const authorRel = relationships?.find((r) => r.type === "author");
  const authorAttrs = authorRel?.attributes as Record<string, string> | undefined;
  const author = authorAttrs?.name ?? "";

  // Get artist
  const artistRel = relationships?.find((r) => r.type === "artist");
  const artistAttrs = artistRel?.attributes as Record<string, string> | undefined;
  const artist = artistAttrs?.name ?? author;

  // Get tags
  const tagsRaw = (attributes?.tags as Array<Record<string, unknown>>) ?? [];
  const tags = tagsRaw
    .map((t) => {
      const tagAttrs = t.attributes as Record<string, unknown>;
      const names = tagAttrs?.name as Record<string, string>;
      return names?.en ?? "";
    })
    .filter(Boolean);

  return {
    id,
    title,
    altTitles,
    description,
    status: (attributes?.status as string) ?? "",
    year: (attributes?.year as number) ?? null,
    tags,
    coverUrl,
    contentRating: (attributes?.contentRating as string) ?? "",
    author,
    artist,
  };
}
