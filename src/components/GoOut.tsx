"use client";
import { useEffect } from "react";
import { enterNetworking, networkingBlocked } from "@/game/engine";
import { useUI } from "@/store/useUI";
import { useAct, useG } from "./ui";

/** 'Where to?' menu shown when you use the office door. */
export default function GoOut() {
  const g = useG();
  const act = useAct();
  const { goOut, setGoOut, setPlace } = useUI();

  useEffect(() => {
    if (!goOut) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setGoOut(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goOut, setGoOut]);

  if (!goOut || g.event) return null;
  const refreshed = (g.refreshUntil ?? 0) >= g.day;
  const opts = [
    { emoji: "🌳", title: "Walk to the park", sub: "Sit on a bench, grab a $5 coffee, clear your head. Get Refreshed.", run: () => setPlace("park") },
    { emoji: "🏠", title: "Go home", sub: "Take a nap in your own bed. Refreshed, and the team gets a small morale lift.", run: () => setPlace("home") },
    { emoji: "🤝", title: "Startup meetup ($100)", sub: "Walk in and mingle: pitch a journalist, chat with an investor, a recruiter and a mentor.", blocked: networkingBlocked(g), run: () => { act((s) => enterNetworking(s)); setPlace("event"); } },
  ];
  return (
    <div className="goout-back" onClick={() => setGoOut(false)}>
      <div className="goout" role="dialog" aria-label="Where to?" onClick={(e) => e.stopPropagation()}>
        <h3>Step outside</h3>
        <p className="dim small">Where to? {refreshed ? "You're already Refreshed, but fresh air never hurts." : "A break makes the whole company faster."}</p>
        <div className="goout-opts">
          {opts.map((o) => (
            <button key={o.title} className="goout-opt" disabled={!!o.blocked} onClick={o.run}>
              <span className="e">{o.emoji}</span>
              <span><b>{o.title}</b><small>{o.sub}</small>{o.blocked && <small className="why">⚠ {o.blocked}</small>}</span>
            </button>
          ))}
        </div>
        <button className="btn sm" onClick={() => setGoOut(false)}>Stay in the office <kbd>Esc</kbd></button>
      </div>
    </div>
  );
}
