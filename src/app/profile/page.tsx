"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import { CARD_GRADIENTS } from "@/lib/data";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Suspense } from "react";
import type { MalListEntry, MalListStatus } from "@/lib/mal/client";
import ContinueWatching from "@/components/ContinueWatching";

const TABS = ["Overview", "Watchlist", "History", "Settings"] as const;
type Tab = typeof TABS[number];

function ProfileContent() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) && TABS.includes(searchParams.get("tab") as Tab)
      ? (searchParams.get("tab") as Tab)
      : "Overview"
  );

  const [togglingSync, setTogglingSync] = useState(false);

  // Loaded user data state
  const [profileData, setProfileData] = useState<any>(null);
  const [malList, setMalList] = useState<MalListEntry[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<number | null>(null);

  // Settings edit states
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium" | "family">("free");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Load all dashboard info from API when available.
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const loadAllData = async () => {
      setLoadingData(true);
      try {
        const [profileRes, malListRes, historyRes, favoritesRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/mal/list"),
          fetch("/api/user/history"),
          fetch("/api/user/favorites"),
        ]);

        if (profileRes.ok) {
          const p = await profileRes.json();
          setProfileData(p.data);
          setEditUsername(p.data.username || "");
          setEditAvatar(p.data.avatar || "");
          setSelectedPlan(p.data.plan || "free");
          setSelectedGenres(p.data.favoriteGenres || []);
        }
        if (malListRes.ok) {
          const w = await malListRes.json();
          setMalList(w.data || []);
        }
        if (historyRes.ok) {
          const h = await historyRes.json();
          setHistory(h.data || []);
        }
        if (favoritesRes.ok) {
          const f = await favoritesRes.json();
          setFavorites(f.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    loadAllData();
  }, [status]);

  const handleToggleMalSync = async (enabled: boolean) => {
    setTogglingSync(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ malSyncEnabled: enabled }),
      });
      if (res.ok) {
        const json = await res.json();
        setProfileData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingSync(false);
    }
  };

  const MAL_STATUS_OPTIONS = [
    { value: "watching", label: "Watching" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
    { value: "plan_to_watch", label: "Plan to Watch" },
  ];

  const handleMalStatusChange = async (malId: number, newStatus: MalListStatus) => {
    setUpdatingStatusFor(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMalList((prev) =>
          prev.map((entry) =>
            entry.anime.malId === malId ? { ...entry, listStatus: newStatus } : entry
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatusFor(null);
    }
  };

  const handleMalEpisodeChange = async (entry: MalListEntry, delta: number) => {
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

    setUpdatingStatusFor(malId);
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
          prev.map((e) =>
            e.anime.malId === malId ? { ...e, malProgress: newEpisode, listStatus: newStatus } : e
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatusFor(null);
    }
  };

  const handleMalScoreChange = async (malId: number, newScore: number) => {
    setUpdatingStatusFor(malId);
    try {
      const res = await fetch(`/api/mal/list/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: newScore }),
      });
      if (res.ok) {
        setMalList((prev) =>
          prev.map((e) => (e.anime.malId === malId ? { ...e, userScore: newScore } : e))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatusFor(null);
    }
  };

  const renderMalCard = (entry: MalListEntry, i: number) => {
    const total = entry.anime.episodes || 0;
    const progress = entry.malProgress || 0;
    const isUpdating = updatingStatusFor === entry.anime.malId;
    return (
      <div key={entry.anime.malId} className="space-y-2">
        <AnimeCard anime={entry.anime} index={i} />

        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-xs text-[#9898b8]">
            Ep {progress}
            {total > 0 ? ` / ${total}` : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMalEpisodeChange(entry, -1)}
              disabled={isUpdating || progress <= 0}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer"
            >
              −
            </button>
            <button
              onClick={() => handleMalEpisodeChange(entry, 1)}
              disabled={isUpdating || (total > 0 && progress >= total)}
              className="w-6 h-6 rounded-full brand-gradient text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <Link
          href={`/watch/${encodeURIComponent(`mal::${entry.anime.malId}`)}?ep=${Math.min(progress + 1, total || progress + 1)}`}
          className="block w-full text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
        >
          {progress > 0 ? "Continue" : "Start Watching"}
        </Link>

        <select
          value={entry.listStatus}
          onChange={(e) => handleMalStatusChange(entry.anime.malId, e.target.value as MalListStatus)}
          disabled={isUpdating}
          className="w-full bg-[#12121f] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#7c3aed]/60 disabled:opacity-50 cursor-pointer"
        >
          {MAL_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-xs text-[#9898b8]">My Score</span>
          <select
            value={entry.userScore || 0}
            onChange={(e) => handleMalScoreChange(entry.anime.malId, Number(e.target.value))}
            disabled={isUpdating}
            className="bg-[#12121f] border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#7c3aed]/60 disabled:opacity-50 cursor-pointer"
          >
            <option value={0} className="bg-[#0f0f1a]">—</option>
            {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
              <option key={n} value={n} className="bg-[#0f0f1a]">
                {n} ★
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  if (status === "loading" || loadingData) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9898b8]">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Stats
  const watchedCount = history.length;
  const watchlistCount = malList.length;
  const hoursCount = Math.round(watchedCount * 0.4); // 24 min per episode = 0.4 hrs
  const favoritesCount = favorites.length;

  // Settings update
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");
    setSettingsError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          avatar: editAvatar,
          plan: selectedPlan,
          favoriteGenres: selectedGenres,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setSettingsError(resData.error || "Failed to update profile settings.");
      } else {
        setSettingsSuccess("Profile settings updated successfully!");
        setProfileData(resData.data);
        
        // Update NextAuth local session
        await updateSession({
          username: editUsername,
          avatar: editAvatar,
          plan: selectedPlan,
        });
      }
    } catch (err) {
      console.error(err);
      setSettingsError("An unexpected error occurred.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete your Anigma account? This action is irreversible and will delete your entire watchlist, favorites, and history.")) {
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
      });
      if (res.ok) {
        signOut({ callbackUrl: "/login" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  const memberDate = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Jan 2026";

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        {/* Profile Header */}
        <div className="relative py-14 px-4 md:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08080f]" />
          
          <div className="relative max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              {profileData?.avatar ? (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-[#7c3aed]/40 shadow-lg relative bg-[#12121f]">
                  <Image
                    src={profileData.avatar}
                    alt={profileData.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full brand-gradient flex items-center justify-center text-4xl md:text-5xl font-black text-white font-[Outfit] shadow-[0_0_40px_rgba(124,58,237,0.5)] border-2 border-white/10">
                  {editUsername ? editUsername.charAt(0).toUpperCase() : "A"}
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left pb-1">
              <h1 className="text-2xl md:text-3xl font-black font-[Outfit] text-white">
                {profileData?.username || session?.user?.name || "Guest"}
              </h1>
              <p className="text-[#9898b8] text-sm">{profileData?.email || session?.user?.email || "guest@example.com"}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm">
                <span className="text-[#9898b8]">Member since <span className="text-white">{memberDate}</span></span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-xs font-bold text-[#a855f7] uppercase">
                  {profileData?.plan || "FREE"}
                </span>
              </div>
            </div>
            
            <div className="sm:ml-auto flex items-center gap-3">
              <button
                onClick={() => setActiveTab("Settings")}
                className="px-5 py-2.5 rounded-full glass border border-white/10 text-sm text-white font-semibold hover:bg-white/10 transition-all cursor-pointer"
              >
                Edit Settings
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="relative max-w-[1400px] mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Episodes Watched", value: watchedCount, icon: "▶️" },
              { label: "On Watchlist", value: watchlistCount, icon: "📋" },
              { label: "Hours Streamed", value: hoursCount, icon: "⏱️" },
              { label: "Favorites Saved", value: favoritesCount, icon: "⭐" },
            ].map(s => (
              <div key={s.label} className="glass border border-white/6 rounded-2xl p-4 text-center hover:border-[#7c3aed]/30 transition-all">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-black font-[Outfit] gradient-text">{s.value}</div>
                <div className="text-xs text-[#9898b8]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="sticky top-[70px] z-30 bg-[#08080f]/95 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex gap-1 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab ? "brand-gradient text-white shadow-lg" : "text-[#9898b8] hover:text-white hover:bg-white/8"
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10">
          {activeTab === "Overview" && (
            <div className="space-y-12 animate-fade-in-up">
              <ContinueWatching />

              {/* Watchlist preview */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-1 h-6 rounded-full brand-gradient block" />
                    <h2 className="text-xl font-bold font-[Outfit] text-white">My Watchlist</h2>
                  </div>
                  {malList.length > 0 && (
                    <button onClick={() => setActiveTab("Watchlist")} className="text-sm text-[#06b6d4] hover:text-[#22d3ee] transition-colors cursor-pointer">View all →</button>
                  )}
                </div>
                {malList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {malList.slice(0, 6).map((entry, i) => (
                      <AnimeCard key={entry.anime.malId} anime={entry.anime} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl glass border border-white/5 text-center text-[#9898b8] text-sm max-w-md">
                    Your MAL list is empty. Add titles on MyAnimeList and they&apos;ll show up here.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "Watchlist" && (
            <div className="animate-fade-in-up space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-6 rounded-full brand-gradient block" />
                  <h2 className="text-xl font-bold font-[Outfit] text-white">My Watchlist</h2>
                  <span className="text-sm text-[#5a5a78]">({malList.length})</span>
                </div>
              </div>

              {malList.length === 0 ? (
                <div className="text-center py-16 text-[#9898b8] text-sm glass border border-white/5 rounded-2xl">
                  No anime listed on your watchlist.
                </div>
              ) : (
                [
                  { key: "watching", title: "Currently Watching" },
                  { key: "on_hold", title: "On Hold" },
                  { key: "completed", title: "Completed" },
                  { key: "plan_to_watch", title: "Plan to Watch" },
                  { key: "dropped", title: "Dropped" },
                ].map(({ key, title }) => {
                  const items = malList.filter((entry) => entry.listStatus === key);
                  if (items.length === 0) return null;
                  return (
                    <section key={key}>
                      <h3 className="text-sm font-bold text-[#9898b8] uppercase tracking-widest mb-4">
                        {title} <span className="text-[#5a5a78]">({items.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {items.map((entry, i) => renderMalCard(entry, i))}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "History" && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1 h-6 rounded-full brand-gradient block" />
                <h2 className="text-xl font-bold font-[Outfit] text-white">Watch History</h2>
              </div>
              {history.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {history.map((item, i) => (
                    <div key={item._id} className="flex items-center gap-4 glass border border-white/6 rounded-2xl p-4 hover:border-white/12 transition-all">
                      <div className="relative w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#12121f] overflow-hidden border border-white/5">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}>
                            <span className="text-xl font-black text-white/30 font-[Outfit]">{item.title[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white font-[Outfit] text-sm truncate">{item.title}</p>
                        <p className="text-xs text-[#9898b8]">
                          Watched Episode {item.episodeNumber} · {new Date(item.watchedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/watch/${item.animeId}?ep=${item.episodeNumber}`}
                        className="px-4 py-1.5 rounded-full brand-gradient text-white text-xs font-bold flex-shrink-0">
                        Resume
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-[#9898b8] text-sm glass border border-white/5 rounded-2xl">
                  No watch history found.
                </div>
              )}
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-2xl space-y-8 animate-fade-in-up">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1 h-6 rounded-full brand-gradient block" />
                  <h2 className="text-xl font-bold font-[Outfit] text-white">Account Settings</h2>
                </div>

                {settingsSuccess && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs mb-4 font-semibold">
                    {settingsSuccess}
                  </div>
                )}
                {settingsError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs mb-4 font-semibold">
                    {settingsError}
                  </div>
                )}

                <form onSubmit={handleSettingsUpdate} className="space-y-4">
                  <div className="glass border border-white/6 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Display Username"
                      required
                      className="w-full bg-transparent border-0 text-white text-sm outline-none placeholder-[#5a5a78] focus:ring-0"
                    />
                  </div>

                  <div className="glass border border-white/6 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Avatar Image URL</label>
                    <input
                      type="text"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-transparent border-0 text-white text-sm outline-none placeholder-[#5a5a78] focus:ring-0"
                    />
                  </div>

                  <div className="glass border border-white/6 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Plan Tier</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as any)}
                      className="w-full bg-transparent border-0 text-white text-sm outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="free" className="bg-[#0f0f1a]">Free Tier</option>
                      <option value="premium" className="bg-[#0f0f1a]">Premium Tier</option>
                      <option value="family" className="bg-[#0f0f1a]">Family Tier</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-3 rounded-2xl brand-gradient text-white font-bold text-sm shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {savingSettings && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Save Profile Changes
                  </button>
                </form>
              </div>

              {/* MyAnimeList connection — always connected, since MAL is the login method */}
              <div className="pt-6 border-t border-white/5">
                <h3 className="font-bold text-white text-lg mb-1 font-[Outfit]">MyAnimeList</h3>
                <p className="text-xs text-[#9898b8] mb-4">
                  You&apos;re signed in with MyAnimeList. Your list is available in the Watchlist tab.
                </p>

                <div className="glass border border-white/6 rounded-2xl p-5 space-y-4">
                  <div>
                    <p className="text-sm text-white font-semibold">Connected as {profileData?.malUsername}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className="text-sm text-white font-semibold">Sync progress back to MAL</p>
                      <p className="text-xs text-[#9898b8] max-w-sm">
                        When on, finishing an episode in Anigma updates your MAL progress and status. Off by default.
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleMalSync(!profileData?.malSyncEnabled)}
                      disabled={togglingSync}
                      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 ${
                        profileData?.malSyncEnabled ? "brand-gradient" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          profileData?.malSyncEnabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div>
                  <h3 className="font-bold text-white text-lg font-[Outfit]">Danger Zone</h3>
                  <p className="text-xs text-[#9898b8]">Actions in this section can result in permanent loss of user data.</p>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/20 transition-all text-sm cursor-pointer"
                >
                  Delete Anigma Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f]" />}>
      <ProfileContent />
    </Suspense>
  );
}
