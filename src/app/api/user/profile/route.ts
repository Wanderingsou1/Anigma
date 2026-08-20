import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { profileUpdateSchema } from "@/lib/validations/auth";
import dbConnect from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import Watchlist from "@/lib/db/models/Watchlist";
import Favorite from "@/lib/db/models/Favorite";
import WatchHistory from "@/lib/db/models/WatchHistory";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const dbUser = await User.findById(session.user.id).lean();
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: dbUser });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedProfile = profileUpdateSchema.safeParse(body);
    if (!parsedProfile.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsedProfile.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();
    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: parsedProfile.data },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Watchlist.deleteMany({ userId }),
      Favorite.deleteMany({ userId }),
      WatchHistory.deleteMany({ userId }),
    ]);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Profile DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
