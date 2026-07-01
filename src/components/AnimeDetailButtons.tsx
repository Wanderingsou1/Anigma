"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimeData } from "@/lib/api/types";

interface AnimeDetailButtonsProps {
  anime: AnimeData;
}

export default function AnimeDetailButtons({ anime }: AnimeDetailButtonsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // Check watchlist
      fetch("/api/user/watchlist")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.data) {
            const exists = resData.data.some((item: { animeId: number }) => item.animeId === anime.malId);
            setInWatchlist(exists);
          }
        })
        .catch(console.error);

      // Check favorites
      fetch("/api/user/favorites")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.data) {
            const exists = resData.data.some((item: { animeId: number }) => item.animeId === anime.malId);
            setIsFavorite(exists);
          }
        })
        .catch(console.error);
    }
  }, [session, anime.malId]);

  const handleWatchlistToggle = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoadingWatchlist(true);
    try {
      if (inWatchlist) {
        const res = await fetch(`/api/user/watchlist?animeId=${anime.malId}`, {
          method: "DELETE",
        });
        if (res.ok) setInWatchlist(false);
      } else {
        const res = await fetch("/api/user/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId: anime.malId,
            title: anime.title,
            imageUrl: anime.imageLargeUrl || anime.imageUrl,
            rating: anime.rating,
            status: "plan_to_watch",
            type: anime.type,
          }),
        });
        if (res.ok) setInWatchlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        const res = await fetch(`/api/user/favorites?animeId=${anime.malId}`, {
          method: "DELETE",
        });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId: anime.malId,
            title: anime.title,
            imageUrl: anime.imageLargeUrl || anime.imageUrl,
          }),
        });
        if (res.ok) setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFavorite(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleWatchlistToggle}
        disabled={loadingWatchlist}
        className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-bold font-[Outfit] text-sm border transition-all cursor-pointer ${
          inWatchlist
            ? "bg-[#06b6d4]/20 border-[#06b6d4]/40 text-[#22d3ee] hover:bg-[#06b6d4]/30"
            : "glass border-white/15 text-white hover:bg-white/10"
        }`}
      >
        {loadingWatchlist ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : inWatchlist ? (
          <>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
            In Watchlist
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to List
          </>
        )}
      </button>

      <button
        onClick={handleFavoriteToggle}
        disabled={loadingFavorite}
        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
          isFavorite
            ? "bg-pink-500/20 border-pink-500/40 text-pink-500 hover:bg-pink-500/30 glow-pink"
            : "glass border-white/15 text-white hover:bg-white/10"
        }`}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        {loadingFavorite ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
