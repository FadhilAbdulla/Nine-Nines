"use client";
import { useEffect, useState } from "react";
import { getEvent } from "@/game/events";
import { money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import { useG } from "./ui";

export function StartScreen() {
  const newGame = useGame((s) => s.newGame);
  const [company, setCompany] = useState("");
  const [founder, setFounder] = useState("");
  return (
    <main className="start">
      <div className="start-card">
        <p className="eyebrow">A browser story game</p>
        <h1>Nine Nines</h1>
        <p className="lead">
          It's 1am in a rented garage. You have a laptop, $5,000, and an idea. Ship an app, find your users, hire a team, buy the tools, move into a real office, and one day ring the bell.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            newGame(company, founder);
          }}
        >
          <label>
            <span className="label">Your name</span>
            <input value={founder} onChange={(e) => setFounder(e.target.value)} placeholder="Alex Rivera" maxLength={24} autoComplete="off" />
          </label>
          <label>
            <span className="label">Company name</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Garage Labs" maxLength={28} autoComplete="off" />
          </label>
          <button className="btn primary big" type="submit">
            Start the company
          </button>
        </form>
        <ul className="loop">
          <li>🛠️ Build</li>
          <li>📣 Market</li>
          <li>👥 Hire</li>
          <li>🧰 Buy tools</li>
          <li>🏢 Move up</li>
          <li>🔔 IPO</li>
        </ul>
      </div>
    </main>
  );
}

export function EventModal() {
  const g = useG();
  const choose = useGame((s) => s.chooseEvent);
  const close = useGame((s) => s.closeEvent);
  if (!g.event) return null;
  const ev = getEvent(g.event.id);
  if (!ev) return null;
  const result = g.event.result;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={ev.title}>
      <div className={`modal ${ev.kind}`}>
        <div className="modal-emoji" aria-hidden>{ev.emoji}</div>
        <p className="eyebrow">{ev.kind === "story" ? "Story" : "Something happened"}</p>
        <h2>{ev.title}</h2>
        {ev.body(g).split("\n\n").map((p, i) => (
          <p key={i} className="body">{p}</p>
        ))}
        {result ? (
          <>
            <p className="result">{result}</p>
            <button className="btn primary big" autoFocus onClick={close}>Continue</button>
          </>
        ) : (
          <div className="choices">
            {ev.choices.map((c, i) => {
              const why = c.disabled?.(g) ?? null;
              return (
                <button key={i} className="choice" disabled={!!why} onClick={() => choose(i)}>
                  <b>{c.label}</b>
                  <span className="dim small">{why ?? c.hint ?? ""}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function EndScreen() {
  const g = useG();
  const reset = useGame((s) => s.reset);
  if (!g.ended) return null;
  const win = g.ended === "ipo";
  const val = valuation(g);
  return (
    <div className="overlay">
      <div className={`modal ${win ? "win" : "lose"}`}>
        <div className="modal-emoji" aria-hidden>{win ? "🔔" : "📦"}</div>
        <h2>{win ? `${g.company} is public!` : `${g.company} has closed`}</h2>
        {win ? (
          <p className="body">
            You started in a garage with $5,000 and finished on the trading floor. After {g.day} days, your company is worth <b>{money(val)}</b> with {num(totalUsers(g))} users and {g.team.length} people. Your stake: <b>{money(val * g.equity)}</b>.
          </p>
        ) : (
          <p className="body">The cash ran out on day {g.day}. Every founder fails differently. Hire slower, market smarter, watch the burn, and try again.</p>
        )}
        <button className="btn primary big" onClick={reset}>Start a new company</button>
      </div>
    </div>
  );
}

export function Toast() {
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 3200);
    return () => clearTimeout(t);
  }, [toast, dismiss]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" onClick={dismiss}>
      {toast}
    </div>
  );
}
