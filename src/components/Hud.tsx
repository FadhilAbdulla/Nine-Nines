"use client";
import { useEffect, useRef, useState } from "react";
import { derive } from "@/game/engine";
import { dateLabel, money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import { useUI } from "@/store/useUI";
import { useG } from "./ui";

export default function Hud() {
  const g = useG();
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const setTree = useUI((u) => u.setTree);
  const openLaptop = useUI((u) => u.openLaptop);
  const [journal, setJournal] = useState(false);
  const d = derive(g);
  const net = d.revenue - d.burn;

  // flash the money when it changes a lot
  const prev = useRef(g.cash);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    const diff = g.cash - prev.current;
    prev.current = g.cash;
    if (Math.abs(diff) > 50) {
      setFlash(diff > 0 ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [g.cash]);

  return (
    <header className="hud">
      <div className="hud-left">
        <b className="hud-co">{g.company || "Untitled project"}</b>
        <span className="dim small">{dateLabel(g.day)}</span>
        <button className="btn sm laptop-btn" onClick={() => openLaptop()} title="Open your laptop (L)">💻 My laptop <kbd>L</kbd></button>
      </div>

      <div className={`hud-cash ${flash ?? ""} ${g.cash < 0 ? "neg" : ""}`} title="Company cash">
        <span className="label">{g.founded ? "Company cash" : "Your savings"}</span>
        <b className="mono">{money(g.cash)}</b>
        <span className="cash-flow mono small" title={`Per day: income ${money(d.revenue)}, expenses ${money(d.burn)}`}>
          <span className="cf-in">▲ +{money(d.revenue)}</span>
          <span className="cf-out">▼ −{money(d.burn)}</span>
          <span className={`cf-net ${net >= 0 ? "goodc" : "warnc"}`}>= {net >= 0 ? "+" : "−"}{money(Math.abs(net))}/day</span>
        </span>
      </div>

      <div className="hud-right">
        <div className="hud-chips">
          <span className="chip-s" title="Users"><i>👥</i><b className="mono">{num(totalUsers(g))}</b></span>
          <span className="chip-s" title="Reputation"><i>⭐</i><b className="mono">{Math.round(g.rep)}</b></span>
          {g.founded && <span className="chip-s" title="Valuation"><i>💎</i><b className="mono">{money(valuation(g))}</b></span>}
          {g.founded && <span className="chip-s" title="Team (incl. founders)"><i>🧑‍🤝‍🧑</i><b className="mono">{g.team.length + 2}</b></span>}
        </div>
        <button className="btn sm" onClick={() => setTree(true)}>🌳 Tree</button>
        <div className="journal-wrap">
          <button className="btn sm" onClick={() => setJournal((j) => !j)} aria-expanded={journal}>📓 Journal</button>
          {journal && (
            <div className="journal-pop">
              <ul className="log">
                {g.log.slice(0, 16).map((l, i) => (
                  <li key={`${l.day}-${i}-${l.text}`} className={l.tone}><span className="mono dim">D{l.day}</span> {l.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="speed" role="group" aria-label="Game speed">
          {[[0, "⏸"], [1, "1×"], [3, "3×"], [8, "8×"]].map(([v, l]) => (
            <button key={v} aria-pressed={speed === v} onClick={() => setSpeed(v as number)}>{l}</button>
          ))}
        </div>
      </div>
    </header>
  );
}
