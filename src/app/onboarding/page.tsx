import type { Metadata } from "next";
import { getViewer } from "@/lib/data";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Test de niveau" };

export default async function Page() {
  const viewer = await getViewer().catch(() => null);
  return <Onboarding signedIn={Boolean(viewer)} currentTrack={viewer?.profile.track_id ?? null} />;
}
