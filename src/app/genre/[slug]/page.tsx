import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import { GENRES } from "@/lib/data";
import { getAnimeByGenre } from "@/lib/api/jikan";
import type { Metadata } from "next";

const GENRE_META: Record<string, { icon: string; color: string; desc: string }> = {
  action: { icon: "⚔️", color: "from-red-900/60 to-red-950", desc: "Heart-pounding battles, intense fight sequences, and non-stop excitement." },
  fantasy: { icon: "🔮", color: "from-purple-900/60 to-purple-950", desc: "Magical worlds, mythical creatures, and epic quests beyond imagination." },
  romance: { icon: "💕", color: "from-pink-900/60 to-pink-950", desc: "Heartwarming love stories, sweet moments, and emotional connections." },
  isekai: { icon: "🌀", color: "from-cyan-900/60 to-cyan-950", desc: "Characters transported to another world, discovering new powers and adventures." },
  horror: { icon: "👻", color: "from-gray-900/80 to-gray-950", desc: "Spine-chilling thrills, psychological dread, and terrifying supernatural forces." },
  comedy: { icon: "😂", color: "from-yellow-900/60 to-yellow-950", desc: "Hilarious moments, absurd situations, and light-hearted fun for everyone." },
  mystery: { icon: "🔍", color: "from-indigo-900/60 to-indigo-950", desc: "Intricate puzzles, hidden clues, and mind-bending plot twists." },
  drama: { icon: "🎭", color: "from-orange-900/60 to-orange-950", desc: "Emotionally rich stories exploring the depths of human experience." },
  "sci-fi": { icon: "🚀", color: "from-blue-900/60 to-blue-950", desc: "Futuristic technology, space exploration, and thought-provoking concepts." },
  psychological: { icon: "🧠", color: "from-violet-900/60 to-violet-950", desc: "Mind-bending narratives that challenge your perception of reality." },
  mecha: { icon: "🤖", color: "from-slate-900/70 to-slate-950", desc: "Giant robots, epic battles, and humanity's fight for survival." },
  shounen: { icon: "🔥", color: "from-amber-900/60 to-amber-950", desc: "Young heroes growing stronger through friendship, determination, and epic battles." },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} Anime - Anigma`,
    description: `Discover the best ${name} anime on Anigma. Stream in HD.`,
  };
}

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genreName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const meta = GENRE_META[slug] ?? { icon: "🎬", color: "from-[#1a1a2e] to-[#08080f]", desc: `Explore the best ${genreName} anime.` };
  const result = await getAnimeByGenre(slug, 1, 24);
  const otherGenres = GENRES.filter((g) => g.toLowerCase() !== genreName.toLowerCase()).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />
      <div className="pt-[70px]">
        <div className={`relative py-20 px-4 md:px-6 overflow-hidden bg-gradient-to-b ${meta.color}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#08080f]" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.2) 0%, transparent 40%)",
          }} />
          <div className="relative max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{meta.icon}</span>
              <div>
                <p className="text-xs text-[#9898b8] uppercase tracking-widest font-semibold mb-1">Genre</p>
                <h1 className="text-4xl md:text-6xl font-black font-[Outfit] text-white">{genreName}</h1>
              </div>
            </div>
            <p className="text-[#9898b8] text-lg max-w-xl mt-3">{meta.desc}</p>
            <div className="flex items-center gap-6 mt-5 text-sm text-[#9898b8]">
              <span>
                <span className="text-white font-bold">{result.data.length}</span> titles
              </span>
              <span>
                <span className="text-white font-bold">HD</span> quality
              </span>
              <span>
                <span className="text-white font-bold">Sub & Dub</span> available
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1 h-6 rounded-full brand-gradient block" />
              <h2 className="text-xl font-bold font-[Outfit] text-white">{genreName} Anime</h2>
              <span className="text-sm text-[#5a5a78]">({result.data.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-16">
            {result.data.map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} index={i} />
            ))}
          </div>

          <div className="border-t border-white/5 pt-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1 h-6 rounded-full brand-gradient block" />
              <h2 className="text-xl font-bold font-[Outfit] text-white">Explore Other Genres</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {otherGenres.map((g, i) => (
                <a
                  key={g}
                  href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: i % 3 === 0 ? "rgba(124,58,237,0.12)" : i % 3 === 1 ? "rgba(6,182,212,0.08)" : "rgba(244,114,182,0.08)",
                    borderColor: i % 3 === 0 ? "rgba(124,58,237,0.35)" : i % 3 === 1 ? "rgba(6,182,212,0.25)" : "rgba(244,114,182,0.25)",
                    color: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#22d3ee" : "#f472b6",
                  }}
                >
                  {g}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
