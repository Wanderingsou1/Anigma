import axios from "axios";
import { getCached } from "./cache";

// --- Waifu.pics ---

export async function getRandomWaifuImage(
  category: string = "waifu"
): Promise<string> {
  const cacheKey = `waifu:${category}:${Date.now() % 60000}`; // Refresh each minute
  return getCached(
    cacheKey,
    async () => {
      try {
        const response = await axios.get(
          `https://api.waifu.pics/sfw/${category}`,
          { timeout: 5000 }
        );
        return response.data.url as string;
      } catch {
        return "";
      }
    },
    60
  );
}

export async function getMultipleWaifuImages(
  category: string = "waifu",
  count: number = 5
): Promise<string[]> {
  try {
    const response = await axios.post(
      `https://api.waifu.pics/many/sfw/${category}`,
      {},
      { timeout: 5000 }
    );
    return (response.data.files as string[]).slice(0, count);
  } catch {
    return [];
  }
}

// --- trace.moe ---

export interface TraceResult {
  anilistId: number;
  filename: string;
  episode: number | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

export async function searchAnimeByScreenshot(
  imageUrl: string
): Promise<TraceResult[]> {
  try {
    const response = await axios.get(
      `https://api.trace.moe/search?url=${encodeURIComponent(imageUrl)}`,
      { timeout: 15000 }
    );

    return (response.data.result as Record<string, unknown>[])
      .slice(0, 5)
      .map((r) => ({
        anilistId: (r.anilist as number) ?? 0,
        filename: (r.filename as string) ?? "",
        episode: (r.episode as number) ?? null,
        from: (r.from as number) ?? 0,
        to: (r.to as number) ?? 0,
        similarity: (r.similarity as number) ?? 0,
        video: (r.video as string) ?? "",
        image: (r.image as string) ?? "",
      }));
  } catch {
    return [];
  }
}

// --- Studio Ghibli API ---

export interface GhibliFilm {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  director: string;
  producer: string;
  releaseDate: string;
  runningTime: string;
  rtScore: string;
  imageUrl: string;
}

export async function getGhibliFilms(): Promise<GhibliFilm[]> {
  const cacheKey = "ghibli:films";
  return getCached(
    cacheKey,
    async () => {
      try {
        const response = await axios.get(
          "https://ghibliapi.vercel.app/films",
          { timeout: 10000 }
        );

        return (response.data as Record<string, unknown>[]).map((f) => ({
          id: (f.id as string) ?? "",
          title: (f.title as string) ?? "",
          originalTitle: (f.original_title as string) ?? "",
          description: (f.description as string) ?? "",
          director: (f.director as string) ?? "",
          producer: (f.producer as string) ?? "",
          releaseDate: (f.release_date as string) ?? "",
          runningTime: (f.running_time as string) ?? "",
          rtScore: (f.rt_score as string) ?? "",
          imageUrl: (f.image as string) ?? (f.movie_banner as string) ?? "",
        }));
      } catch {
        return [];
      }
    },
    86400 // 24 hour cache — Ghibli data never changes
  );
}

// --- NekosBest ---

export async function getNekoImage(
  category: string = "neko"
): Promise<{ url: string; artist?: string }> {
  try {
    const response = await axios.get(
      `https://nekos.best/api/v2/${category}`,
      { timeout: 5000 }
    );
    const results = response.data.results as Array<Record<string, string>>;
    if (results && results.length > 0) {
      return {
        url: results[0].url ?? "",
        artist: results[0].artist_name,
      };
    }
    return { url: "" };
  } catch {
    return { url: "" };
  }
}
