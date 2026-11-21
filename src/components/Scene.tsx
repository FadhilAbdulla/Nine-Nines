"use client";
import { useEffect, useRef, useState } from "react";
import { DECOR, OFFICES, ROLES } from "@/game/data";
import { giveRaise, fire, oneOnOne, sceneAction, salaryFor } from "@/game/engine";
import type { Employee } from "@/game/types";
import { money } from "@/game/util";
import { Bar, Stars, useAct, useG } from "./ui";

const TILE = 52;
const deskPos = (i: number, cols: number): [number, number] => {
  const perRow = Math.max(2, Math.floor((cols - 2) / 2));
  return [1 + (i % perRow) * 2, 2 + Math.floor(i / perRow) * 3];
};

const moodFace = (m: number) => (m > 75 ? "😄" : m > 55 ? "🙂" : m > 35 ? "😐" : m > 20 ? "😟" : "😡");

export default function Scene() {
  const g = useG();
  const act = useAct();
  const office = OFFICES[g.officeLevel];
  const cols = office.cols;
  const desks = office.desks;
  const perRow = Math.max(2, Math.floor((cols - 2) / 2));
  const deskRows = Math.ceil(desks / perRow);
  const rows = 2 + deskRows * 3 + 1;

  const [me, setMe] = useState<[number, number]>([1, 3]);
  const [talk, setTalk] = useState<string | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMe([deskPos(0, cols)[0], deskPos(0, cols)[1] + 1]);
    setTalk(null);
  }, [g.officeLevel, cols]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const say = (t: string) => {
    setBubble(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBubble(null), 2600);
  };

  const walk = (x: number, y: number, then?: () => void) => {
    setMe([x, y]);
    setTalk(null);
    if (then) setTimeout(then, 520);
  };

  const run = (key: "coffee" | "whiteboard" | "door", x: number, y: number) => {
    walk(x, y, () => {
      act((s) => {
        const r = sceneAction(s, key);
        return r;
      });
    });
  };

  const emp = talk ? g.team.find((e) => e.id === talk) : undefined;
  const lightClass = `office lvl${g.officeLevel}`;

  return (
    <section className="panel scene-panel" aria-label="Office">
      <div className="panel-head">
        <h2>
          {office.emoji} {office.name}
        </h2>
        <span className="dim small">{office.blurb}</span>
      </div>
      <div className="scene-scroll">
        <div className={lightClass} style={{ width: cols * TILE, height: rows * TILE }}>
          {/* door */}
          <button className="prop door" style={{ left: (cols - 2) * TILE, top: 0, width: TILE * 1.6, height: TILE * 1.5 }} onClick={() => run("door", cols - 2, 2)} title="Go to a networking meetup ($100)">
            <span>🚪</span>
            <small>Go out</small>
          </button>
          <div className="sign" style={{ left: TILE, top: 8 }}>{g.company}</div>

          {/* desks */}
          {Array.from({ length: desks }).map((_, i) => {
            const [cx, cy] = deskPos(i, cols);
            const e: Employee | undefined = i === 0 ? undefined : g.team[i - 1];
            const isFounder = i === 0;
            return (
              <div key={i} className="deskwrap" style={{ left: cx * TILE, top: cy * TILE, width: TILE * 1.8, height: TILE * 2 }}>
                <div className={`desk ${isFounder ? "mine" : ""} ${!isFounder && !e ? "empty" : ""}`}>
                  <span className="mon">{isFounder || e ? "🖥️" : ""}</span>
                </div>
                {e && (
                  <button className={`person ${talk === e.id ? "sel" : ""} m${e.morale > 55 ? "g" : e.morale > 30 ? "w" : "b"}`} onClick={() => walk(cx, cy + 1, () => setTalk(e.id))} title={`${e.name}, ${ROLES[e.role].label}`}>
                    <span className="face">{ROLES[e.role].emoji}</span>
                    <span className="nm">{e.name.split(" ")[0]}</span>
                  </button>
                )}
                {!isFounder && !e && <span className="free">free desk</span>}
                {isFounder && <span className="free you">your desk</span>}
              </div>
            );
          })}

          {/* decor */}
          {DECOR.filter((d) => g.decor.includes(d.id)).map((d) => {
            const x = 0.4 + d.pos[0] * 1.9;
            const y = rows - 1.2;
            const key = d.id === "coffee" ? "coffee" : d.id === "whiteboard" ? "whiteboard" : null;
            const onCd = key ? (g.cooldowns[key] ?? 0) > g.day : false;
            const inner = (
              <>
                <span className="em">{d.emoji}</span>
              </>
            );
            return key ? (
              <button key={d.id} className={`prop decor ${onCd ? "cd" : ""}`} style={{ left: x * TILE, top: y * TILE }} onClick={() => run(key, Math.round(x), Math.round(y) - 1)} title={d.name + (key === "coffee" ? ": refuel the team" : ": brainstorm")}>
                {inner}
              </button>
            ) : (
              <span key={d.id} className="prop decor still" style={{ left: x * TILE, top: y * TILE }} title={d.name}>
                {inner}
              </span>
            );
          })}

          {/* founder */}
          <div className="founder" style={{ transform: `translate(${me[0] * TILE}px, ${me[1] * TILE}px)` }}>
            {bubble && <div className="bubble">{bubble}</div>}
            <span className="face">🧑‍💼</span>
            <span className="nm">{g.founder.split(" ")[0]}</span>
          </div>

          {/* clicking floor walks there */}
          <div
            className="floor-hit"
            onClick={(ev) => {
              const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
              walk(Math.floor((ev.clientX - r.left) / TILE), Math.floor((ev.clientY - r.top) / TILE));
              setBubble(null);
            }}
          />
        </div>
      </div>

      {emp && (
        <div className="chat" role="dialog" aria-label={`Talk to ${emp.name}`}>
          <div className="chat-top">
            <strong>
              {moodFace(emp.morale)} {emp.name}
            </strong>
            <span className="dim small">
              {ROLES[emp.role].label} · {emp.trait}
            </span>
            <button className="x" onClick={() => setTalk(null)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="chat-grid">
            <div>
              <div className="label">Skill</div>
              <Stars n={emp.skill} />
            </div>
            <div>
              <div className="label">Morale {Math.round(emp.morale)}</div>
              <Bar value={emp.morale} />
            </div>
            <div>
              <div className="label">Salary</div>
              <span className="mono">{money(emp.salary)}/mo</span> <span className="dim small">(market {money(salaryFor(emp.role, emp.skill))})</span>
            </div>
          </div>
          <p className="quote">{quoteFor(emp, g.cash)}</p>
          <div className="row">
            <button className="btn" onClick={() => act((s) => oneOnOne(s, emp.id))}>
              1:1 chat
            </button>
            <button className="btn" onClick={() => act((s) => giveRaise(s, emp.id))}>
              Give 15% raise
            </button>
            <button
              className="btn danger"
              onClick={() => {
                if (window.confirm(`Let ${emp.name} go? Severance is ${money(emp.salary * 0.5)} and the team will be shaken.`)) {
                  act((s) => fire(s, emp.id));
                  setTalk(null);
                }
              }}
            >
              Let go
            </button>
          </div>
        </div>
      )}
      <p className="dim small tip">Tip: click the floor to walk around, click teammates to talk, click ☕ 📝 🚪 to use them.</p>
    </section>
  );
}

function quoteFor(e: Employee, cash: number): string {
  if (e.morale < 28) return `"Honestly? I'm thinking about quitting."`;
  if (e.morale < 45) return `"It's been rough lately. I could use some support."`;
  if (cash < 0) return `"Are we going to be okay? The bank balance looks scary."`;
  if (e.morale > 80) return `"I love it here. ${e.role === "dev" ? "The code is almost clean!" : "We're onto something."}"`;
  return `"Things are fine. Coffee would help."`;
}
