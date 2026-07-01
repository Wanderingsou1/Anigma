import Link from "next/link";
import { GENRES } from "@/lib/data";

const FOOTER_LINKS = {
  Company: [
    { label: "About Anigma", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  Support: [
    { label: "FAQ", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Report Issue", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "DMCA", href: "#" },
  ],
  Browse: [
    { label: "All Anime", href: "/browse" },
    { label: "New Releases", href: "/browse?filter=new" },
    { label: "Popular", href: "/browse?filter=popular" },
    { label: "Schedule", href: "/browse?tab=schedule" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#08080f] border-t border-white/5 mt-20">
      <div className="brand-gradient h-[2px] w-full" />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-xl brand-gradient rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl font-[Outfit]">A</span>
              </div>
              <span className="text-2xl font-black tracking-tight font-[Outfit]">
                ANI<span className="gradient-text">GMA</span>
              </span>
            </Link>
            <p className="text-sm text-[#9898b8] leading-relaxed max-w-xs mb-6">
              Your ultimate anime streaming destination. Watch HD anime online — subbed, dubbed, and beyond.
            </p>
            <div className="flex items-center gap-3">
              {[
                { label: "Twitter", href: "#" },
                { label: "Discord", href: "#" },
                { label: "Reddit", href: "#" },
                { label: "YouTube", href: "#" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-xs text-[#9898b8] hover:text-white hover:bg-[#7c3aed]/20 hover:border-[#7c3aed]/40 transition-all font-bold"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">{section}</h3>
              <ul className="flex flex-col gap-2">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[#9898b8] hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 mb-8">
          <p className="text-xs text-[#5a5a78] font-semibold uppercase tracking-widest mb-3">Browse Genres</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Link
                key={g}
                href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1 bg-white/4 border border-white/6 rounded-full text-xs text-[#9898b8] hover:text-white hover:bg-white/8 hover:border-[#7c3aed]/40 transition-all"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5a5a78]">© 2024 Anigma. All rights reserved.</p>
          <p className="text-xs text-[#5a5a78]">Made with ❤️ for anime fans</p>
        </div>
      </div>
    </footer>
  );
}
