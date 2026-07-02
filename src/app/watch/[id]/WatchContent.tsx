"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CARD_GRADIENTS } from "@/lib/data";
import type { AnimeData, AnimeEpisode } from "@/lib/api/types";
import type { EmbedSourceResponse } from "@/lib/api/embeds";

export default function WatchContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [anime, setAnime] = useState<AnimeData | null>(null);
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [source, setSource] = useState<EmbedSourceResponse | null>(null);
  const [currentEp, setCurrentEp] = useState<number>(Number(searchParams.get("ep") ?? "1"));
  const [subOrDub, setSubOrDub] = useState<"sub" | "dub">(
    searchParams.get("subOrDub") === "dub" ? "dub" : "sub"
  );
  const [serverKey, setServerKey] = useState(searchParams.get("server") ?? "vidnest-sub");
  const [loadingAnime, setLoadingAnime] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<unknown>(null);

  useEffect(() => {
    setLoadingAnime(true);
    fetch(`/api/anime/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => setAnime(data.anime ?? null))
      .catch(() => setAnime(null))
      .finally(() => setLoadingAnime(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/anime/${encodeURIComponent(id)}/episodes`)
      .then((r) => r.json())
      .then((data) => {
        const eps = data.episodes ?? [];
        // Normalize hianime shape { id, number, title, isFiller } vs Jikan AnimeEpisode
        const normalized: AnimeEpisode[] = eps.map((ep: AnimeEpisode & { isFiller?: boolean }) => ({
          id: ep.id ?? String(ep.number),
          malId: ep.malId ?? ep.number,
          number: ep.number,
          title: ep.title ?? `Episode ${ep.number}`,
          titleJapanese: ep.titleJapanese ?? "",
          aired: ep.aired ?? "",
          filler: ep.filler ?? ep.isFiller ?? false,
          recap: ep.recap ?? false,
          imageUrl: ep.imageUrl ?? "",
        }));
        setEpisodes(normalized);
      })
      .catch(() => setEpisodes([]));
  }, [id]);

  useEffect(() => {
    if (!anime?.malId) return;
    setLoadingSource(true);
    const params = new URLSearchParams({
      ep: String(currentEp),
      subOrDub,
      server: serverKey,
    });
    fetch(`/api/anime/${encodeURIComponent(id)}/sources?${params}`)
      .then((r) => r.json())
      .then((data: EmbedSourceResponse) => setSource(data))
      .catch(() => setSource(null))
      .finally(() => setLoadingSource(false));
  }, [anime?.malId, currentEp, serverKey, subOrDub, id]);

  // HLS.js player for direct stream sources
  useEffect(() => {
    const src = (source as (typeof source & { type?: string }) | null);
    if (!src?.embedUrl || src.type !== "hls" || !videoRef.current) return;

    const video = videoRef.current;

    type HlsInstance = {
      loadSource(u: string): void;
      attachMedia(v: HTMLVideoElement): void;
      destroy(): void;
      startLoad(): void;
      recoverMediaError(): void;
      on(event: string, cb: (e: string, data: { type: string; fatal: boolean; details: string }) => void): void;
    };
    type HlsCtor = {
      isSupported: () => boolean;
      Events: { ERROR: string };
      ErrorTypes: { NETWORK_ERROR: string; MEDIA_ERROR: string };
      new(): HlsInstance;
    };

    function attachHls(HlsClass: HlsCtor) {
      if (HlsClass.isSupported()) {
        if (hlsRef.current) (hlsRef.current as HlsInstance).destroy();
        const hls = new HlsClass();
        hlsRef.current = hls;
        hls.loadSource(src!.embedUrl);
        hls.attachMedia(video);

        // Recover from fatal stalls/errors (e.g. after seeking) instead of dying.
        hls.on(HlsClass.Events.ERROR, (_evt, data) => {
          if (!data.fatal) return;
          if (data.type === HlsClass.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad(); // retry loading segments
          } else if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError(); // re-init the media pipeline
          } else {
            hls.destroy();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src!.embedUrl;
      }
    }

    // If HLS.js already loaded on window, use it
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["Hls"]) {
      attachHls((window as unknown as Record<string, unknown>)["Hls"] as Parameters<typeof attachHls>[0]);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@~1/dist/hls.min.js";
    script.onload = () => {
      const HlsClass = (window as unknown as Record<string, unknown>)["Hls"] as Parameters<typeof attachHls>[0];
      if (HlsClass) attachHls(HlsClass);
    };
    document.head.appendChild(script);

    return () => {
      if (hlsRef.current) (hlsRef.current as { destroy(): void }).destroy();
    };
  }, [source]);

  const updateUrl = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value != null) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`/watch/${encodeURIComponent(id)}?${params.toString()}`);
  };

  const selectEpisode = (epNum: number) => {
    setCurrentEp(epNum);
    updateUrl({ ep: String(epNum) });
  };

  const selectServer = (key: string, mode: "sub" | "dub") => {
    setServerKey(key);
    setSubOrDub(mode);
    updateUrl({ server: key, subOrDub: mode });
  };

  const gradient = CARD_GRADIENTS[(anime?.malId ?? 0) % CARD_GRADIENTS.length];
  const EP_PAGE_SIZE = 100;
  const [epRangeStart, setEpRangeStart] = useState(0); // index into episodes array
  const visibleEpisodes = episodes.slice(epRangeStart, epRangeStart + EP_PAGE_SIZE);
  const totalEpPages = Math.ceil(episodes.length / EP_PAGE_SIZE);

  if (loadingAnime) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9898b8]">Loading Player...</p>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <main className="min-h-screen bg-[#08080f] flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-24 text-[#9898b8]">
          <h2 className="text-2xl font-bold font-[Outfit] text-white">Anime Not Found</h2>
          <Link href="/home" className="text-[#a855f7] mt-4 inline-block hover:underline">Go Home</Link>
        </div>
      </main>
    );
  }

  const subServers = source?.servers?.sub ?? [];
  const dubServers = source?.servers?.dub ?? [];
  // Use the user's selected key; fall back to whatever the API resolved to
  const activeServerKey = serverKey || source?.serverKey || "";

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        <div className="flex flex-col lg:flex-row">

          {/* ── Player column ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Video / iframe */}
            <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {source?.embedUrl && !loadingSource ? (
                (source as typeof source & { type?: string }).type === "hls" ? (
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="w-full h-full"
                    key={source.embedUrl}
                  />
                ) : (
                  <iframe
                    key={source.embedUrl}
                    src={source.embedUrl}
                    title={`${anime.title} — Episode ${currentEp}`}
                    allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                )
              ) : loadingSource ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0" style={{ background: gradient }}>
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                    <span className="text-[80px] font-black text-white/10 font-[Outfit] select-none">
                      {anime.title[0]}
                    </span>
                    <p className="text-sm text-[#9898b8]">Select a server below to start watching</p>
                  </div>
                </div>
              )}

              {/* EP badge */}
              <div className="absolute top-3 left-3 px-3 py-1 glass rounded-full text-xs font-bold text-white border border-white/15 pointer-events-none">
                EP {currentEp} · {anime.title}
              </div>
            </div>

            {/* Server selector */}
            <div className="px-4 md:px-6 py-4 border-b border-white/5">
              <div className="flex flex-col gap-3">

                {/* SUB servers */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest w-8">SUB</span>
                  {subServers.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => selectServer(s.key, "sub")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activeServerKey === s.key && subOrDub === "sub"
                          ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-300"
                          : "bg-white/5 border-white/10 text-[#9898b8] hover:border-cyan-400/30 hover:text-cyan-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* DUB servers */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest w-8">DUB</span>
                  {dubServers.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => selectServer(s.key, "dub")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activeServerKey === s.key && subOrDub === "dub"
                          ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
                          : "bg-white/5 border-white/10 text-[#9898b8] hover:border-amber-400/30 hover:text-amber-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* Anime meta */}
            <div className="px-4 md:px-6 py-5 border-b border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-lg md:text-xl font-bold font-[Outfit] text-white mb-1">
                    {anime.title} — Episode {currentEp}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#9898b8]">
                    <span>{anime.studio || "Unknown"}</span>
                    <span>·</span>
                    <span>{anime.duration || "24 min"}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-yellow-400 font-bold">{anime.rating ? anime.rating.toFixed(1) : "0.0"}</span>
                    </span>
                  </div>
                </div>
                <Link
                  href={`/anime/${encodeURIComponent(anime.id)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-[#9898b8] hover:text-white transition-all flex-shrink-0"
                >
                  Details
                </Link>
              </div>
            </div>

            {/* Synopsis & genres */}
            <div className="p-4 md:p-6">
              <p className="text-sm text-[#9898b8] leading-relaxed">{anime.synopsis}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {anime.genres?.map((genre) => (
                  <Link
                    key={genre}
                    href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`}
                    className="px-3 py-1 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-xs text-[#a855f7] hover:bg-[#7c3aed]/25 transition-all"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Episode sidebar ───────────────────────────────────────────── */}
          <aside className="w-full lg:w-80 lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 max-h-[calc(100vh-70px)] overflow-y-auto sticky top-[70px]">
            <div className="p-4 border-b border-white/5 sticky top-0 bg-[#08080f]/95 backdrop-blur-xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold font-[Outfit] text-white">Episodes</h3>
                  <p className="text-xs text-[#9898b8]">{episodes.length || anime.episodes || "?"} episodes</p>
                </div>
                {totalEpPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEpRangeStart(Math.max(0, epRangeStart - EP_PAGE_SIZE))}
                      disabled={epRangeStart === 0}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-[#9898b8] text-xs disabled:opacity-30 hover:bg-white/10"
                    >‹</button>
                    <span className="text-[10px] text-[#9898b8] px-1">
                      {epRangeStart + 1}–{Math.min(epRangeStart + EP_PAGE_SIZE, episodes.length)}
                    </span>
                    <button
                      onClick={() => setEpRangeStart(Math.min((totalEpPages - 1) * EP_PAGE_SIZE, epRangeStart + EP_PAGE_SIZE))}
                      disabled={epRangeStart + EP_PAGE_SIZE >= episodes.length}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-[#9898b8] text-xs disabled:opacity-30 hover:bg-white/10"
                    >›</button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {episodes.length === 0 ? (
                Array.from({ length: Math.min(anime.episodes || 12, 100) }, (_, i) => i + 1).map((epNum) => (
                  <button
                    key={epNum}
                    onClick={() => selectEpisode(epNum)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      currentEp === epNum
                        ? "bg-[#7c3aed]/20 border border-[#7c3aed]/40"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      currentEp === epNum ? "brand-gradient text-white" : "bg-white/8 text-[#9898b8]"
                    }`}>
                      {epNum}
                    </div>
                    <p className={`text-sm font-semibold ${currentEp === epNum ? "text-[#a855f7]" : "text-white"}`}>
                      Episode {epNum}
                    </p>
                  </button>
                ))
              ) : (
                visibleEpisodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => selectEpisode(episode.number)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      currentEp === episode.number
                        ? "bg-[#7c3aed]/20 border border-[#7c3aed]/40"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      currentEp === episode.number ? "brand-gradient text-white" : "bg-white/8 text-[#9898b8]"
                    }`}>
                      {episode.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${currentEp === episode.number ? "text-[#a855f7]" : "text-white"}`}>
                        {episode.title}
                      </p>
                      <p className="text-xs text-[#5a5a78]">
                        {episode.filler ? <span className="text-amber-500 mr-1.5">Filler</span> : null}
                        {episode.recap ? <span className="text-cyan-500 mr-1.5">Recap</span> : null}
                        {anime.duration || "24 min"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
