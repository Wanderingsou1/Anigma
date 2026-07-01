import { NextRequest, NextResponse } from "next/server";
import { getTopAnime } from "@/lib/api/jikan";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filter = (searchParams.get("filter") ?? "") as
      | "bypopularity"
      | "favorite"
      | "airing"
      | "upcoming"
      | "";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 24;

    const result = await getTopAnime(filter, page, limit);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Top anime API error:", error);
    return NextResponse.json(
      { data: [], pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}
