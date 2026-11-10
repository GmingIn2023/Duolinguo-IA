"use client";

import { useEffect } from "react";
import { saveTimezone } from "@/app/actions";

/**
 * Tells the server which timezone the learner lives in, once, and again if it changes (a move, a trip).
 * "Today" for the streak and the daily goal is then their own day. Renders nothing; a failure changes nothing
 * (the server keeps the timezone it had).
 */
export function TimezoneSync({ stored }: { stored: string | null }) {
  useEffect(() => {
    let timezone: string | undefined;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}
    if (timezone && timezone !== stored) saveTimezone(timezone).catch(() => {});
  }, [stored]);
  return null;
}
