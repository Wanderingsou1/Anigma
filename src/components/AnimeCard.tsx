"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { CARD_GRADIENTS } from "@/lib/data";
import { AnimeData } from "@/lib/api/types";

interface AnimeCardProps {
  anime: AnimeData;
  index?: number;
  rank?: number;
}

export default function AnimeCard({ anime, index = 0, rank }: AnimeCardProps) {
  const [imageError, setImageError] = useState(false);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const statusColor =
    anime.status === "ongoing" ? "text-green-400 bg-green-400/10 border-green-400/30" :
    anime.status === "completed" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  const typeColor =
    anime.type === "TV" ? "bg-[#7c3aed]/20 text-[#a855f7] border-[#7c3aed]/40" :
    anime.type === "Movie" ? "bg-[#06b6d4]/20 text-[#22d3ee] border-[#06b6d4]/30" :
    "bg-white/10 text-white/70 border-white/20";

  const posterSrc = anime.imageLargeUrl || anime.imageUrl;
  const showImage = posterSrc && !imageError;

  const routeId = anime.id || String(anime.malId);

  return (
    <Link href={`/anime/${encodeURIComponent(routeId)}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-[#12121f] border border-white/5 transition-all duration-300 group-hover:border-[#7c3aed]/40 group-hover:shadow-[0_8px_32px_rgba(124,58,237,0.25)] group-hover:-translate-y-1">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-[#12121f]">
          {/* Gradient/Letter Fallback behind/instead of image */}
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{ background: gradient }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white/20 font-[Outfit] select-none">
              {anime.title.charAt(0)}
            </span>
          </div>

          {/* Real Anime Image */}
          {showImage && (
            <Image
              src={posterSrc}
              alt={anime.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          )}

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-2 left-2 w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-xs font-black text-white shadow-lg z-10">
              {rank}
            </div>
          )}
          {/* Type badge */}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border z-10 ${typeColor}`}>
            {anime.type}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center shadow-lg glow-purple">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-1 font-[Outfit] group-hover:text-[#a855f7] transition-colors">
            {anime.title}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs text-yellow-400 font-bold">
                {anime.rating ? anime.rating.toFixed(1) : "0.0"}
              </span>
            </div>
            <span className="text-[10px] text-[#5a5a78]">{anime.episodes || "?"} eps</span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
              {anime.status ? anime.status.charAt(0).toUpperCase() + anime.status.slice(1) : "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
