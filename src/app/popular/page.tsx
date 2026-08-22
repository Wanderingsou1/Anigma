import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import { getPopularAnime, AniListUnavailableError } from "@/lib/api/anilist";
import type { PaginatedResponse, AnimeData } from "@/lib/api/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Popular Anime - Anigma",
  description: "The most popular anime, ranked by audience size.",
};

export default async function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let result: PaginatedResponse<AnimeData>;
  let loadError: string | null = null;
  try {
    result = await getPopularAnime(page, 24);
  } catch (error) {
    console.error("Popular page error:", error);
    loadError =
      error instanceof AniListUnavailableError
        ? error.message
        : "Failed to load popular anime.";
    result = { data: [], pagination: { lastVisiblePage: page, hasNextPage: false, currentPage: page, totalItems: 0 } };
  }

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        <div className="relative py-14 px-4 md:px-6 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 animated-gradient opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08080f]" />
          <div className="relative max-w-[1400px] mx-auto">
            <h1 className="text-4xl md:text-5xl font-black font-[Outfit] text-white mb-3">
              🔥 <span className="gradient-text">Popular</span> Anime
            </h1>
            <p className="text-[#9898b8]">The most popular anime, ranked by audience size.</p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-1 h-6 rounded-full brand-gradient block" />
            <h2 className="text-xl font-bold font-[Outfit] text-white">Top by Popularity</h2>
            <span className="text-sm text-[#5a5a78]">({result.pagination.totalItems})</span>
          </div>

          {loadError ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold font-[Outfit] text-white mb-2">Popular anime is temporarily unavailable</h3>
              <p className="text-[#9898b8] text-sm max-w-md mx-auto">{loadError}</p>
            </div>
          ) : result.data.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold font-[Outfit] text-white mb-2">No results found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {result.data.map((anime, i) => (
                <AnimeCard key={anime.id} anime={anime} index={i} rank={(page - 1) * 24 + i + 1} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-12">
            {page > 1 && (
              <Link
                href={`/popular?page=${page - 1}`}
                className="px-6 py-2.5 rounded-full glass border border-white/10 text-sm text-white font-semibold hover:bg-white/10 transition-all"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 text-sm text-[#9898b8]">Page {page}</span>
            {result.pagination.hasNextPage && (
              <Link
                href={`/popular?page=${page + 1}`}
                className="px-6 py-2.5 rounded-full brand-gradient text-sm text-white font-bold hover:-translate-y-0.5 transition-all"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
