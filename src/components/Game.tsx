"use client";
import { useEffect, useState } from "react";
import { OFFICES } from "@/game/data";
import { deriveStats, freeDesks } from "@/game/engine";
import type { GameState } from "@/game/types";
import { CAMPAIGNS } from "@/game/data";
import { dateLabel, money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import { CompanyPanel, MarketPanel, OfficePanel, ProductsPanel, ShopPanel, TeamPanel } from "./Panels";
import { EndScreen, EventModal, StartScreen, Toast } from "./Overlays";
import Scene from "./Scene";
import { useG } from "./ui";

const TABS = [
  { id: "products", label: "Products", emoji: "🛠️" },
  { id: "market", label: "Market", emoji: "📣" },
  { id: "team", label: "Team", emoji: "👥" },
  { id: "tools", label: "Tools", emoji: "🧰" },
  { id: "office", label: "Office", emoji: "🏢" },
  { id: "company", label: "Company", emoji: "📊" },
] as const;
type Tab = (typeof TABS)[number]["id"];

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
  const [tab, setTab] = useState<Tab>("products");
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const d = deriveStats(g);
  const net = d.revenue - d.burn;
  const hint = nextHint(g);

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <h1>{g.company}</h1>
          <span className="dim small">{dateLabel(g.day)}</span>
        </div>
        <div className="speed" role="group" aria-label="Game speed">
          {[[0, "⏸"], [1, "1×"], [3, "3×"], [8, "8×"]].map(([v, l]) => (
            <button key={v} aria-pressed={speed === v} onClick={() => setSpeed(v as number)}>{l}</button>
          ))}
        </div>
      </header>

      <section className="stats" aria-label="Company stats">
        <Stat label="Cash" value={money(g.cash)} sub={`${net >= 0 ? "+" : ""}${money(net)}/day`} tone={g.cash < 0 ? "bad" : net < 0 ? "warn" : "good"} />
        <Stat label="Users" value={num(totalUsers(g))} sub={`${money(d.revenue)}/day revenue`} />
        <Stat label="Reputation" value={`${Math.round(g.rep)}`} sub="out of 100" />
        <Stat label="Team" value={`${g.team.length + 1}`} sub={`${freeDesks(g)} free desks`} />
        <Stat label="Valuation" value={money(valuation(g))} sub={`you own ${(g.equity * 100).toFixed(0)}%`} />
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
        <aside className="panel side" aria-label="Management">
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                <span aria-hidden className="te">{t.emoji}</span><span className="tl">{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="tab-body">
            {tab === "products" && <ProductsPanel />}
            {tab === "market" && <MarketPanel />}
            {tab === "team" && <TeamPanel />}
            {tab === "tools" && <ShopPanel />}
            {tab === "office" && <OfficePanel />}
            {tab === "company" && <CompanyPanel />}
          </div>
        </aside>
      </div>
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
  if (g.cash < 0) return "You're out of cash! Pause spending, run a cheap campaign, or take an investor offer before the company folds.";
  const building = g.products.find((p) => p.status === "building");
  const live = g.products.filter((p) => p.status === "live");
  if (!g.products.length) return "Open the Products tab and start building your first app.";
  if (building && !live.length) return `Building ${building.name}: ${Math.round((building.progress / building.cost) * 100)}% done. Watch the clock, or press 3 for 8× speed.`;
  if (live.length && !g.campaigns.length && g.cash >= CAMPAIGNS[0].cost) return "You're live! Open the Market tab and run a campaign to attract users.";
  if (!g.team.length && totalUsers(g) >= 600) return "You're stretched thin. Open the Team tab and make your first hire.";
  const d = deriveStats(g);
  if (d.overload > 0) return "Your team is overloaded. Hire a manager (each handles 6 people) or switch your focus to Manage.";
  if (d.coverage < 0.7) return "Support tickets are piling up and users are churning. Hire support staff or buy helpdesk software.";
  if (freeDesks(g) <= 0 && g.officeLevel < OFFICES.length - 1) return "You're out of desks. Open the Office tab to move somewhere bigger.";
  if (live.length && !building && g.products.length < 6) return "Ready for another product? Check the Ideas list under Products.";
  return null;
}
