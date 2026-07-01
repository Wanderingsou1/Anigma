import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, getAnimeEpisodes } from "@/lib/api/jikan";
import { searchHiAnime, getHiAnimeEpisodes } from "@/lib/api/aniwatch";

/** Fetch Jikan episode pages one at a time to avoid rate limiting */
async function fetchAllJikanEpisodes(id: string, totalPages: number) {
  const DELAY_MS = 350;
  const allData: Awaited<ReturnType<typeof getAnimeEpisodes>>["data"] = [];

  for (let page = 2; page <= totalPages; page++) {
    const result = await getAnimeEpisodes(id, page);
    allData.push(...result.data);
    if (page < totalPages) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  return allData;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  try {
    const anime = await getAnimeById(id);
    if (!anime) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Try hianime first — complete list in one call (5s timeout for ISP-blocked regions)
    const hiAnimeId = await Promise.race([
      searchHiAnime(anime.title),
      new Promise<null>((r) => setTimeout(() => r(null), 5000)),
    ]);
    if (hiAnimeId) {
      const episodes = await Promise.race([
        getHiAnimeEpisodes(hiAnimeId),
        new Promise<never[]>((r) => setTimeout(() => r([]), 5000)),
      ]);
      if (episodes.length > 0) {
        return NextResponse.json(
          { episodes, hiAnimeId, source: "hianime" },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
        );
      }
    }

    // Fallback: fetch all Jikan pages sequentially in batches to avoid rate limiting
    const page1 = await getAnimeEpisodes(id, 1);
    let episodes = [...page1.data];

    if (page1.pagination.hasNextPage && page1.pagination.lastVisiblePage > 1) {
      const remaining = await fetchAllJikanEpisodes(id, page1.pagination.lastVisiblePage);
      episodes = [...episodes, ...remaining];
    }

    // Sort by episode number to fix any out-of-order results from parallel batches
    episodes.sort((a, b) => a.number - b.number);

    return NextResponse.json(
      { episodes, source: "jikan" },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    console.error("Episodes API error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
