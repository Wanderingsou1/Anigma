"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import { GENRES } from "@/lib/data";
import { AnimeData, PaginatedResponse } from "@/lib/api/types";
import { GridSkeleton } from "@/components/LoadingSkeleton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TYPES = ["All", "TV", "Movie", "OVA", "ONA", "Special"];
const STATUSES = ["All", "ongoing", "completed", "upcoming"];
const YEARS = ["All", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2015", "2010", "2005", "2000"];
const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity" },
  { label: "Rating", value: "rating" },
  { label: "Title A–Z", value: "title" },
  { label: "Newest", value: "year" },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "";
  const initialStatus = searchParams.get("status") || "All";

  const [activeTab, setActiveTab] = useState<"browse" | "schedule">("browse");

  // Browse state
  const [animeList, setAnimeList] = useState<AnimeData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedYear, setSelectedYear] = useState("All");
  const [sortBy, setSortBy] = useState(
    initialFilter === "new" ? "year" : initialFilter === "popular" ? "popularity" : initialFilter === "top" ? "rating" : "popularity"
  );
  const [searchQ, setSearchQ] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Schedule state
  const [scheduleData, setScheduleData] = useState<Array<{ day: string; anime: AnimeData[] }>>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQ);
    }, 450); // Wait 400ms for debouncing
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQ]);

  // If searchQ is empty, set debouncedSearch immediately
  useEffect(() => {
    if (!searchQ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDebouncedSearch("");
    }
  }, [searchQ]);

  // Fetch browse anime
  const fetchAnime = async (page: number, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Map filters
      if (searchQ.trim()) params.set("q", searchQ.trim());
      
      if (selectedGenres.length > 0) {
        params.set("genres", selectedGenres.join(","));
      }

      if (selectedType !== "All") params.set("type", selectedType);

      if (selectedStatus !== "All") {
        const apiStatus =
          selectedStatus === "ongoing" ? "airing" :
          selectedStatus === "completed" ? "complete" :
          selectedStatus === "upcoming" ? "upcoming" : "";
        if (apiStatus) params.set("status", apiStatus);
      }

      if (selectedYear !== "All") {
        params.set("minScore", "1"); // Ensure valid years
      }

      // Sort mapping
      if (sortBy === "popularity") {
        params.set("orderBy", "popularity");
        params.set("sort", "desc");
      } else if (sortBy === "rating") {
        params.set("orderBy", "score");
        params.set("sort", "desc");
      } else if (sortBy === "title") {
        params.set("orderBy", "title");
        params.set("sort", "asc");
      } else if (sortBy === "year") {
        params.set("orderBy", "start_date");
        params.set("sort", "desc");
      }

      params.set("page", String(page));
      params.set("limit", "20");

      const response = await fetch(`/api/anime/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search failed");
      const resData: PaginatedResponse<AnimeData> = await response.json();

      let finalData = resData.data;

      // Client-side filter for Year since Jikan API doesn't support a direct ?year parameter on search/anime
      if (selectedYear !== "All") {
        finalData = finalData.filter((a) => a.year === parseInt(selectedYear));
      }

      if (append) {
        setAnimeList((prev) => [...prev, ...finalData]);
      } else {
        setAnimeList(finalData);
      }

      setCurrentPage(resData.pagination.currentPage);
      setHasNextPage(resData.pagination.hasNextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch schedule
  const fetchSchedule = async () => {
    setIsLoadingSchedule(true);
    try {
      const response = await fetch("/api/anime/schedule");
      if (!response.ok) throw new Error("Schedule fetch failed");
      const resData = await response.json();
      setScheduleData(resData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Trigger search on filter change
  useEffect(() => {
    if (activeTab === "browse") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
      fetchAnime(1, false);
    } else {
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenres, selectedType, selectedStatus, selectedYear, sortBy, debouncedSearch, activeTab]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoading) {
      fetchAnime(currentPage + 1, true);
    }
  };

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        {/* Page Header */}
        <div className="relative py-14 px-4 md:px-6 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 animated-gradient opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08080f]" />
          <div className="relative max-w-[1400px] mx-auto">
            <h1 className="text-4xl md:text-5xl font-black font-[Outfit] text-white mb-3">
              Browse <span className="gradient-text">Anime</span>
            </h1>
            <p className="text-[#9898b8]">Discover thousands of anime across every genre, type, and season.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[70px] z-30 bg-[#08080f]/95 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-1">
              {(["browse", "schedule"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                    activeTab === tab ? "brand-gradient text-white shadow-lg" : "text-[#9898b8] hover:text-white hover:bg-white/8"
                  }`}
                >
                  {tab === "schedule" ? "📅 Schedule" : "🎬 Browse"}
                </button>
              ))}
            </div>
            {activeTab === "browse" && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-[#9898b8] hover:text-white transition-all lg:hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filters {selectedGenres.length > 0 && <span className="w-5 h-5 rounded-full brand-gradient flex items-center justify-center text-xs text-white font-bold">{selectedGenres.length}</span>}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
          {activeTab === "schedule" ? (
            isLoadingSchedule ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="glass border border-white/6 rounded-2xl p-5 h-64 animate-pulse bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up">
                {scheduleData.map(({ day, anime }) => (
                  <div key={day} className="glass border border-white/6 rounded-2xl p-5 hover:border-[#7c3aed]/30 transition-all">
                    <h3 className="font-bold font-[Outfit] text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full brand-gradient" />{day}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {anime && anime.slice(0, 15).map((a: AnimeData) => (
                        <li key={a.malId} className="flex items-center gap-2 text-sm text-[#9898b8] hover:text-white transition-colors cursor-pointer">
                          <Link href={`/anime/${encodeURIComponent(a.id || String(a.malId))}`} className="flex items-center gap-2 truncate w-full">
                            <svg className="w-3 h-3 fill-[#7c3aed] flex-shrink-0" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            <span className="truncate">{a.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex gap-8">
              {/* Sidebar Filters */}
              <aside className={`${sidebarOpen ? "fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto glass border-r border-white/8 p-6" : "hidden"} lg:relative lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0`}>
                {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 text-[#9898b8] hover:text-white">✕</button>}

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Search</label>
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search anime..."
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/60 transition-all"
                  />
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#7c3aed]/60 transition-all cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selectedType === t ? "brand-gradient text-white border-transparent" : "border-white/10 text-[#9898b8] hover:border-[#7c3aed]/40 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Status</label>
                  <div className="flex flex-col gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-3 py-2 rounded-xl text-sm text-left capitalize transition-all ${
                          selectedStatus === s ? "bg-[#7c3aed]/20 text-[#a855f7] border border-[#7c3aed]/40" : "text-[#9898b8] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {s === "All" ? "All Statuses" : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#7c3aed]/60 transition-all cursor-pointer"
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>)}
                  </select>
                </div>

                {/* Genres */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest">Genres</label>
                    {selectedGenres.length > 0 && (
                      <button onClick={() => setSelectedGenres([])} className="text-xs text-[#7c3aed] hover:text-[#a855f7]">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-left transition-all ${
                          selectedGenres.includes(g) ? "bg-[#7c3aed]/20 text-[#a855f7]" : "text-[#9898b8] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                          selectedGenres.includes(g) ? "border-[#7c3aed] bg-[#7c3aed]" : "border-white/20"
                        }`}>
                          {selectedGenres.includes(g) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        </span>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-[#9898b8]">
                    {isLoading && currentPage === 1 ? (
                      <span>Searching anime...</span>
                    ) : (
                      <span className="text-white font-bold">{animeList.length}</span>
                    )} results found
                  </p>
                  <div className="hidden lg:flex items-center gap-2">
                    <span className="text-xs text-[#5a5a78]">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                    >
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {isLoading && currentPage === 1 ? (
                  <GridSkeleton count={10} />
                ) : animeList.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold font-[Outfit] text-white mb-2">No results found</h3>
                    <p className="text-[#9898b8] text-sm">Try adjusting your filters or search term.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {animeList.map((anime, i) => (
                        <AnimeCard key={anime.malId} anime={anime} index={i} />
                      ))}
                    </div>

                    {hasNextPage && (
                      <div className="flex justify-center mt-12">
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoading}
                          className="px-8 py-3 rounded-full brand-gradient text-white text-sm font-bold font-[Outfit] shadow-lg hover:shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 disabled:opacity-60 transition-all flex items-center gap-2"
                        >
                          {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
