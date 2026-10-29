"use client";

import { createContext, useContext } from "react";

/** The settings a lesson or a review needs on the client: sounds on answers. */
export const LearnerPrefs = createContext<{ sounds: boolean }>({ sounds: false });
export const useLearnerPrefs = () => useContext(LearnerPrefs);
