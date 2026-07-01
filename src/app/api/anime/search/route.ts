import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/api/jikan";
import type { SearchFilters } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: SearchFilters = {
      q: searchParams.get("q") ?? undefined,
      genres: searchParams.get("genres") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      orderBy: searchParams.get("orderBy") ?? searchParams.get("order_by") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 24,
      minScore: searchParams.get("minScore") ? parseFloat(searchParams.get("minScore")!) : undefined,
      maxScore: searchParams.get("maxScore") ? parseFloat(searchParams.get("maxScore")!) : undefined,
      sfw: searchParams.get("sfw") !== "false",
    };

    const result = await searchAnime(filters);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search anime", data: [], pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}
