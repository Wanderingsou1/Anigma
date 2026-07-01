import { NextRequest, NextResponse } from "next/server";
import { getAnimeByGenre } from "@/lib/api/jikan";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ genreId: string }> }
) {
  try {
    const { genreId } = await params;
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 24;

    const result = await getAnimeByGenre(genreId, page, limit);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Genre API error:", error);
    return NextResponse.json(
      { data: [], pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}
