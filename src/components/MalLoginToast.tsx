"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function MalLoginToastContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(() => searchParams.get("malLoggedIn") === "1");

  useEffect(() => {
    if (searchParams.get("malLoggedIn") !== "1") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("malLoggedIn");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="flex items-center gap-2 px-5 py-3 rounded-full glass border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold shadow-lg">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Signed in with MyAnimeList
      </div>
    </div>
  );
}

export default function MalLoginToast() {
  return (
    <Suspense fallback={null}>
      <MalLoginToastContent />
    </Suspense>
  );
}
