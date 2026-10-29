import type { Metadata } from "next";
import { Atelier } from "@/components/atelier/Atelier";
import { ATELIER } from "@/content/atelier";
import { requireViewer } from "@/lib/data";
import { parsePreferences } from "@/lib/prefs";

export const metadata: Metadata = { title: "L'atelier du prompt" };

export default async function AtelierPage() {
  const { profile } = await requireViewer();
  const track = profile.track_id ?? "bird";
  const prefs = parsePreferences(profile.preferences);
  return <Atelier track={track} missions={ATELIER[track]} sounds={prefs.sounds} motion={prefs.motion} />;
}
