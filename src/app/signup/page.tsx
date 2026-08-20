"use client";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#08080f] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 animated-gradient opacity-15" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#06b6d4]/15 blur-[100px]" />
        <div className="absolute inset-0 bg-[#08080f]/70" />
      </div>

      <nav className="relative z-10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-lg brand-gradient rotate-45" />
            <span className="absolute inset-0 flex items-center justify-center text-white font-black font-[Outfit]">A</span>
          </div>
          <span className="text-xl font-black font-[Outfit]">ANI<span className="gradient-text">GMA</span></span>
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass border border-white/8 rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] text-center">
            <h1 className="text-3xl font-black font-[Outfit] text-white mb-2">Create Your Account</h1>
            <p className="text-[#9898b8] text-sm mb-8">
              Anigma accounts are created automatically the first time you sign in with MyAnimeList — no separate signup needed.
            </p>

            <a
              href={`/api/auth/mal/login?callbackUrl=${encodeURIComponent("/home")}`}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Continue with MyAnimeList
            </a>

            <p className="text-xs text-[#5a5a78] mt-6">
              Already have an account? <Link href="/login" className="text-[#a855f7] font-semibold hover:text-[#7c3aed] transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center pb-8 text-xs text-[#5a5a78]">
        © 2026 Anigma · <Link href="#" className="hover:text-white transition-colors">Privacy</Link> · <Link href="#" className="hover:text-white transition-colors">Terms</Link>
      </div>
    </main>
  );
}
