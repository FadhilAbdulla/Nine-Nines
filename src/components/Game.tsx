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
import { EndScreen, EventModal, StartScreen, Toast } from "./Overlays";
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
  const setTree = useUI((u) => u.setTree);
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const d = deriveStats(g);
  const net = d.revenue - d.burn;
  const hint = nextHint(g);

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <h1>{g.company || "Untitled project"}</h1>
          <span className="dim small">{dateLabel(g.day)}</span>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => setTree(true)}>🌳 Company tree</button>
          <div className="speed" role="group" aria-label="Game speed">
            {[[0, "⏸"], [1, "1×"], [3, "3×"], [8, "8×"]].map(([v, l]) => (
              <button key={v} aria-pressed={speed === v} onClick={() => setSpeed(v as number)}>{l}</button>
            ))}
          </div>
        </div>
      </header>

      <section className="stats" aria-label="Company stats">
        <Stat label="Cash" value={money(g.cash)} sub={`${net >= 0 ? "+" : ""}${money(net)}/day`} tone={g.cash < 0 ? "bad" : net < 0 ? "warn" : "good"} />
        <Stat label="Users" value={num(totalUsers(g))} sub={`${money(d.revenue)}/day revenue`} />
        <Stat label="Reputation" value={`${Math.round(g.rep)}`} sub="out of 100" />
        <Stat label="Team" value={`${g.team.length + (g.founded ? 2 : 1)}`} sub={g.founded ? `${freeDesks(g)} free desks` : "just you"} />
        <Stat label="Valuation" value={g.founded ? money(valuation(g)) : "—"} sub={g.founded ? `you own ${(g.equity * 100).toFixed(0)}%` : "no company yet"} />
      </section>

      {hint && <div className="hint" role="note">💡 {hint}</div>}

      <div className="app">
        <div className="col">
          <Scene />
          <section className="panel" aria-label="Company log">
            <div className="panel-head"><h2>Journal</h2></div>
            <ul className="log">
              {g.log.slice(0, 14).map((l, i) => (
                <li key={`${l.day}-${i}-${l.text}`} className={l.tone}>
                  <span className="mono dim">D{l.day}</span> {l.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="panel side" aria-label="Dashboard">
          {dash ? (
            <Dashboard id={dash} />
          ) : (
            <div className="empty-dash">
              <div className="big">🖥️</div>
              <h2>No dashboard open</h2>
              <p className="dim">Dashboards live on desks. Walk your avatar to a desk in the office, then press <b>Open dashboard</b>.</p>
              <ul className="dim small desk-list">
                <li>💻 <b>Your desk</b>: laptop, company overview, goals</li>
                {g.founded && <li>🗂️ <b>Partner desk</b>: hiring, office, perks</li>}
                {g.founded && <li>⌨️ <b>Engineering</b> · ☁️ <b>DevOps</b> · 🎨 <b>Design</b> · 📣 <b>Marketing</b> · 🎧 <b>Support</b> as they unlock</li>}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <PersonCard />
      <TreeModal />
      <EventModal />
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
