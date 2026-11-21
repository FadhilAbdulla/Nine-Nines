"use client";
import { create } from "zustand";
import type { StationId } from "@/game/types";
import type { Place } from "@/game/layout";

export type LaptopTab = "todo" | "finance" | "analytics" | "devops" | "support";

interface UI {
  at: StationId | null; // station the founder is standing at
  dash: StationId | null; // open dashboard
  talk: string | null; // employee card
  tree: boolean;
  laptop: boolean; // your laptop is open
  laptopTab: LaptopTab;
  openLaptop: (t?: LaptopTab) => void;
  closeLaptop: () => void;
  setLaptopTab: (t: LaptopTab) => void;
  place: Place; // where the founder currently is
  goOut: boolean; // 'Where to?' menu at the office door
  setPlace: (p: Place) => void;
  setGoOut: (b: boolean) => void;
  hands: null | { kind: "code" | "aicode" | "deploy" | "design" | "market" | "support"; defId?: string; productId?: string };
  openHands: (h: NonNullable<UI["hands"]>) => void;
  closeHands: () => void;
  setAt: (s: StationId | null) => void;
  openDash: (s: StationId) => void;
  closeDash: () => void;
  setTalk: (id: string | null) => void;
  setTree: (b: boolean) => void;
}

export const useUI = create<UI>((set) => ({
  at: null,
  dash: null,
  talk: null,
  tree: false,
  laptop: false,
  laptopTab: "todo",
  openLaptop: (t) => set((u) => ({ laptop: true, laptopTab: t ?? u.laptopTab })),
  closeLaptop: () => set({ laptop: false }),
  setLaptopTab: (laptopTab) => set({ laptopTab }),
  place: "office",
  goOut: false,
  setPlace: (place) => set({ place, goOut: false }),
  setGoOut: (goOut) => set({ goOut }),
  hands: null,
  openHands: (hands) => set({ hands }),
  closeHands: () => set({ hands: null }),
  setAt: (at) => set((u) => ({ at, dash: at && u.dash === at ? u.dash : null })),
  openDash: (dash) => set({ dash }),
  closeDash: () => set({ dash: null }),
  setTalk: (talk) => set({ talk }),
  setTree: (tree) => set({ tree }),
}));
