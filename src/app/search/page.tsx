"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import { GENRES } from "@/lib/data";
import { AnimeData, PaginatedResponse } from "@/lib/api/types";
import { GridSkeleton } from "@/components/LoadingSkeleton";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [activeGenre, setActiveGenre] = useState("All");
  const [results, setResults] = useState<AnimeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trending, setTrending] = useState<AnimeData[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Debouncing logic
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 450); // Debounce typing for 400ms
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Load trending if query is empty
  const fetchTrending = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const response = await fetch("/api/anime/trending");
      if (!response.ok) throw new Error("Failed to fetch trending");
      const data = await response.json();
      setTrending(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // Fetch search results
  const fetchResults = useCallback(async (q: string, genre: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      
      if (genre !== "All") {
        params.set("genres", genre);
      }
      
      params.set("limit", "24");

      const response = await fetch(`/api/anime/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search request failed");
      const data: PaginatedResponse<AnimeData> = await response.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search on query or genre change
  useEffect(() => {
    if (debouncedQuery.trim() || activeGenre !== "All") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchResults(debouncedQuery, activeGenre);
    } else {
      setResults([]);
      if (trending.length === 0) {
        fetchTrending();
      }
    }
  }, [debouncedQuery, activeGenre, fetchTrending, fetchResults, trending.length]);

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        {/* Search Header */}
        <div className="relative py-12 px-4 md:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-8" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08080f]" />
          <div className="relative max-w-3xl mx-auto">
            <h1 className="text-2xl font-black font-[Outfit] text-white mb-6 text-center">Search Anime</h1>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a5a78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by title, genre, or studio..."
                className="w-full bg-[#12121f] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-base text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/60 focus:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a78] hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
          {/* Genre filter chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", ...GENRES.slice(0, 12)].map(g => (
              <button key={g} onClick={() => setActiveGenre(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  activeGenre === g
                    ? "brand-gradient text-white border-transparent shadow-[0_4px_12px_rgba(124,58,237,0.4)]"
                    : "border-white/10 text-[#9898b8] hover:border-[#7c3aed]/40 hover:text-white"
                }`}>
                {g}
              </button>
            ))}
          </div>

          {/* Results */}
          {query.trim() || activeGenre !== "All" ? (
            <>
              <p className="text-sm text-[#9898b8] mb-6">
                {isLoading ? (
                  <span>Searching...</span>
                ) : results.length > 0 ? (
                  <><span className="text-white font-bold">{results.length}</span> results {query ? `for "${query}"` : ""}</>
                ) : (
                  "No results found"
                )}
              </p>
              
              {isLoading ? (
                <GridSkeleton count={12} />
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((anime, i) => <AnimeCard key={anime.malId} anime={anime} index={i} />)}
                </div>
              ) : (
                <div className="text-center py-24 animate-fade-in-up">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold font-[Outfit] text-white mb-2">No results found</h3>
                  <p className="text-[#9898b8] text-sm mb-6">Try a different title, genre, or studio name.</p>
                  <button onClick={() => { setQuery(""); setActiveGenre("All"); }}
                    className="px-6 py-2.5 rounded-full brand-gradient text-white font-bold text-sm">
                    Clear Search
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Default state — trending searches */
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1 h-6 rounded-full brand-gradient block" />
                <h2 className="text-xl font-bold font-[Outfit] text-white">Trending Searches</h2>
              </div>
              <div className="flex flex-wrap gap-3 mb-10">
                {["Attack on Titan", "Jujutsu Kaisen", "One Piece", "Demon Slayer", "Death Note", "My Hero Academia", "Naruto", "Steins;Gate"].map(term => (
                  <button key={term} onClick={() => setQuery(term)}
                    className="flex items-center gap-2 px-4 py-2 glass border border-white/8 rounded-full text-sm text-[#9898b8] hover:text-white hover:border-[#7c3aed]/40 transition-all">
                    <svg className="w-3.5 h-3.5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {term}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1 h-6 rounded-full brand-gradient block" />
                <h2 className="text-xl font-bold font-[Outfit] text-white">All Anime</h2>
              </div>
              
              {isLoadingTrending ? (
                <GridSkeleton count={12} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {trending.map((anime, i) => <AnimeCard key={anime.malId} anime={anime} index={i} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f]" />}>
      <SearchContent />
    </Suspense>
  );
}
