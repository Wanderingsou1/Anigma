import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, getAnimeEpisodes, getAnimeRecommendations, getAnimeCharacters } from "@/lib/api/jikan";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    void request;

    const [anime, recommendations, episodes, characters] = await Promise.allSettled([
      getAnimeById(id),
      getAnimeRecommendations(id),
      getAnimeEpisodes(id, 1),
      getAnimeCharacters(id),
    ]);

    if (anime.status === "rejected" || !anime.value) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        anime: anime.value,
        characters: characters.status === "fulfilled" ? characters.value : [],
        recommendations: recommendations.status === "fulfilled" ? recommendations.value : [],
        episodes: episodes.status === "fulfilled" ? episodes.value.data : [],
        pagination: episodes.status === "fulfilled"
          ? episodes.value.pagination
          : { lastVisiblePage: 1, hasNextPage: false, currentPage: 1, totalItems: 0 },
      },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    );
  } catch (error) {
    console.error("Anime detail API error:", error);
    return NextResponse.json({ error: "Failed to fetch anime" }, { status: 500 });
  }
}
