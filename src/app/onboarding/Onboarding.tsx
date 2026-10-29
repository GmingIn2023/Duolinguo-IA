"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { PlacementFlow } from "@/components/placement/PlacementFlow";
import type { TrackId } from "@/content/types";

/** The level test as a full page: a goal, the test of that track, the result. Also used for a signed-in retake. */
export function Onboarding({ signedIn, initialTrack }: { signedIn: boolean; initialTrack: TrackId | null }) {
  const [progress, setProgress] = useState(initialTrack ? 0.5 : 0);
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
        <Link href={signedIn ? "/learn" : "/"} className="icon-btn" aria-label="Quitter le test">
          <X className="size-6" aria-hidden />
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Étapes" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${Math.max(0.04, progress) * 100}%` }} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
        <PlacementFlow signedIn={signedIn} initialTrack={initialTrack} onStage={(_, p) => setProgress(p)} />
      </main>
    </div>
  );
}
