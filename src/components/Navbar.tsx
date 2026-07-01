"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GENRES } from "@/lib/data";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Browse", href: "/browse" },
  { label: "New Releases", href: "/browse?filter=new" },
  { label: "Popular", href: "/browse?filter=popular" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setGenreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#08080f]/95 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-gradient-to-b from-[#08080f]/80 to-transparent backdrop-blur-sm"
        }`}
        style={{ height: "70px" }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-lg brand-gradient rotate-45 group-hover:rotate-[60deg] transition-transform duration-500" />
              <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg font-[Outfit]">A</span>
            </div>
            <span className="text-xl font-black tracking-tight font-[Outfit] hidden sm:block">
              ANI<span className="gradient-text">GMA</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "text-white bg-white/10"
                    : "text-[#9898b8] hover:text-white hover:bg-white/8"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Genres dropdown */}
            <div className="relative">
              <button
                onClick={() => setGenreOpen(!genreOpen)}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  genreOpen ? "text-white bg-white/10" : "text-[#9898b8] hover:text-white hover:bg-white/8"
                }`}
              >
                Genres
                <svg className={`w-3 h-3 transition-transform ${genreOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {genreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] glass rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/8">
                  <div className="grid grid-cols-3 gap-1">
                    {GENRES.map((g) => (
                      <Link
                        key={g}
                        href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                        className="px-3 py-1.5 rounded-lg text-sm text-[#9898b8] hover:text-white hover:bg-white/8 transition-all"
                      >
                        {g}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anime..."
                    className="w-48 md:w-64 bg-[#1a1a2e] border border-[#7c3aed]/40 rounded-full px-4 py-2 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="ml-2 text-[#9898b8] hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#9898b8] hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Notifications */}
            <button className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-[#9898b8] hover:text-white hover:bg-white/10 transition-all relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7c3aed] rounded-full" />
            </button>

            {/* Profile / Auth Section */}
            {status === "authenticated" && session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full transition-all focus:outline-none"
                >
                  {session.user.image || (session.user as any).avatar ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#7c3aed]/40">
                      <Image
                        src={session.user.image || (session.user as any).avatar}
                        alt={session.user.name || "User avatar"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center font-bold text-white text-sm font-[Outfit]">
                      {(session.user.name || session.user.email || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {profileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 glass rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/8">
                    <div className="px-3 py-2 border-b border-white/8 mb-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {session.user.name || (session.user as any).username || "User"}
                      </p>
                      <p className="text-xs text-[#9898b8] truncate">{session.user.email}</p>
                    </div>
                    {[
                      { label: "My Profile", href: "/profile", icon: "👤" },
                      { label: "Watchlist", href: "/profile?tab=watchlist", icon: "📋" },
                      { label: "Settings", href: "/profile?tab=settings", icon: "⚙️" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#9898b8] hover:text-white hover:bg-white/8 transition-all"
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-white/8 mt-2 pt-2">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all text-left"
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
            ) : (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-sm font-semibold text-[#9898b8] hover:text-white hover:bg-white/10 transition-all"
              >
                <span className="w-6 h-6 rounded-full brand-gradient flex items-center justify-center text-[10px] font-black text-white">G</span>
                Profile
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#9898b8] hover:text-white hover:bg-white/10 transition-all"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-[70px] left-0 right-0 glass border-b border-white/8 p-4 animate-fade-in-up">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-[#9898b8] hover:text-white hover:bg-white/8 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/8 mt-2 pt-2">
                <p className="px-4 py-1 text-xs text-[#5a5a78] font-semibold uppercase tracking-widest">Genres</p>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {GENRES.slice(0, 10).map((g) => (
                    <Link
                      key={g}
                      href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
                      className="px-4 py-2 rounded-xl text-sm text-[#9898b8] hover:text-white hover:bg-white/8 transition-all"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
                <Link href="/browse" className="block px-4 py-2 text-sm text-[#7c3aed] hover:text-[#a855f7] mt-1">
                  View all genres →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
