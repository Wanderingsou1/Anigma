"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const STEPS = ["Account", "Profile", "Plan"] as const;
type Step = 0 | 1 | 2;

const PLANS = [
  { name: "free", label: "Free", price: "$0", period: "forever", features: ["720p", "Ads supported", "1 device", "Limited catalog"], popular: false },
  { name: "premium", label: "Premium", price: "$9.99", period: "/month", features: ["4K HDR", "No ads", "4 devices", "Full catalog", "Downloads"], popular: true },
  { name: "family", label: "Family", price: "$14.99", period: "/month", features: ["4K HDR", "No ads", "6 devices", "6 profiles", "Downloads"], popular: false },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium" | "family">("premium");

  // Interaction states
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password requirements checklist
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /[0-9]/.test(password);
  const passSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = passLength && passUpper && passLower && passNumber && passSpecial;

  // Step 1: Submit Account Creation
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const errorsMap: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
        } else {
          setErrorMsg(data.error || "Failed to create account.");
        }
      } else {
        // Success -> go to Step 2
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Genres setup
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Step 3: Complete Sign Up
  const handleFinish = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Authenticate the user session first
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setErrorMsg("Failed to sign in after registration. Please log in manually.");
        setLoading(false);
        return;
      }

      // 2. Save Plan and Genres via Profile PATCH
      const patchRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          favoriteGenres: selectedGenres,
        }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json();
        console.error("Failed to complete profile options:", patchData.error);
      }

      // 3. Redirect to home
      router.push("/home");
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("Registration completed but failed to set profile preferences. Please log in manually.");
      setLoading(false);
    }
  };

  const handleOAuthRegister = (provider: "google" | "discord") => {
    signIn(provider, { callbackUrl: "/home" });
  };

  return (
    <main className="min-h-screen bg-[#08080f] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 animated-gradient opacity-15" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-[#06b6d4]/15 blur-[100px]" />
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
        <Link href="/login" className="text-sm text-[#9898b8] hover:text-white transition-colors">
          Already have an account? <span className="text-[#a855f7] font-semibold">Sign in</span>
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  i === step ? "brand-gradient text-white" :
                  i < step ? "bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a855f7]" :
                  "bg-white/5 border border-white/10 text-[#5a5a78]"
                }`}>
                  <span>{i < step ? "✓" : i + 1}</span> {s}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-[#7c3aed]" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          <div className="glass border border-white/8 rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-fade-in-up">
                {errorMsg}
              </div>
            )}

            {step === 0 && (
              <form onSubmit={handleAccountSubmit}>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black font-[Outfit] text-white mb-2">Create Account</h1>
                  <p className="text-[#9898b8] text-sm">Join millions of anime fans on Anigma</p>
                </div>

                <div className="flex gap-3 mb-6">
                  <button type="button" onClick={() => handleOAuthRegister("google")} className="flex-1 py-3 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer">
                    Google
                  </button>
                  <button type="button" onClick={() => handleOAuthRegister("discord")} className="flex-1 py-3 rounded-xl border border-white/10 text-white text-xs font-semibold hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer">
                    Discord
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-[#5a5a78]">or email</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. AnimeKing"
                      required
                      className={`w-full bg-[#1a1a2e] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/70 transition-all ${
                        fieldErrors.username ? "border-red-500" : "border-white/10"
                      }`}
                    />
                    {fieldErrors.username && <p className="text-red-400 text-xs mt-1.5 font-medium">{fieldErrors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={`w-full bg-[#1a1a2e] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/70 transition-all ${
                        fieldErrors.email ? "border-red-500" : "border-white/10"
                      }`}
                    />
                    {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        className={`w-full bg-[#1a1a2e] border rounded-xl px-4 pr-12 py-3.5 text-sm text-white placeholder-[#5a5a78] outline-none focus:border-[#7c3aed]/70 transition-all ${
                          fieldErrors.password ? "border-red-500" : "border-white/10"
                        }`}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a78] hover:text-white text-xs font-bold focus:outline-none">
                        {showPass ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>}

                    {/* Password requirements list */}
                    {password.length > 0 && (
                      <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-[#9898b8] space-y-1 animate-fade-in-up">
                        <p className="font-semibold text-white mb-1">Password requirements:</p>
                        <div className="flex items-center gap-2">
                          <span className={passLength ? "text-green-400 font-bold" : "text-[#5a5a78]"}>{passLength ? "✓" : "○"}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={passUpper ? "text-green-400 font-bold" : "text-[#5a5a78]"}>{passUpper ? "✓" : "○"}</span>
                          <span>At least one uppercase letter (A-Z)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={passLower ? "text-green-400 font-bold" : "text-[#5a5a78]"}>{passLower ? "✓" : "○"}</span>
                          <span>At least one lowercase letter (a-z)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={passNumber ? "text-green-400 font-bold" : "text-[#5a5a78]"}>{passNumber ? "✓" : "○"}</span>
                          <span>At least one number (0-9)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={passSpecial ? "text-green-400 font-bold" : "text-[#5a5a78]"}>{passSpecial ? "✓" : "○"}</span>
                          <span>At least one special character (!@#$%, etc.)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !username || !email || !isPasswordValid}
                    className="w-full py-4 rounded-xl brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : "Continue"}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <>
                <div className="text-center mb-8 animate-fade-in-up">
                  <h1 className="text-3xl font-black font-[Outfit] text-white mb-2">Your Profile</h1>
                  <p className="text-[#9898b8] text-sm">Let the anime community know what you like</p>
                </div>

                {/* Avatar Display */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full brand-gradient flex items-center justify-center text-3xl font-black text-white font-[Outfit]">
                      {username ? username[0].toUpperCase() : "?"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#9898b8] uppercase tracking-widest mb-3">Favorite Genres (Select all that apply)</label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border border-white/5 rounded-xl bg-white/5" style={{ scrollbarWidth: "none" }}>
                      {["Action", "Fantasy", "Romance", "Isekai", "Horror", "Comedy", "Mecha", "Mystery", "Slice of Life", "Sci-Fi", "Sports", "Supernatural"].map(g => {
                        const isSelected = selectedGenres.includes(g);
                        return (
                          <button
                            key={g}
                            onClick={() => toggleGenre(g)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "brand-gradient text-white border-transparent shadow-md"
                                : "border-white/10 text-[#9898b8] hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setStep(0)} className="flex-1 py-3.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all cursor-pointer">
                      Back
                    </button>
                    <button onClick={() => setStep(2)}
                      className="flex-1 py-3.5 rounded-xl brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer">
                      Continue
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-8 animate-fade-in-up">
                  <h1 className="text-3xl font-black font-[Outfit] text-white mb-2">Choose Your Plan</h1>
                  <p className="text-[#9898b8] text-sm">Cancel anytime. No hidden fees.</p>
                </div>

                <div className="space-y-3 mb-6">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name as any)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        selectedPlan === plan.name
                          ? "border-[#7c3aed]/60 bg-[#7c3aed]/10 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                          : "border-white/8 hover:border-white/15 hover:bg-white/3"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full brand-gradient text-white text-[10px] font-bold">POPULAR</span>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.name ? "border-[#7c3aed]" : "border-white/30"}`}>
                            {selectedPlan === plan.name && <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />}
                          </div>
                          <span className="font-bold font-[Outfit] text-white">{plan.label}</span>
                        </div>
                        <span className="font-black font-[Outfit] text-white">{plan.price}<span className="text-xs text-[#9898b8] font-normal">{plan.period}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-7">
                        {plan.features.map(f => (
                          <span key={f} className="text-[10px] text-[#9898b8] bg-white/5 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all cursor-pointer">
                    Back
                  </button>
                  <button onClick={handleFinish} disabled={loading}
                    className="flex-1 py-3.5 rounded-xl brand-gradient text-white font-bold font-[Outfit] text-sm shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : "Start Watching 🎉"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center pb-8 text-xs text-[#5a5a78]">
        © 2026 Anigma · <Link href="#" className="hover:text-white transition-colors">Privacy</Link> · <Link href="#" className="hover:text-white transition-colors">Terms</Link>
      </div>
    </main>
  );
}
