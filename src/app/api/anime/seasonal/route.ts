import { NextRequest, NextResponse } from "next/server";
import { getSeasonalAnime } from "@/lib/api/jikan";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const season = searchParams.get("season") ?? undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;

    const result = await getSeasonalAnime(year, season, page);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Seasonal anime API error:", error);
    return NextResponse.json(
      { data: [], pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}
