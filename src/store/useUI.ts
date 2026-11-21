"use client";
import { create } from "zustand";
import type { StationId } from "@/game/types";

interface UI {
  at: StationId | null; // station the founder is standing at
  dash: StationId | null; // open dashboard
  talk: string | null; // employee card
  tree: boolean;
  hands: null | { kind: "code" | "deploy" | "design" | "market" | "support"; defId?: string; productId?: string };
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
  hands: null,
  openHands: (hands) => set({ hands }),
  closeHands: () => set({ hands: null }),
  setAt: (at) => set((u) => ({ at, dash: at && u.dash === at ? u.dash : null })),
  openDash: (dash) => set({ dash }),
  closeDash: () => set({ dash: null }),
  setTalk: (talk) => set({ talk }),
  setTree: (tree) => set({ tree }),
}));
