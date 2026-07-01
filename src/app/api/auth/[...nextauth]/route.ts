import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (only if credentials provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Discord OAuth (only if credentials provided)
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    newUser: "/signup",
    error: "/login",
  },

  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = (user as { id?: string }).id ?? "";
        token.username = user.name ?? "";
        token.plan = "free";
        token.avatar = user.image ?? "";
        token.provider = user.email ? "oauth" : "unknown";
      }

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
