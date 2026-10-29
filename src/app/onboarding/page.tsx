import type { Metadata } from "next";
import { isTrackId } from "@/content/curriculum";
import { getViewer } from "@/lib/data";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Test de niveau" };

export default async function Page(props: PageProps<"/onboarding">) {
  const { track } = await props.searchParams;
  const viewer = await getViewer().catch(() => null);
  // ?track=gecko opens that track's test directly (a retake, or "take the next track's test")
  const initial = isTrackId(track) ? track : null;
  return <Onboarding signedIn={Boolean(viewer)} initialTrack={initial} />;
}
