import { NextRequest, NextResponse } from "next/server";
import { buildSourceResponse } from "@/lib/api/embeds";
import { getAnimeById } from "@/lib/api/jikan";
import { searchHiAnime, getHiAnimeEpisodes, getHiAnimeSources } from "@/lib/api/aniwatch";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function getAniWatchHlsUrl(
  animeTitle: string,
  episode: number,
  category: "sub" | "dub"
): Promise<string | null> {
  try {
    const hiAnimeId = await withTimeout(searchHiAnime(animeTitle), 5000);
    if (!hiAnimeId) return null;

    const episodes = await withTimeout(getHiAnimeEpisodes(hiAnimeId), 5000);
    if (!episodes) return null;
    const ep = episodes.find((e) => e.number === episode);
    if (!ep) return null;

    const sources = await withTimeout(getHiAnimeSources(ep.id, category), 5000);
    if (!sources) return null;
    const m3u8 = sources.find((s) => s.type === "m3u8" || s.url.includes(".m3u8"));
    if (!m3u8) return null;

    return `/api/hls?url=${encodeURIComponent(m3u8.url)}&ref=${encodeURIComponent("https://hianime.to/")}`;
  } catch {
    return null;
  }
}

async function getSenshiHlsUrl(
  malId: number,
  episode: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://senshi.live/episode-embeds/${malId}/${episode}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://senshi.live/",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data: { url: string | null }[] = await res.json();
    const entry = data.find((d) => d.url);
    if (!entry?.url) return null;
    return `/api/hls?url=${encodeURIComponent(entry.url)}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const { searchParams } = request.nextUrl;
    const episode = parseInt(searchParams.get("ep") ?? "1", 10);
    const serverKey = searchParams.get("server") ?? "";
    const subOrDub = searchParams.get("subOrDub") === "dub" ? "dub" : "sub";

    const anime = await getAnimeById(id);
    if (!anime?.malId) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }
    const { malId, title } = anime;

    const usingAniwatch = !serverKey || serverKey.startsWith("aniwatch");
    const usingSenshi = serverKey.startsWith("senshi");

    // Primary: aniwatch (hianime)
    if (usingAniwatch) {
      const hlsUrl = await getAniWatchHlsUrl(title, episode, subOrDub);
      if (hlsUrl) {
        const base = buildSourceResponse(malId, episode, "aniwatch-" + subOrDub, subOrDub);
        return NextResponse.json(
          { ...base, serverKey: "aniwatch-" + subOrDub, embedUrl: hlsUrl, type: "hls" },
          { headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=300" } }
        );
      }
    }

    // Secondary: Senshi
    if (usingAniwatch || usingSenshi) {
      const hlsUrl = await getSenshiHlsUrl(malId, episode);
      if (hlsUrl) {
        const base = buildSourceResponse(malId, episode, "senshi-" + subOrDub, subOrDub);
        return NextResponse.json(
          { ...base, embedUrl: hlsUrl, type: "hls" },
          { headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=300" } }
        );
      }
    }

    // Fallback: player-only iframe embeds. If no explicit iframe server was
    // chosen (empty or the server-side aniwatch key), default to a player-only
    // provider so we never embed a full third-party site page.
    // aniwatch and senshi have no player-only iframe (senshi's /watch URL is its
    // full website), so their fallback must route to a player-only provider.
    const fallbackKey =
      !serverKey ||
      serverKey.startsWith("aniwatch") ||
      serverKey.startsWith("senshi")
        ? "vidnest-" + subOrDub
        : serverKey;
    const result = buildSourceResponse(malId, episode, fallbackKey, subOrDub);
    return NextResponse.json(
      { ...result, type: "iframe" },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Sources API error:", error);
    return NextResponse.json({ error: "Failed to build sources" }, { status: 500 });
  }
}
