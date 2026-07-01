import { Suspense } from "react";
import WatchContent from "./WatchContent";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WatchContent id={id} />
    </Suspense>
  );
}
