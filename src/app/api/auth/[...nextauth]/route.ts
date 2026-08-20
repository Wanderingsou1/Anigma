import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

// No providers are registered here: MAL's OAuth2 only supports PKCE
// "plain" code challenges, which next-auth v4's built-in provider/PKCE
// handling can't express (it always generates S256). Login instead happens
// entirely through the hand-rolled /api/auth/mal/login + /callback routes,
// which mint a session by encoding a next-auth-compatible JWT directly and
// setting the session cookie. This file stays around so getServerSession,
// useSession, and signOut keep working against that cookie everywhere else
// in the app.
export const authOptions: NextAuthOptions = {
  providers: [],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    // Only reached via the client-side update() call (e.g. profile settings save) —
    // initial sign-in never goes through here since there are no providers.
    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.username) token.username = session.username;
        if (session.plan) token.plan = session.plan;
        if (session.avatar) token.avatar = session.avatar;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).plan = token.plan;
        (session.user as Record<string, unknown>).avatar = token.avatar;
        (session.user as Record<string, unknown>).provider = token.provider;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
