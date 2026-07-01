import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  const referer = searchParams.get("ref") ?? "https://senshi.live/";
  const origin = new URL(referer).origin;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  } catch {
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  if (!response.ok) {
    return new NextResponse("Upstream error", { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isPlaylist =
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegurl") ||
    url.includes(".m3u8");

  if (isPlaylist) {
    const text = await response.text();
    const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

    const refParam = referer !== "https://senshi.live/" ? `&ref=${encodeURIComponent(referer)}` : "";
    const rewritten = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return line;
        const abs = trimmed.startsWith("http") ? trimmed : baseUrl + trimmed;
        return `/api/hls?url=${encodeURIComponent(abs)}${refParam}`;
      })
      .join("\n");

    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=10",
      },
    });
  }

  // Binary segment pass-through
  const data = await response.arrayBuffer();
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType || "video/mp2t",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
