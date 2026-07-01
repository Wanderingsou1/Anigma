import { NextResponse } from "next/server";
import { getTrendingAnime } from "@/lib/api/anilist";

export async function GET() {
  try {
    const data = await getTrendingAnime(1, 24);
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
    );
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
