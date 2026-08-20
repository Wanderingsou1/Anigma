import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { trackWatchProgress } from "@/lib/mal/client";
import dbConnect from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const malId = Number(id);
  if (!Number.isInteger(malId) || malId <= 0) {
    return NextResponse.json({ error: "Invalid anime id" }, { status: 400 });
  }

  const body = await request.json();
  const episode = Number(body.episode);
  if (!Number.isInteger(episode) || episode <= 0) {
    return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findById(session.user.id).select("malSyncEnabled").lean();
    if (!user?.malSyncEnabled) {
      return NextResponse.json({ data: { synced: false, reason: "sync_disabled" } });
    }

    const result = await trackWatchProgress(session.user.id, malId, episode);
    if (!result) {
      return NextResponse.json({ data: { synced: false, reason: "no_mal_account" } });
    }
    return NextResponse.json({ data: { synced: true, ...result } });
  } catch (error) {
    console.error("MAL track error:", error);
    return NextResponse.json({ error: "Failed to sync watch progress" }, { status: 502 });
  }
}
