"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import type { MalListEntry, MalListStatus } from "@/lib/mal/client";
import type { AnimeData } from "@/lib/api/types";

const STATUS_FILTERS: { value: MalListStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "watching", label: "Watching" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "plan_to_watch", label: "Plan to Watch" },
  { value: "dropped", label: "Dropped" },
];

const MAL_STATUS_OPTIONS: { value: MalListStatus; label: string }[] = [
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "plan_to_watch", label: "Plan to Watch" },
];

const SORT_OPTIONS = [
  { value: "updated", label: "Recently Updated" },
  { value: "title", label: "Title A–Z" },
  { value: "score", label: "My Score" },
  { value: "rating", label: "Rating" },
];

export default function WatchlistPage() {
  const { status: sessionStatus } = useSession();

  const [malList, setMalList] = useState<MalListEntry[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<MalListStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated");

  // Add-anime search
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<AnimeData[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const addTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/mal/list")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setMalList(json.data))
      .catch(() => setMalList([]));
  }, [sessionStatus]);

  useEffect(() => {
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(async () => {
      if (!addQuery.trim()) {
        setAddResults([]);
        return;
      }
      setAddLoading(true);
      try {
        const res = await fetch(`/api/anime/search?q=${encodeURIComponent(addQuery)}&limit=8`);
        const json = await res.json();
        setAddResults(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setAddLoading(false);
      }
    }, 400);
    return () => {
      if (addTimerRef.current) clearTimeout(addTimerRef.current);
    };
  }, [addQuery]);

  const existingIds = new Set((malList ?? []).map((e) => e.anime.malId));

  const handleAdd = async (anime: AnimeData) => {
    if (!anime.malId) return;
    setBusyId(anime.malId);
    try {
      const res = await fetch(`/api/mal/list/${anime.malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "plan_to_watch" }),
      });
      if (res.ok) {
        setMalList((prev) => [
          ...(prev ?? []),
          { anime, listStatus: "plan_to_watch", malProgress: 0, userScore: 0, updatedAt: new Date().toISOString() },
        ]);
        setAddQuery("");
        setAddResults([]);
        setAddOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (malId: number, title: string) => {
    if (!window.confirm(`Remove "${title}" from your MyAnimeList?`)) return;
    setBusyId(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, { method: "DELETE" });
      if (res.ok) {
        setMalList((prev) => (prev ?? []).filter((e) => e.anime.malId !== malId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (malId: number, newStatus: MalListStatus) => {
    setBusyId(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMalList((prev) =>
          (prev ?? []).map((e) => (e.anime.malId === malId ? { ...e, listStatus: newStatus } : e))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleEpisodeChange = async (entry: MalListEntry, delta: number) => {
    const malId = entry.anime.malId;
    const total = entry.anime.episodes || 0;
    const raw = (entry.malProgress || 0) + delta;
    const newEpisode = total > 0 ? Math.max(0, Math.min(raw, total)) : Math.max(0, raw);
    if (newEpisode === entry.malProgress) return;

    let newStatus = entry.listStatus;
    if (delta > 0) {
      if (total > 0 && newEpisode >= total) newStatus = "completed";
      else if (entry.listStatus === "plan_to_watch") newStatus = "watching";
    }

    setBusyId(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episode: newEpisode,
          ...(newStatus !== entry.listStatus ? { status: newStatus } : {}),
        }),
      });
      if (res.ok) {
        setMalList((prev) =>
          (prev ?? []).map((e) =>
            e.anime.malId === malId ? { ...e, malProgress: newEpisode, listStatus: newStatus } : e
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleScoreChange = async (malId: number, newScore: number) => {
    setBusyId(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: newScore }),
      });
      if (res.ok) {
        setMalList((prev) =>
          (prev ?? []).map((e) => (e.anime.malId === malId ? { ...e, userScore: newScore } : e))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = (malList ?? [])
    .filter((e) => statusFilter === "all" || e.listStatus === statusFilter)
    .filter((e) => !query.trim() || e.anime.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "title") return a.anime.title.localeCompare(b.anime.title);
      if (sortBy === "score") return (b.userScore || 0) - (a.userScore || 0);
      if (sortBy === "rating") return (b.anime.rating || 0) - (a.anime.rating || 0);
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <main className="min-h-screen bg-[#08080f]">
        <Navbar />
        <div className="pt-[70px] min-h-screen flex items-center justify-center px-4">
          <div className="glass border border-white/8 rounded-3xl p-10 text-center max-w-md">
            <h1 className="text-2xl font-black font-[Outfit] text-white mb-2">MAL Watchlist</h1>
            <p className="text-[#9898b8] text-sm mb-6">Sign in with MyAnimeList to view and manage your list.</p>
            <Link href="/login" className="inline-block px-6 py-3 rounded-full brand-gradient text-white font-bold text-sm">
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
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
              MAL <span className="gradient-text">Watchlist</span>
            </h1>
            <p className="text-[#9898b8]">Your MyAnimeList, synced live — add, update, and remove titles here.</p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
          {/* Add anime */}
          <div className="relative mb-8 max-w-xl">
            <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">
              Add anime to your list
            </label>
            <input
              type="text"
              value={addQuery}
              onChange={(e) => {
                setAddQuery(e.target.value);
                setAddOpen(true);
              }}
              onFocus={() => setAddOpen(true)}
              placeholder="Search anime to add..."
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/60 transition-all"
            />
            {addOpen && addQuery.trim() && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 glass border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-h-96 overflow-y-auto">
                {addLoading ? (
                  <div className="p-4 text-sm text-[#9898b8]">Searching...</div>
                ) : addResults.length === 0 ? (
                  <div className="p-4 text-sm text-[#9898b8]">No results.</div>
                ) : (
                  addResults.map((anime) => {
                    const already = existingIds.has(anime.malId);
                    return (
                      <div key={anime.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold truncate">{anime.title}</p>
                          <p className="text-xs text-[#9898b8]">{anime.year || "—"} · {anime.type}</p>
                        </div>
                        <button
                          onClick={() => handleAdd(anime)}
                          disabled={already || busyId === anime.malId || !anime.malId}
                          className="px-3 py-1.5 rounded-full brand-gradient text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                        >
                          {!anime.malId ? "Unavailable" : already ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    statusFilter === f.value
                      ? "brand-gradient text-white border-transparent"
                      : "border-white/10 text-[#9898b8] hover:border-[#7c3aed]/40 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title..."
                className="bg-[#1a1a2e] border border-white/10 rounded-full px-4 py-1.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/60 transition-all"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1a1a2e] border border-white/10 rounded-full px-4 py-1.5 text-sm text-white outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0f0f1a]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {malList === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-[#9898b8] text-sm glass border border-white/5 rounded-2xl">
              {malList.length === 0 ? "Your MAL list is empty. Add a title above to get started." : "No titles match these filters."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((entry, i) => {
                const total = entry.anime.episodes || 0;
                const progress = entry.malProgress || 0;
                const busy = busyId === entry.anime.malId;
                return (
                  <div key={entry.anime.malId} className="space-y-2">
                    <AnimeCard anime={entry.anime} index={i} />

                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <span className="text-xs text-[#9898b8]">
                        Ep {progress}{total > 0 ? ` / ${total}` : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEpisodeChange(entry, -1)}
                          disabled={busy || progress <= 0}
                          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer"
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleEpisodeChange(entry, 1)}
                          disabled={busy || (total > 0 && progress >= total)}
                          className="w-6 h-6 rounded-full brand-gradient text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <select
                      value={entry.listStatus}
                      onChange={(e) => handleStatusChange(entry.anime.malId, e.target.value as MalListStatus)}
                      disabled={busy}
                      className="w-full bg-[#12121f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]/60 disabled:opacity-50 cursor-pointer"
                    >
                      {MAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <select
                        value={entry.userScore || 0}
                        onChange={(e) => handleScoreChange(entry.anime.malId, Number(e.target.value))}
                        disabled={busy}
                        className="flex-1 bg-[#12121f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]/60 disabled:opacity-50 cursor-pointer"
                      >
                        <option value={0} className="bg-[#0f0f1a]">Score: —</option>
                        {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
                          <option key={n} value={n} className="bg-[#0f0f1a]">
                            {n} ★
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(entry.anime.malId, entry.anime.title)}
                        disabled={busy}
                        title="Remove from MAL"
                        className="w-8 h-8 flex-shrink-0 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
