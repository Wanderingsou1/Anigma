import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    icon: "🎬",
    title: "HD Streaming",
    desc: "Crystal-clear 1080p video quality for an immersive anime experience.",
  },
  {
    icon: "📱",
    title: "Watch Anywhere",
    desc: "Stream seamlessly on your phone, tablet, laptop, or smart TV.",
  },
  {
    icon: "⬇️",
    title: "Offline Mode",
    desc: "Download your favorite episodes and watch without internet.",
  },
  {
    icon: "🌍",
    title: "Sub & Dub",
    desc: "Choose between subtitled originals or full English dubs.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["720p streaming", "Ads supported", "Limited catalog", "1 device"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month",
    features: ["1080p + 4K streaming", "No ads", "Full catalog", "4 devices", "Offline downloads", "Early access"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Family",
    price: "$14.99",
    period: "per month",
    features: ["1080p + 4K streaming", "No ads", "Full catalog", "6 devices", "Offline downloads", "6 profiles"],
    cta: "Choose Family",
    highlight: false,
  },
];

const FAQS = [
  { q: "What is Anigma?", a: "Anigma is a premium anime streaming platform offering thousands of anime series and movies in HD quality. From classic titles to seasonal simulcasts, we have everything for every anime fan." },
  { q: "Is Anigma free?", a: "Yes! Anigma offers a free tier with access to a wide catalog of anime. Upgrade to Premium for 4K streaming, no ads, offline downloads, and access to our entire library." },
  { q: "Can I watch on multiple devices?", a: "Free accounts support 1 device. Premium plans support up to 4 simultaneous streams, and the Family plan allows 6." },
  { q: "Are there English dubs available?", a: "Absolutely! We offer both subbed and dubbed versions for thousands of titles. You can switch between them instantly." },
  { q: "How often is new content added?", a: "New episodes are added within hours of their Japanese broadcast. We also add new shows, movies, and OVAs regularly." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#08080f]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[70px]">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 animated-gradient opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080f]/60 via-transparent to-[#08080f]" />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#06b6d4]/15 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#7c3aed]/30 text-sm text-[#a855f7] font-semibold mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
            Now Streaming — 10,000+ Anime Titles
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-[Outfit] text-white leading-none mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Unlock the<br />
            <span className="gradient-text">Anime Universe</span>
          </h1>

          <p className="text-lg md:text-xl text-[#9898b8] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Stream thousands of anime in stunning HD. Discover your next obsession, follow seasonal simulcasts, and build your ultimate watchlist — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-full brand-gradient text-white font-bold font-[Outfit] text-base shadow-[0_4px_30px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_50px_rgba(124,58,237,0.7)] hover:-translate-y-1 transition-all">
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/browse"
              className="flex items-center gap-2 px-8 py-4 rounded-full glass border border-white/15 text-white font-bold font-[Outfit] text-base hover:bg-white/10 hover:border-white/25 transition-all">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Browse Anime
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "10K+", label: "Anime Titles" },
              { value: "1080p", label: "HD Quality" },
              { value: "2M+", label: "Active Users" },
              { value: "24/7", label: "New Episodes" },
            ].map((stat) => (
              <div key={stat.label} className="glass border border-white/6 rounded-2xl p-5 text-center">
                <div className="text-2xl md:text-3xl font-black font-[Outfit] gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-[#9898b8] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 md:px-6 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-4">
              Why choose <span className="gradient-text">Anigma?</span>
            </h2>
            <p className="text-[#9898b8] max-w-xl mx-auto">Built by anime fans, for anime fans. Everything you need for the perfect streaming experience.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="glass border border-white/6 rounded-2xl p-7 hover:border-[#7c3aed]/40 hover:shadow-[0_8px_32px_rgba(124,58,237,0.15)] transition-all group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-bold font-[Outfit] text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[#9898b8] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Genre Showcase */}
      <section className="py-24 px-4 md:px-6 bg-[#0f0f1a]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-4">
              Every Genre, <span className="gradient-text">One Platform</span>
            </h2>
            <p className="text-[#9898b8] max-w-xl mx-auto">From action-packed shounen to heartwarming slice of life — we have it all.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Action", "Fantasy", "Romance", "Isekai", "Mystery", "Horror", "Comedy", "Sci-Fi", "Psychological", "Shounen", "Seinen", "Mecha", "Historical", "Supernatural"].map((g, i) => (
              <Link
                key={g}
                href={`/genre/${g.toLowerCase()}`}
                className="px-5 py-2.5 rounded-full border text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: i % 3 === 0 ? "rgba(124,58,237,0.15)" : i % 3 === 1 ? "rgba(6,182,212,0.1)" : "rgba(244,114,182,0.1)",
                  borderColor: i % 3 === 0 ? "rgba(124,58,237,0.4)" : i % 3 === 1 ? "rgba(6,182,212,0.3)" : "rgba(244,114,182,0.3)",
                  color: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#22d3ee" : "#f472b6",
                }}
              >
                {g}
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-full brand-gradient text-white font-bold font-[Outfit] text-sm hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.4)]">
              Explore All Genres →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-4">
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </h2>
            <p className="text-[#9898b8] max-w-xl mx-auto">Start free, upgrade when you&apos;re ready. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all ${
                  plan.highlight
                    ? "border-[#7c3aed]/60 shadow-[0_0_60px_rgba(124,58,237,0.2)] bg-gradient-to-b from-[#7c3aed]/10 to-[#12121f]"
                    : "border-white/8 bg-[#12121f] hover:border-white/15"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full brand-gradient text-white text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-black font-[Outfit] text-white mb-1">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black font-[Outfit] text-white">{plan.price}</span>
                  <span className="text-[#9898b8] text-sm ml-1">/{plan.period}</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#9898b8]">
                      <svg className="w-4 h-4 text-[#7c3aed] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className={`block w-full text-center py-3 rounded-full font-bold font-[Outfit] text-sm transition-all ${
                    plan.highlight
                      ? "brand-gradient text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-0.5"
                      : "border border-white/15 text-white hover:bg-white/8"
                  }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 md:px-6 bg-[#0f0f1a]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="glass border border-white/6 rounded-2xl p-6 group hover:border-[#7c3aed]/30 transition-all">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-white font-[Outfit] list-none">
                  {faq.q}
                  <svg className="w-5 h-5 text-[#9898b8] group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm text-[#9898b8] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative glass border border-[#7c3aed]/30 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 animated-gradient opacity-10" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black font-[Outfit] text-white mb-4">
                Ready to start watching?
              </h2>
              <p className="text-[#9898b8] mb-8 max-w-xl mx-auto">
                Join millions of anime fans on Anigma. Create your free account today.
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full brand-gradient text-white font-bold font-[Outfit] text-base shadow-[0_4px_30px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_50px_rgba(124,58,237,0.7)] hover:-translate-y-1 transition-all">
                Create Free Account
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
