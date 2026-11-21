"use client";
import { useEffect, useState } from "react";
import { OFFICES } from "@/game/data";
import { deriveStats, freeDesks } from "@/game/engine";
import type { GameState } from "@/game/types";
import { CAMPAIGNS } from "@/game/data";
import { dateLabel, money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import Dashboard from "./Dashboards";
import PersonCard from "./PersonCard";
import TreeModal from "./TreeModal";
import { useUI } from "@/store/useUI";
import { EndScreen, StartScreen, Toast } from "./Overlays";
import Dialogue from "./Dialogue";
import Hud from "./Hud";
import Scene from "./Scene";
import { useG } from "./ui";

export default function Game() {
  const [ready, setReady] = useState(false);
  const game = useGame((s) => s.game);
  const speed = useGame((s) => s.speed);
  const tick = useGame((s) => s.tick);

  useEffect(() => {
    Promise.resolve(useGame.persist.rehydrate()).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !game || speed === 0) return;
    const ms = 900 / speed;
    const id = setInterval(() => {
      if (!document.hidden) tick();
    }, ms);
    return () => clearInterval(id);
  }, [ready, !!game, speed, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      const st = useGame.getState();
      if (st.game?.event) return;
      if (e.key === " ") { e.preventDefault(); st.setSpeed(st.speed === 0 ? 1 : 0); }
      if (e.key === "1") st.setSpeed(1);
      if (e.key === "2") st.setSpeed(3);
      if (e.key === "3") st.setSpeed(8);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) return <main className="start"><p className="dim">Loading…</p></main>;
  if (!game) return <StartScreen />;
  return <Playing />;
}

function Playing() {
  const g = useG();
  const dash = useUI((u) => u.dash);
  const hint = nextHint(g);

  return (
    <div className="world">
      <Scene />
      <Hud />
      {hint && !g.event && <div className="hint-float" role="note">💡 {hint}</div>}
      {dash && !g.event && (
        <aside className="drawer" aria-label="Dashboard">
          <Dashboard id={dash} />
        </aside>
      )}
      <PersonCard />
      <TreeModal />
      <Dialogue />
      <EndScreen />
      <Toast />
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <b className={`v mono ${tone === "bad" ? "badc" : tone === "warn" ? "warnc" : ""}`}>{value}</b>
      <span className="s mono">{sub}</span>
    </div>
  );
}

function nextHint(g: GameState): string | null {
  if (g.ended) return null;
  if (g.cash < 0) return "You're out of cash! Stop spending, run a cheap campaign, or take an investor offer before the company folds.";
  const d = deriveStats(g);
  const prod = g.products[0];
  if (!g.founded) {
    if (!prod) return "Press Open dashboard at your desk to see your laptop.";
    return `Prototype ${Math.round((prod.progress / prod.cost) * 100)}% done. You're coding all night. Press 3 for 8× speed.`;
  }
  const building = g.products.find((p) => p.status === "building");
  if (!d.hasEngineer && building) return "Your prototype is stuck at 60%. Walk to the Partner desk and hire an Application Engineer.";
  if (g.products.some((p) => p.status === "built") && !d.hasOps) return "The app is built but not hosted. Hire a DevOps Engineer at the Partner desk.";
  if (g.products.some((p) => p.status === "built")) return "Walk to the DevOps desk and deploy your app.";
  if (g.products.some((p) => p.status === "deploying")) return "DevOps is deploying your app. Almost live!";
  const live = g.products.filter((p) => p.status === "live");
  if (live.length && !g.campaigns.length && g.cash >= CAMPAIGNS[0].cost && totalUsers(g) < 3000) return "You're live! Walk to the Marketing desk and run a campaign to attract users.";
  if (d.load > 1) return "Servers are overloaded. Hire more DevOps or buy hosting tools at the DevOps desk.";
  if (d.overload > 0) return "Your team is overloaded. Hire a manager (each handles 6 people) or set your focus to Manage at your desk.";
  if (d.coverage < 0.7) return "Support tickets are piling up. Hire support staff or buy helpdesk software.";
  if (freeDesks(g) <= 0 && g.officeLevel < OFFICES.length - 1) return "You're out of desks. Ask your partner about a bigger office.";
  if (live.length && !building && g.products.length < 6) return "Ready for another product? Check the Ideas list on your laptop or the Engineering desk.";
  return null;
}
