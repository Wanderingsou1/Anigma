import { NextRequest, NextResponse } from "next/server";
import { getAnimeSchedule } from "@/lib/api/jikan";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const day = searchParams.get("day") ?? undefined;

    const result = await getAnimeSchedule(day);

    return NextResponse.json(
      { data: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
