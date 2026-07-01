import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  const referer = searchParams.get("ref") ?? "https://senshi.live/";
  const origin = new URL(referer).origin;

  // Forward the client's Range header so seeks into byte-range (fMP4 /
  // EXT-X-BYTERANGE) segments fetch the correct slice instead of the whole file.
  const range = request.headers.get("range");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...(range ? { Range: range } : {}),
      },
    });
  } catch {
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  // 200 (OK) and 206 (Partial Content) are both success for ranged requests.
  if (!response.ok && response.status !== 206) {
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
    const refParam =
      referer !== "https://senshi.live/" ? `&ref=${encodeURIComponent(referer)}` : "";

    const proxify = (target: string) => {
      const abs = target.startsWith("http") ? target : baseUrl + target;
      return `/api/hls?url=${encodeURIComponent(abs)}${refParam}`;
    };

    const rewritten = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        // Rewrite URIs embedded in tags (encryption keys, init segments, renditions).
        if (trimmed.startsWith("#")) {
          if (/#EXT-X-(KEY|MAP|MEDIA|I-FRAME-STREAM-INF)/.test(trimmed)) {
            return line.replace(/URI="([^"]+)"/i, (_m, uri) => `URI="${proxify(uri)}"`);
          }
          return line;
        }
        // Plain URI line (segment or child playlist).
        return proxify(trimmed);
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

  // Binary segment pass-through — preserve partial-content status and range headers.
  const data = await response.arrayBuffer();
  const passHeaders: Record<string, string> = {
    "Content-Type": contentType || "video/mp2t",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
  };
  const contentRange = response.headers.get("content-range");
  if (contentRange) passHeaders["Content-Range"] = contentRange;

  return new NextResponse(data, {
    status: response.status === 206 ? 206 : 200,
    headers: passHeaders,
  });
}
