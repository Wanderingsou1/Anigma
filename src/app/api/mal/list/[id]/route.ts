import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { malPatch, malDelete } from "@/lib/mal/client";

const VALID_STATUSES = ["watching", "completed", "on_hold", "dropped", "plan_to_watch"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const form: Record<string, string> = {};

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    form.status = body.status;
  }

  if (body.episode !== undefined) {
    if (!Number.isInteger(body.episode) || body.episode < 0) {
      return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
    }
    form.num_watched_episodes = String(body.episode);
  }

  if (body.score !== undefined) {
    if (!Number.isInteger(body.score) || body.score < 0 || body.score > 10) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }
    form.score = String(body.score);
  }

  if (Object.keys(form).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const data = await malPatch(session.user.id, `/anime/${malId}/my_list_status`, form);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("MAL list PATCH error:", error);
    return NextResponse.json({ error: "Failed to update MyAnimeList status" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const malId = Number(id);
  if (!Number.isInteger(malId) || malId <= 0) {
    return NextResponse.json({ error: "Invalid anime id" }, { status: 400 });
  }

  try {
    await malDelete(session.user.id, `/anime/${malId}/my_list_status`);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("MAL list DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove from MyAnimeList" }, { status: 502 });
  }
}
