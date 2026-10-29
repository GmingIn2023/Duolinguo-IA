"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { PlacementFlow } from "@/components/placement/PlacementFlow";
import type { TrackId } from "@/content/types";
import { saveOnboarding } from "@/lib/onboardingStorage";
import type { Guide } from "./HeroScene";

const TRACK_TITLE: Record<TrackId, string> = { bird: "Repartir de zéro", gecko: "Étudier et travailler mieux", fox: "Brancher l'IA à tes outils" };

/**
 * "Par où commencer ?": the real level test inside the landing page, or a direct choice of track.
 * Both end on /signup, which grades the answers again on the server.
 */
export function LandingPlacement({ guides }: { guides: Guide[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<TrackId | null>(null);

  function goSignup(id: TrackId) {
    saveOnboarding({ placement: [], goal: null, tested: null, track: id });
    router.push(`/signup?track=${id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-start lg:gap-8">
      <div id="test" className="tile min-h-[26rem] scroll-mt-6 p-5 sm:p-8">
        <PlacementFlow signedIn={false} compact />
      </div>

      <div className="grid gap-3">
        <p className="font-semibold">Ou choisis ton parcours</p>
        {guides.map((g) => (
          <button
            key={g.id}
            data-track={g.id}
            aria-pressed={picked === g.id}
            onClick={() => setPicked(g.id)}
            className="tile tile-accent tile-press grid grid-cols-[3.75rem_1fr] items-center gap-4 p-4 text-left aria-pressed:outline aria-pressed:outline-[3px] aria-pressed:outline-offset-[3px] aria-pressed:outline-ink"
          >
            <span className="grid size-[3.75rem] place-items-center rounded-2xl bg-surface">
              <Avatar track={g.id} size={48} decorative />
            </span>
            <span className="grid gap-0.5">
              <span className="display display-s">{g.name}</span>
              <span className="text-[0.9375rem] leading-snug">{TRACK_TITLE[g.id]}</span>
            </span>
          </button>
        ))}
        {picked && (
          <div className="fade-in tile grid gap-3 p-5" role="status" data-track={picked}>
            <p className="display display-s">Tu pars sur {guides.find((g) => g.id === picked)?.name}, depuis le début.</p>
            <div>
              <button className="btn btn-primary" onClick={() => goSignup(picked)}>
                Créer mon compte et commencer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
