import { NextResponse } from "next/server";
import { getTrendingAnime, AniListUnavailableError } from "@/lib/api/anilist";

export async function GET() {
  try {
    const data = await getTrendingAnime(1, 24);
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (error) {
    console.error("Trending API error:", error);
    const unavailable = error instanceof AniListUnavailableError;
    return NextResponse.json(
      {
        error: unavailable ? "anilist_unavailable" : "trending_failed",
        message: unavailable ? error.message : "Failed to load trending anime",
        data: [],
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}
