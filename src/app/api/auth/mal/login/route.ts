import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { MAL_AUTHORIZE_URL } from "@/lib/mal/client";

const PKCE_COOKIE = "mal_pkce_verifier";
const STATE_COOKIE = "mal_oauth_state";
const CALLBACK_COOKIE = "mal_callback_url";

function randomUrlSafeString(bytes: number): string {
  return randomBytes(bytes).toString("base64url");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.MAL_CLIENT_ID;
  const redirectUri = process.env.MAL_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "MAL login is not configured" }, { status: 500 });
  }

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/home";

  // MAL only supports the "plain" PKCE method, so the challenge is the verifier itself.
  const codeVerifier = randomUrlSafeString(64);
  const state = randomUrlSafeString(16);

  const authorizeUrl = new URL(MAL_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("code_challenge", codeVerifier);
  authorizeUrl.searchParams.set("code_challenge_method", "plain");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/mal",
    maxAge: 600,
  };
  response.cookies.set(PKCE_COOKIE, codeVerifier, cookieOpts);
  response.cookies.set(STATE_COOKIE, state, cookieOpts);
  response.cookies.set(CALLBACK_COOKIE, callbackUrl, cookieOpts);

  return response;
}
