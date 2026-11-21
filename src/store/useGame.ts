"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as E from "@/game/engine";
import { getEvent } from "@/game/events";
import type { FounderFocus, GameState } from "@/game/types";

interface Store {
  game: GameState | null;
  speed: number; // 0 = paused
  toast: string | null;
  newGame: (company: string, founder: string) => void;
  reset: () => void;
  setSpeed: (n: number) => void;
  tick: () => void;
  act: (fn: (s: GameState) => string | null | void) => void;
  chooseEvent: (idx: number) => void;
  closeEvent: () => void;
  setFocusMode: (f: FounderFocus) => void;
  dismissToast: () => void;
}

const clone = <T,>(x: T): T => structuredClone(x);

export const useGame = create<Store>()(
  persist(
    (set, get) => ({
      game: null,
      speed: 1,
      toast: null,
      newGame: (company, founder) => set({ game: E.newGame(company, founder), speed: 1, toast: null }),
      reset: () => set({ game: null, speed: 1, toast: null }),
      setSpeed: (n) => set({ speed: n }),
      tick: () => {
        const g = get().game;
        if (!g || g.event || g.ended) return;
        const n = clone(g);
        E.tick(n);
        set({ game: n });
      },
      act: (fn) => {
        const g = get().game;
        if (!g) return;
        const n = clone(g);
        const err = fn(n);
        set({ game: n, toast: typeof err === "string" ? err : null });
      },
      chooseEvent: (idx) => {
        const g = get().game;
        if (!g || !g.event || g.event.result) return;
        const ev = getEvent(g.event.id);
        const choice = ev?.choices[idx];
        if (!ev || !choice || choice.disabled?.(g)) return;
        const n = clone(g);
        const res = choice.apply(n);
        n.event = { id: ev.id, result: res || "Done." };
        set({ game: n });
      },
      closeEvent: () => {
        const g = get().game;
        if (!g) return;
        const n = clone(g);
        n.event = null;
        set({ game: n });
      },
      setFocusMode: (f) => get().act((s) => { s.founderFocus = f; }),
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: "nine-nines-save-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ game: s.game, speed: s.speed }),
      skipHydration: true,
    },
  ),
);
