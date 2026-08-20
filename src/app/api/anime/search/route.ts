import { NextRequest, NextResponse } from "next/server";
import { searchAniList, ANILIST_TAG_ONLY_GENRES, type AniListSort, type SearchAniListOptions } from "@/lib/api/anilist";

const STATUS_MAP: Record<string, SearchAniListOptions["status"]> = {
  airing: "RELEASING",
  ongoing: "RELEASING",
  complete: "FINISHED",
  completed: "FINISHED",
  upcoming: "NOT_YET_RELEASED",
};

const FORMAT_MAP: Record<string, string> = {
  tv: "TV",
  movie: "MOVIE",
  ova: "OVA",
  ona: "ONA",
  special: "SPECIAL",
};

function resolveSort(orderBy: string | null, sortDir: string | null): AniListSort | undefined {
  if (!orderBy) return undefined;
  switch (orderBy) {
    case "popularity":
      return "POPULARITY_DESC";
    case "score":
    case "rating":
      return "SCORE_DESC";
    case "start_date":
      return "START_DATE_DESC";
    case "title":
      return "TITLE_ROMAJI";
    default:
      return sortDir === "asc" ? "TITLE_ROMAJI" : "POPULARITY_DESC";
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") ?? "";
    const genreParam = searchParams.get("genres")?.split(",")[0] || undefined;
    const isTag = genreParam ? ANILIST_TAG_ONLY_GENRES.has(genreParam.toLowerCase()) : false;
    const genre = genreParam && !isTag ? genreParam : undefined;
    const tag = genreParam && isTag ? genreParam : undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 24;

    const type = searchParams.get("type");
    const format = type ? FORMAT_MAP[type.toLowerCase()] : undefined;

    const statusParam = searchParams.get("status");
    const status = statusParam ? STATUS_MAP[statusParam.toLowerCase()] : undefined;

    const orderBy = searchParams.get("orderBy") ?? searchParams.get("order_by");
    const sort = resolveSort(orderBy, searchParams.get("sort"));

    const result = await searchAniList(q, page, limit, { genre, tag, format, status, sort });
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
