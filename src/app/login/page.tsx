"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const authError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("password")) {
          setErrorMsg("Invalid password. Please try again.");
        } else if (res.error.includes("No account")) {
          setErrorMsg("No account found with this email.");
        } else {
          setErrorMsg(res.error);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: "google" | "discord") => {
    signIn(provider, { callbackUrl });
  };

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
        <Link href="/signup" className="text-sm text-[#9898b8] hover:text-white transition-colors">
          New? <span className="text-[#a855f7] font-semibold">Sign up</span>
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass border border-white/8 rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black font-[Outfit] text-white mb-2">Welcome Back</h1>
              <p className="text-[#9898b8] text-sm">Sign in to continue your anime journey</p>
            </div>

            {/* Error notifications */}
            {(errorMsg || authError) && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-fade-in-up">
                {errorMsg || (authError === "OAuthSignin" ? "OAuth login cancelled or failed." : "Authentication failed. Please try again.")}
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignIn("discord")}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
              >
                Discord
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-[#5a5a78]">or email</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/70 transition-all" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest">Password</label>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 pr-12 py-3.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/70 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a78] hover:text-white transition-colors text-xs font-bold focus:outline-none">
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</> : "Sign In"}
              </button>
            </form>

            <p className="text-center text-xs text-[#5a5a78] mt-6">
              No account? <Link href="/signup" className="text-[#a855f7] font-semibold hover:text-[#7c3aed] transition-colors">Create one free</Link>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f]" />}>
      <LoginContent />
    </Suspense>
  );
}
