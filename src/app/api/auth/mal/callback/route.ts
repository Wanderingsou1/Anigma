import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { exchangeCodeForToken, MAL_API_BASE } from "@/lib/mal/client";
import dbConnect from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";

const PKCE_COOKIE = "mal_pkce_verifier";
const STATE_COOKIE = "mal_oauth_state";
const CALLBACK_COOKIE = "mal_callback_url";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, must match authOptions.session.maxAge

function usernameFromMal(malUsername: string, malUserId: number): string {
  const base = malUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16);
  return base.length >= 3 ? base : `mal${malUserId}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const codeVerifier = request.cookies.get(PKCE_COOKIE)?.value;
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const callbackUrl = request.cookies.get(CALLBACK_COOKIE)?.value || "/home";

  const fail = (reason: string) => {
    const url = new URL("/login", baseUrl);
    url.searchParams.set("malError", reason);
    const res = NextResponse.redirect(url);
    res.cookies.delete(PKCE_COOKIE);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(CALLBACK_COOKIE);
    return res;
  };

  if (!code || !codeVerifier) return fail("missing_code");
  if (!state || !expectedState || state !== expectedState) return fail("invalid_state");

  try {
    const token = await exchangeCodeForToken(code, codeVerifier);

    const meRes = await fetch(`${MAL_API_BASE}/users/@me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!meRes.ok) return fail("profile_fetch_failed");
    const me: { id: number; name: string } = await meRes.json();

    await dbConnect();
    let user = await User.findOne({ malUserId: me.id });
    if (!user) {
      let username = usernameFromMal(me.name, me.id);
      // Extremely unlikely collision (different MAL user, sanitized name matches) — fall back to a unique suffix.
      if (await User.exists({ username })) username = `${username}${me.id}`.slice(0, 20);
      user = await User.create({
        username,
        malUserId: me.id,
        malUsername: me.name,
        malAccessToken: token.access_token,
        malRefreshToken: token.refresh_token,
        malTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      });
    } else {
      user.malUsername = me.name;
      user.malAccessToken = token.access_token;
      user.malRefreshToken = token.refresh_token;
      user.malTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);
      await user.save();
    }

    const sessionToken = await encode({
      token: {
        userId: user._id.toString(),
        username: user.username,
        plan: user.plan,
        avatar: user.avatar,
        provider: "mal",
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: SESSION_MAX_AGE,
    });

    const useSecureCookies = baseUrl.startsWith("https://");
    const cookieName = `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`;

    const redirectUrl = new URL(callbackUrl, baseUrl);
    redirectUrl.searchParams.set("malLoggedIn", "1");

    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: useSecureCookies,
      maxAge: SESSION_MAX_AGE,
    });
    res.cookies.delete(PKCE_COOKIE);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(CALLBACK_COOKIE);
    return res;
  } catch (error) {
    console.error("MAL login callback error:", error);
    return fail("exchange_failed");
  }
}
