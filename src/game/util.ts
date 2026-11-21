import type { GameState, LogEntry } from "./types";

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export function uid(s: GameState, prefix = "x"): string {
  s.seq += 1;
  return `${prefix}${s.seq}`;
}

export function log(s: GameState, text: string, tone: LogEntry["tone"] = "info") {
  s.log.unshift({ day: s.day, text, tone });
  if (s.log.length > 80) s.log.length = 80;
}

export function totalUsers(s: GameState): number {
  return s.products.reduce((a, p) => (p.status === "live" ? a + p.users : a), 0);
}

export function dailyRevenueAvg(s: GameState): number {
  if (!s.revHistory.length) return 0;
  return s.revHistory.reduce((a, b) => a + b, 0) / s.revHistory.length;
}

export function valuation(s: GameState): number {
  const run = dailyRevenueAvg(s) * 365;
  return Math.round(run * 5 + totalUsers(s) * 1.5 + Math.max(0, s.cash) * 0.5 + s.team.length * 8_000);
}

export function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(1)}k`;
  return `${sign}$${Math.round(a).toLocaleString("en-US")}`;
}

export function num(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${(n / 1e3).toFixed(1)}k`;
  return Math.round(n).toLocaleString("en-US");
}

export function dateLabel(day: number): string {
  const y = Math.floor((day - 1) / 360) + 1;
  const m = Math.floor(((day - 1) % 360) / 30) + 1;
  const d = ((day - 1) % 30) + 1;
  return `Year ${y} · Month ${m} · Day ${d}`;
}
