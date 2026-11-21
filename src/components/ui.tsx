"use client";
import { useGame } from "@/store/useGame";
import type { GameState } from "@/game/types";

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: "ok" | "warn" | "bad" | "accent" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const t = tone ?? (pct > 66 ? "ok" : pct > 33 ? "warn" : "bad");
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i className={`t-${t}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`Skill ${n} of 10`}>
      {"●".repeat(n)}
      <span className="dim">{"●".repeat(10 - n)}</span>
    </span>
  );
}

export function useAct() {
  return useGame((s) => s.act);
}

export function useG(): GameState {
  return useGame((s) => s.game)!;
}
