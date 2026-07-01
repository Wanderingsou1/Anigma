import { NextResponse } from "next/server";
import { SUB_SERVERS, DUB_SERVERS } from "@/lib/api/embeds";

export async function GET() {
  return NextResponse.json({
    sub: SUB_SERVERS.map((s) => ({ key: s.key, label: s.label })),
    dub: DUB_SERVERS.map((s) => ({ key: s.key, label: s.label })),
  });
}
