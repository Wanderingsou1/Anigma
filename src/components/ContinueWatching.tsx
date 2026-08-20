"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CARD_GRADIENTS } from "@/lib/data";
import type { MalListEntry } from "@/lib/mal/client";

export default function ContinueWatching() {
  const { status } = useSession();
  const [items, setItems] = useState<MalListEntry[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/mal/list")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const watching = (json.data as MalListEntry[])
          .filter((e) => e.listStatus === "watching")
          .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
          .slice(0, 6);
        setItems(watching);
      })
      .catch(() => setItems([]));
  }, [status]);

  if (status !== "authenticated" || !items || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 rounded-full brand-gradient block" />
        <h2 className="text-xl md:text-2xl font-bold font-[Outfit] text-white">Continue Watching</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((entry, i) => {
          const nextEp = entry.malProgress > 0 ? entry.malProgress + 1 : 1;
          const total = entry.anime.episodes || 0;
          const percent = total > 0 ? Math.min(100, Math.round((entry.malProgress / total) * 100)) : 0;
          return (
            <Link
              key={entry.anime.malId}
              href={`/watch/${encodeURIComponent(`mal::${entry.anime.malId}`)}?ep=${nextEp}`}
              className="flex items-center gap-4 glass border border-white/6 rounded-2xl p-4 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 transition-all group"
            >
              <div className="relative w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#12121f] overflow-hidden border border-white/10">
                {entry.anime.imageUrl ? (
                  <Image
                    src={entry.anime.imageUrl}
                    alt={entry.anime.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    <span className="text-2xl font-black text-white/30 font-[Outfit]">
                      {entry.anime.title[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white font-[Outfit] text-sm truncate group-hover:text-[#a855f7] transition-colors">
                  {entry.anime.title}
                </p>
                <p className="text-xs text-[#9898b8]">
                  Episode {entry.malProgress}
                  {total > 0 ? ` / ${total}` : ""}
                </p>
                <div className="mt-2 h-1 bg-white/10 rounded-full">
                  <div className="h-full brand-gradient rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <svg className="w-8 h-8 text-white fill-white opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
