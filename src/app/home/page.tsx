import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import Carousel from "@/components/Carousel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTrendingAnime } from "@/lib/api/anilist";
import { getTopAnime, searchAnime, getSeasonalAnime } from "@/lib/api/jikan";
import Image from "next/image";
import Link from "next/link";

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
    getTopAnime("favorite", 1, 10),
    getTopAnime("airing", 1, 10),
    searchAnime({ status: "completed", limit: 10, orderBy: "popularity", sort: "desc" }),
    searchAnime({ limit: 10, minScore: 8, orderBy: "rank", sort: "asc" }),
  ]);

  const trending = trendingRes.status === "fulfilled" ? trendingRes.value : [];
  const topRated = topRatedRes.status === "fulfilled" ? topRatedRes.value.data : [];
  const ongoing = ongoingRes.status === "fulfilled" ? ongoingRes.value.data : [];
  const completed = completedRes.status === "fulfilled" ? completedRes.value.data : [];
  const recommended = recommendedRes.status === "fulfilled" ? recommendedRes.value.data : [];

  // Hero featured slides: Use top 5 trending
  const featured = trending.slice(0, 5);

  // Watch history is disabled because the database layer was removed.
  const continueWatching: any[] = [];

  const hasContinueWatching = continueWatching.length > 0;

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      
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
        {/* Continue Watching Section */}
        <section className="mb-10 px-4 md:px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold font-[Outfit] text-white">
              <span className="w-1 h-6 rounded-full brand-gradient block" />
              Continue Watching
            </h2>
          </div>

          {session?.user ? (
            hasContinueWatching ? (
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
                {continueWatching.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/watch/${item.animeId}?ep=${item.episodeNumber}`}
                    className="flex-none w-72 glass border border-white/6 rounded-xl overflow-hidden hover:border-[#7c3aed]/40 transition-all group cursor-pointer"
                  >
                    <div className="relative h-40 bg-[#12121f]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            background: [
                              "linear-gradient(135deg,#7c3aed,#4c1d95)",
                              "linear-gradient(135deg,#06b6d4,#0c4a6e)",
                              "linear-gradient(135deg,#e63946,#450a0a)",
                              "linear-gradient(135deg,#f59e0b,#451a03)",
                            ][i % 4],
                          }}
                        >
                          <span className="text-6xl font-black text-white/20 font-[Outfit]">
                            {item.title[0]}
                          </span>
                        </div>
                      )}
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                        <div className="h-full brand-gradient" style={{ width: `${item.progress}%` }} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white ml-0.5 fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white font-[Outfit] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#9898b8] mt-0.5">
                        Episode {item.episodeNumber} · {item.progress}% completed
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass border border-white/5 rounded-2xl p-6 text-center text-[#9898b8] max-w-lg">
                <p className="text-sm">You haven't watched any anime yet. Start streaming to track your progress!</p>
              </div>
            )
          ) : (
            <div className="glass border border-[#7c3aed]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
              <div>
                <h3 className="font-bold text-white text-base md:text-lg mb-1 font-[Outfit]">Sync your watch history across all devices</h3>
                <p className="text-[#9898b8] text-xs md:text-sm">Create a free account or log in to resume your favorite series right where you left off.</p>
              </div>
              <Link href="/login" className="px-6 py-2.5 rounded-full brand-gradient text-white text-xs font-bold whitespace-nowrap hover:shadow-[0_4px_16px_rgba(124,58,237,0.4)] transition-all">
                Sign In Now
              </Link>
            </div>
          )}
        </section>

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
