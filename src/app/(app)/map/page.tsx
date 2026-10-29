import { redirect } from "next/navigation";

/** The old map lives on as the chapter overview. */
export default function MapPage() {
  redirect("/learn/chapitres");
}
