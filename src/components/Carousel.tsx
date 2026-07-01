"use client";
import { useRef } from "react";
import AnimeCard from "./AnimeCard";
import Link from "next/link";
import { AnimeData } from "@/lib/api/types";
import LoadingSkeleton from "./LoadingSkeleton";

interface CarouselProps {
  title: string;
  anime: AnimeData[];
  viewAllHref?: string;
  isLoading?: boolean;
}

export default function Carousel({ title, anime, viewAllHref, isLoading = false }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5 px-4 md:px-6">
        <h2 className="flex items-center gap-3 text-xl md:text-2xl font-bold font-[Outfit] text-white">
          <span className="w-1 h-6 rounded-full brand-gradient block" />
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm text-[#06b6d4] font-semibold hover:text-[#22d3ee] transition-colors flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-[#9898b8] hover:text-white hover:border-[#7c3aed]/50 hover:bg-[#7c3aed]/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-[#9898b8] hover:text-white hover:border-[#7c3aed]/50 hover:bg-[#7c3aed]/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={8} />
      ) : anime.length === 0 ? (
        <div className="px-4 md:px-6 text-sm text-[#5a5a78] italic">No titles found.</div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4 md:px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {anime.map((a, i) => (
            <div key={a.malId} className="flex-none w-[160px] sm:w-[180px] md:w-[200px]">
              <AnimeCard anime={a} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
