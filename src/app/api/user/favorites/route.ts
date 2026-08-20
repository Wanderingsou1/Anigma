import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { favoriteSchema } from "@/lib/validations/auth";
import dbConnect from "@/lib/db/mongoose";
import Favorite from "@/lib/db/models/Favorite";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const items = await Favorite.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Favorites GET error:", error);
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
    const parsed = favoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.error.issues },
        { status: 400 }
      );
    }

    await dbConnect();
    const item = await Favorite.findOneAndUpdate(
      { userId: session.user.id, animeId: parsed.data.animeId },
      { $set: parsed.data },
      { upsert: true, new: true }
    );

    return NextResponse.json({ data: item }, { status: 200 });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const animeId = searchParams.get("animeId");
    if (!animeId) {
      return NextResponse.json({ error: "animeId is required" }, { status: 400 });
    }

    await dbConnect();
    await Favorite.deleteOne({ userId: session.user.id, animeId: Number(animeId) });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
