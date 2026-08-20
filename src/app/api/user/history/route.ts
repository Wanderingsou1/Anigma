import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { watchHistorySchema } from "@/lib/validations/auth";
import dbConnect from "@/lib/db/mongoose";
import WatchHistory from "@/lib/db/models/WatchHistory";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const history = await WatchHistory.find({ userId: session.user.id })
      .sort({ watchedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error("Watch history GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = watchHistorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();
    const entry = await WatchHistory.findOneAndUpdate(
      {
        userId: session.user.id,
        animeId: parsed.data.animeId,
        episodeNumber: parsed.data.episodeNumber,
      },
      { $set: { ...parsed.data, watchedAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ data: entry }, { status: 200 });
  } catch (error) {
    console.error("Watch history POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
