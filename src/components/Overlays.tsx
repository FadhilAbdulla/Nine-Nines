"use client";
import { useEffect, useState } from "react";
import { getEvent } from "@/game/events";
import { money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import type { Look } from "@/game/types";
import { LookPicker } from "./Avatar";
import { useG } from "./ui";

export function StartScreen() {
  const newGame = useGame((s) => s.newGame);
  const [founder, setFounder] = useState("");
  const [look, setLook] = useState<Look>({ skin: 0, hair: 0, hairColor: 0, shirt: 0 });
  return (
    <main className="start">
      <div className="start-card">
        <p className="eyebrow">A browser story game</p>
        <h1>Nine Nines</h1>
        <p className="lead">
          You are a developer in a small bedroom with a laptop and an idea. Build the app. Someone will notice. A company will follow: engineers, DevOps, marketing, an office, and maybe one day an IPO.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            newGame(founder, look);
          }}
        >
          <label>
            <span className="label">Your name</span>
            <input value={founder} onChange={(e) => setFounder(e.target.value)} placeholder="Alex Rivera" maxLength={24} autoComplete="off" />
          </label>
          <span className="label">Your avatar</span>
          <LookPicker look={look} onChange={setLook} />
          <button className="btn primary big" type="submit">Sit down at the laptop</button>
        </form>
      </div>
    </main>
  );
}

export function EventModal() {
  const g = useG();
  const choose = useGame((s) => s.chooseEvent);
  const close = useGame((s) => s.closeEvent);
  const [text, setText] = useState("");
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
        {ev.input && !result && (
          <label className="inputrow">
            <span className="label">{ev.input.label}</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={ev.input.placeholder} maxLength={28} autoComplete="off" autoFocus />
          </label>
        )}
        {result ? (
          <>
            <p className="result" style={{ whiteSpace: "pre-line" }}>{result}</p>
            <button className="btn primary big" autoFocus onClick={close}>Continue</button>
          </>
        ) : (
          <div className="choices">
            {ev.choices.map((c, i) => {
              const why = c.disabled?.(g) ?? null;
              return (
                <button key={i} className="choice" disabled={!!why} onClick={() => choose(i, text)}>
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
            You started in a bedroom with $1,200 and finished on the trading floor. After {g.day} days, your company is worth <b>{money(val)}</b> with {num(totalUsers(g))} users and {g.team.length} people. Your stake: <b>{money(val * g.equity)}</b>.
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
