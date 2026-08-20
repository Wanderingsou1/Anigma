import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import Carousel from "@/components/Carousel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getTrendingAnime,
  getTopRatedAnime,
  getOngoingAnime,
  getCompletedAnime,
  getRecommendedAnime,
} from "@/lib/api/anilist";
import Link from "next/link";
import MalLoginToast from "@/components/MalLoginToast";
import ContinueWatching from "@/components/ContinueWatching";

export const metadata = {
  title: "Home — Anigma",
  description: "Your anime dashboard. Trending, new releases, top rated, and more.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Fetch anime data from APIs in parallel
  const [
    trendingRes,
    topRatedRes,
    ongoingRes,
    completedRes,
    recommendedRes
  ] = await Promise.allSettled([
    getTrendingAnime(1, 10),
    getTopRatedAnime(1, 10),
    getOngoingAnime(1, 10),
    getCompletedAnime(1, 10),
    getRecommendedAnime(10),
  ]);

  for (const [label, res] of [
    ["trending", trendingRes],
    ["topRated", topRatedRes],
    ["ongoing", ongoingRes],
    ["completed", completedRes],
    ["recommended", recommendedRes],
  ] as const) {
    if (res.status === "rejected") {
      console.error(`[HomePage] Failed to fetch "${label}" section:`, res.reason);
    }
  }

  const trending = trendingRes.status === "fulfilled" ? trendingRes.value : [];
  const topRated = topRatedRes.status === "fulfilled" ? topRatedRes.value : [];
  const ongoing = ongoingRes.status === "fulfilled" ? ongoingRes.value : [];
  const completed = completedRes.status === "fulfilled" ? completedRes.value : [];
  const recommended = recommendedRes.status === "fulfilled" ? recommendedRes.value : [];

  // Hero featured slides: Use top 5 trending
  const featured = trending.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <MalLoginToast />
      
      {featured.length > 0 ? (
        <HeroBanner anime={featured} />
      ) : (
        <div className="pt-24 px-6 text-center text-[#9898b8]">
          <div className="h-64 w-full rounded-2xl bg-white/5 animate-pulse flex items-center justify-center">
            Loading Banner...
          </div>
        </div>
      )}

      <div className="pt-8 pb-4">
        {session?.user ? (
          <div className="mb-10 px-4 md:px-6">
            <ContinueWatching />
          </div>
        ) : (
          <section className="mb-10 px-4 md:px-6">
            <div className="glass border border-[#7c3aed]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
              <div>
                <h3 className="font-bold text-white text-base md:text-lg mb-1 font-[Outfit]">Sync your watch history across all devices</h3>
                <p className="text-[#9898b8] text-xs md:text-sm">Sign in with MyAnimeList to resume your favorite series right where you left off.</p>
              </div>
              <Link href="/login" className="px-6 py-2.5 rounded-full brand-gradient text-white text-xs font-bold whitespace-nowrap hover:shadow-[0_4px_16px_rgba(124,58,237,0.4)] transition-all">
                Sign In Now
              </Link>
            </div>
          </section>
        )}

        <Carousel title="🔥 Trending Now" anime={trending} viewAllHref="/browse?filter=trending" />
        <Carousel title="⭐ Top Rated" anime={topRated} viewAllHref="/browse?filter=top" />
        <Carousel title="▶️ Ongoing Series" anime={ongoing} viewAllHref="/browse?status=ongoing" />
        <Carousel title="✅ Completed Series" anime={completed} viewAllHref="/browse?status=completed" />
        <Carousel title="💡 Recommended for You" anime={recommended} viewAllHref="/browse" />

        {/* Genre Quick Links */}
        <section className="px-4 md:px-6 mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 rounded-full brand-gradient block" />
            <h2 className="text-xl md:text-2xl font-bold font-[Outfit] text-white">Browse by Genre</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Action", icon: "⚔️", color: "from-red-900/50 to-red-950/80 border-red-800/40" },
              { label: "Fantasy", icon: "🔮", color: "from-purple-900/50 to-purple-950/80 border-purple-800/40" },
              { label: "Romance", icon: "💕", color: "from-pink-900/50 to-pink-950/80 border-pink-800/40" },
              { label: "Isekai", icon: "🌀", color: "from-cyan-900/50 to-cyan-950/80 border-cyan-800/40" },
              { label: "Horror", icon: "👻", color: "from-gray-900/60 to-gray-950/90 border-gray-700/40" },
              { label: "Comedy", icon: "😂", color: "from-yellow-900/50 to-yellow-950/80 border-yellow-800/40" },
            ].map((g) => (
              <a key={g.label} href={`/genre/${g.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border bg-gradient-to-b ${g.color} hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer`}>
                <span className="text-3xl">{g.icon}</span>
                <span className="text-sm font-bold text-white font-[Outfit]">{g.label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
