import type { Metadata } from "next";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Trouver mon parcours" };

export default function Page() {
  return <Onboarding />;
}
