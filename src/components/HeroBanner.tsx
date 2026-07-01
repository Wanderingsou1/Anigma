"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CARD_GRADIENTS } from "@/lib/data";
import { AnimeData } from "@/lib/api/types";

interface HeroBannerProps {
  anime: AnimeData[];
}

export default function HeroBanner({ anime }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const featured = anime[current];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % anime.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [anime.length]);

  // Fetch watchlist status on mount / session change
  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/watchlist")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.data) {
            setWatchlistIds(resData.data.map((item: { animeId: number }) => item.animeId));
          }
        })
        .catch(console.error);
    }
  }, [session]);

  if (!featured) return null;

  const inWatchlist = watchlistIds.includes(featured.malId);
  const routeId = featured.id || String(featured.malId);

  const handleWatchlistToggle = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      if (inWatchlist) {
        // Delete
        const res = await fetch(`/api/user/watchlist?animeId=${featured.malId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setWatchlistIds((prev) => prev.filter((id) => id !== featured.malId));
        }
      } else {
        // Add
        const res = await fetch("/api/user/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId: featured.malId,
            title: featured.title,
            imageUrl: featured.imageLargeUrl || featured.imageUrl,
            rating: featured.rating,
            status: "plan_to_watch",
            type: featured.type,
          }),
        });
        if (res.ok) {
          setWatchlistIds((prev) => [...prev, featured.malId]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const bannerSrc = featured.bannerUrl || featured.imageLargeUrl || featured.imageUrl;
  const gradient = CARD_GRADIENTS[current % CARD_GRADIENTS.length];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "min(90vh, 700px)" }}>
      {/* Background Poster image or fallback gradient */}
      <div className="absolute inset-0 transition-all duration-1000">
        {bannerSrc ? (
          <Image
            src={bannerSrc}
            alt={featured.title}
            fill
            priority
            className="object-cover transition-opacity duration-1000"
            unoptimized
          />
        ) : (
          <div className="w-full h-full" style={{ background: gradient }} />
        )}
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`
      }} />

      {/* Dark overlays for gradient fades */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080f] via-[#08080f]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 w-full">
          <div className="max-w-2xl animate-fade-in-left">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {featured.genres && featured.genres.slice(0, 3).map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-bold border border-[#7c3aed]/50 bg-[#7c3aed]/20 text-[#a855f7]">
                  {g}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full text-xs font-bold border border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#22d3ee]">
                {featured.type}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-black font-[Outfit] text-white leading-none mb-2 text-glow-purple">
              {featured.title}
            </h1>
            <p className="text-sm text-[#9898b8] mb-4 font-medium">{featured.titleJapanese}</p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-yellow-400 font-bold">{featured.rating ? featured.rating.toFixed(1) : "0.0"}</span>
              </div>
              <span className="text-[#9898b8] text-sm">{featured.episodes || "?"} Episodes</span>
              <span className="text-[#9898b8] text-sm">{featured.year}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                featured.status === "ongoing" ? "bg-green-400/15 text-green-400 border border-green-400/30" :
                "bg-blue-400/15 text-blue-400 border border-blue-400/30"
              }`}>
                {featured.status ? featured.status.charAt(0).toUpperCase() + featured.status.slice(1) : "Unknown"}
              </span>
            </div>

            {/* Synopsis */}
            <p className="text-[#9898b8] text-sm md:text-base leading-relaxed mb-8 line-clamp-3">
              {featured.synopsis}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/watch/${encodeURIComponent(routeId)}`}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_24px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.7)] hover:-translate-y-0.5 transition-all">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>
              <Link href={`/anime/${encodeURIComponent(routeId)}`}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full glass border border-white/15 text-white font-bold font-[Outfit] text-sm hover:bg-white/15 hover:border-white/25 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Info
              </Link>
              <button
                onClick={handleWatchlistToggle}
                disabled={isToggling}
                className={`w-12 h-12 rounded-full glass border border-white/15 flex items-center justify-center text-white hover:bg-white/15 transition-all ${
                  inWatchlist ? "text-[#06b6d4] border-[#06b6d4]/40 bg-[#06b6d4]/10" : ""
                }`}
                title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                {inWatchlist ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {anime.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-8 brand-gradient" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Studio label */}
      <div className="absolute bottom-8 right-6 hidden md:block text-right">
        <p className="text-xs text-[#5a5a78]">STUDIO</p>
        <p className="text-sm font-bold text-[#9898b8]">{featured.studio || "Unknown"}</p>
      </div>
    </div>
  );
}
