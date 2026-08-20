import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMalAnimeList } from "@/lib/mal/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMalAnimeList(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("MAL list GET error:", error);
    return NextResponse.json({ error: "Failed to fetch MyAnimeList data" }, { status: 502 });
  }
}
