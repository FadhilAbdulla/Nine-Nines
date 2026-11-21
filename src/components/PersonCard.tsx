"use client";
import { ROLES } from "@/game/data";
import { fire, giveRaise, oneOnOne, salaryFor, setRemote } from "@/game/engine";
import { money } from "@/game/util";
import { useUI } from "@/store/useUI";
import Avatar, { lookFor } from "./Avatar";
import { Bar, Stars, useAct, useG } from "./ui";

const moodFace = (m: number) => (m > 75 ? "😄" : m > 55 ? "🙂" : m > 35 ? "😐" : m > 20 ? "😟" : "😡");

export default function PersonCard() {
  const g = useG();
  const act = useAct();
  const { talk, setTalk } = useUI();
  const e = talk ? g.team.find((x) => x.id === talk) : undefined;
  if (!e) return null;
  const quote =
    e.morale < 28 ? `"Honestly? I'm thinking about quitting."` :
    e.morale < 45 ? `"It's been rough lately. I could use some support."` :
    g.cash < 0 ? `"Are we going to be okay? The bank balance looks scary."` :
    e.morale > 80 ? `"I love it here. We're onto something."` : `"Things are fine. Coffee would help."`;
  return (
    <div className="person-card" role="dialog" aria-label={`Talk to ${e.name}`}>
      <div className="pc-top">
        <Avatar look={lookFor(e.id + e.name, e.role)} role={e.role} size={52} />
        <div>
          <strong>{moodFace(e.morale)} {e.name}</strong>
          <div className="dim small">{ROLES[e.role].label} · {e.trait}{e.remote ? " · 🏠 Remote" : ""}</div>
        </div>
        <button className="x" onClick={() => setTalk(null)} aria-label="Close">✕</button>
      </div>
      <div className="chat-grid">
        <div><span className="label">Skill</span><Stars n={e.skill} /></div>
        <div><span className="label">Morale {Math.round(e.morale)}</span><Bar value={e.morale} /></div>
        <div><span className="label">Salary</span><span className="mono">{money(e.salary)}/mo</span> <span className="dim small">(market {money(salaryFor(e.role, e.skill))})</span></div>
      </div>
      <p className="quote">{quote}</p>
      <div className="row">
        <button className="btn" onClick={() => act((s) => oneOnOne(s, e.id))}>1:1 chat</button>
        <button className="btn" onClick={() => act((s) => giveRaise(s, e.id))}>Give 15% raise</button>
        <button className="btn" onClick={() => act((s) => setRemote(s, e.id, !e.remote))}>{e.remote ? "🏢 Bring to office" : "🏠 Make remote"}</button>
        <button className="btn danger" onClick={() => { if (window.confirm(`Let ${e.name} go? Severance is ${money(e.salary * 0.5)} and the team will be shaken.`)) { act((s) => fire(s, e.id)); setTalk(null); } }}>Let go</button>
      </div>
    </div>
  );
}
