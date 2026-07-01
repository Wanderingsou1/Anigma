import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import AnimeDetailButtons from "@/components/AnimeDetailButtons";
import { CARD_GRADIENTS } from "@/lib/data";
import { getAnimeById, getAnimeCharacters, getAnimeRecommendations, getAnimeEpisodes } from "@/lib/api/jikan";
import type { AnimeCharacter, AnimeEpisode } from "@/lib/api/types";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const anime = await getAnimeById(id);
  return {
    title: anime ? `${anime.title} - Anigma` : "Anime - Anigma",
    description: anime?.synopsis?.slice(0, 150),
  };
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const [animeRes, charactersRes, recommendationsRes, episodesRes] = await Promise.allSettled([
    getAnimeById(id),
    getAnimeCharacters(id),
    getAnimeRecommendations(id),
    getAnimeEpisodes(id, 1),
  ]);

  const anime = animeRes.status === "fulfilled" ? animeRes.value : null;
  const characters = charactersRes.status === "fulfilled" ? charactersRes.value : [];
  const recommendations = recommendationsRes.status === "fulfilled" ? recommendationsRes.value : [];
  const episodesData =
    episodesRes.status === "fulfilled"
      ? episodesRes.value
      : {
          data: [],
          pagination: {
            lastVisiblePage: 1,
            hasNextPage: false,
            currentPage: 1,
            totalItems: 0,
          },
        };

  if (!anime) {
    return (
      <main className="min-h-screen bg-[#08080f] flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-24 text-[#9898b8]">
          <h2 className="text-2xl font-bold font-[Outfit] text-white">Anime Not Found</h2>
          <Link href="/home" className="text-[#a855f7] mt-4 inline-block hover:underline">
            Go Home
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const gradient = CARD_GRADIENTS[anime.malId % CARD_GRADIENTS.length];
  const related = recommendations.slice(0, 6);
  const displayEpisodes: AnimeEpisode[] =
    episodesData.data.length > 0
      ? episodesData.data
      : Array.from({ length: Math.min(anime.currentEpisode || anime.episodes || 12, 24) }, (_, i) => ({
          id: `${anime.id}-ep-${i + 1}`,
          malId: anime.malId,
          number: i + 1,
          title: `Episode ${i + 1}`,
          filler: false,
          recap: false,
        }));

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />

      <div className="relative pt-[70px]" style={{ minHeight: "520px" }}>
        <div className="absolute inset-0 bg-[#12121f]">
          {anime.bannerUrl || anime.imageLargeUrl ? (
            <Image
              src={anime.bannerUrl || anime.imageLargeUrl}
              alt={anime.title}
              fill
              priority
              className="object-cover opacity-35"
              unoptimized
            />
          ) : (
            <div className="w-full h-full" style={{ background: gradient }} />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080f]/90 via-[#08080f]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-transparent to-[#08080f]/40" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-16 flex flex-col md:flex-row items-start gap-10">
          <div className="flex-shrink-0 w-44 md:w-56 animate-fade-in-up">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10 aspect-[2/3] bg-[#12121f]">
              {anime.imageLargeUrl || anime.imageUrl ? (
                <Image
                  src={anime.imageLargeUrl || anime.imageUrl}
                  alt={anime.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
                  <span className="text-8xl font-black text-white/20 font-[Outfit]">{anime.title[0]}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 animate-fade-in-left">
            <div className="flex flex-wrap gap-2 mb-3">
              {anime.genres?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full text-xs font-bold border border-[#7c3aed]/50 bg-[#7c3aed]/15 text-[#a855f7]"
                >
                  {g}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-1 leading-tight">
              {anime.title}
            </h1>
            <p className="text-[#9898b8] text-sm mb-6">{anime.titleJapanese}</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm text-[#9898b8]">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-yellow-400 font-bold">{anime.rating ? anime.rating.toFixed(1) : "0.0"}</span>
              </div>
              <span className="bg-white/5 px-2.5 py-0.5 rounded-full text-xs text-white border border-white/10">
                {anime.type}
              </span>
              <span>{anime.episodes || "?"} Episodes</span>
              <span>{anime.duration || "24 min"}</span>
              <span>
                {anime.year || "N/A"} · {anime.season || "N/A"}
              </span>
              <span className="font-semibold text-white">{anime.studio || "Unknown"}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize bg-white/5 text-white border-white/10">
                {anime.status}
              </span>
              {anime.hasSub && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-cyan-400/30 text-cyan-300 bg-cyan-400/10">Sub</span>}
              {anime.hasDub && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-400/30 text-amber-300 bg-amber-400/10">Dub</span>}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/10 text-[#a855f7] bg-[#7c3aed]/10">
                {anime.source}
              </span>
            </div>

            <p className="text-[#9898b8] leading-relaxed mb-8 max-w-2xl text-sm md:text-base">
              {anime.synopsis}
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href={`/watch/${encodeURIComponent(anime.id)}?ep=1`}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full brand-gradient text-white font-bold font-[Outfit] shadow-[0_4px_24px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.7)] hover:-translate-y-0.5 transition-all text-sm"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>
              <AnimeDetailButtons anime={anime} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
        {anime.tags?.length ? (
          <div className="flex flex-wrap gap-2 mb-12">
            <span className="text-xs text-[#5a5a78] font-bold uppercase tracking-widest self-center mr-1">
              Tags
            </span>
            {anime.tags.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-xs text-[#9898b8]">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {characters.length > 0 ? (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1 h-6 rounded-full brand-gradient block" />
              <h2 className="text-xl font-bold font-[Outfit] text-white">Characters & Voice Actors</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.slice(0, 8).map((c: AnimeCharacter) => (
                <div key={c.malId} className="flex gap-3 p-3 glass border border-white/5 rounded-xl">
                  <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.name} fill className="object-cover" unoptimized />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <p className="text-sm font-bold text-white truncate font-[Outfit]">{c.name}</p>
                      <p className="text-xs text-[#a855f7] font-medium">{c.role}</p>
                    </div>
                    {c.voiceActors?.[0] ? (
                      <p className="text-[10px] text-[#5a5a78] truncate">
                        VA: <span className="text-[#9898b8] font-semibold">{c.voiceActors[0].name}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-1 h-6 rounded-full brand-gradient block" />
            <h2 className="text-xl font-bold font-[Outfit] text-white">Episodes</h2>
            <span className="text-sm text-[#5a5a78]">({anime.currentEpisode || anime.episodes || displayEpisodes.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayEpisodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/watch/${encodeURIComponent(anime.id)}?ep=${ep.number}`}
                className="flex items-center gap-4 p-4 glass border border-white/6 rounded-xl hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center text-sm font-black text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                  {ep.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white font-[Outfit] truncate group-hover:text-[#a855f7] transition-colors">
                    {ep.title}
                  </p>
                  <p className="text-xs text-[#9898b8]">
                    {ep.filler ? <span className="text-amber-500 mr-2">Filler</span> : null}
                    {ep.recap ? <span className="text-cyan-500 mr-2">Recap</span> : null}
                    {anime.duration || "24 min"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-[#5a5a78] group-hover:text-[#7c3aed] transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1 h-6 rounded-full brand-gradient block" />
              <h2 className="text-xl font-bold font-[Outfit] text-white">You Might Also Like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map((a, i) => (
                <AnimeCard key={a.id} anime={a} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
