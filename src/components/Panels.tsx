"use client";
import { useState } from "react";
import { CAMPAIGNS, DECOR, FOCUS_INFO, IDEAS, OFFICES, ROLES, TOOLS } from "@/game/data";
import { buyDecor, buyTool, deriveStats, freeDesks, giveRaise, fire, hire, ideaUnlocked, oneOnOne, refreshCandidatesPaid, runCampaign, salaryFor, setFocus, signingFee, startProduct, upgradeOffice } from "@/game/engine";
import type { FounderFocus } from "@/game/types";
import { dailyRevenueAvg, money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import { Bar, Stars, useAct, useG } from "./ui";

/* ---------------- Products ---------------- */
export function ProductsPanel() {
  const g = useG();
  const act = useAct();
  const d = deriveStats(g);
  const building = g.products.some((p) => p.status === "building");
  return (
    <div className="stack">
      <p className="dim small">
        Your team's dev output: <b className="mono">{d.devPts.toFixed(1)}</b> pts/day · design <b className="mono">{d.designPts.toFixed(1)}</b>/day. Only your <b>focus</b> product gets work.
      </p>
      {g.products.map((p) => {
        const idea = IDEAS.find((i) => i.id === p.ideaId)!;
        const focus = g.focusId === p.id;
        return (
          <div key={p.id} className={`card ${focus ? "focus" : ""}`}>
            <div className="card-head">
              <strong>{p.name}</strong>
              <span className={`pill ${p.status === "live" ? "ok" : "info"}`}>{p.status === "live" ? `LIVE v${p.version}` : "In development"}</span>
            </div>
            {p.status === "building" ? (
              <>
                <div className="label">
                  Development {Math.round((p.progress / p.cost) * 100)}% · Design {Math.round(Math.min(1, p.designProgress / p.cost) * 100)}%
                </div>
                <Bar value={p.progress} max={p.cost} tone="accent" />
                <Bar value={p.designProgress} max={p.cost} tone="warn" />
                <p className="dim small">Design progress sets your launch quality. Ship without it and early reviews will be rough.</p>
              </>
            ) : (
              <div className="kv">
                <div><span className="label">Users</span><b className="mono">{num(p.users)}</b></div>
                <div><span className="label">Revenue / day</span><b className="mono">{money(p.users * idea.arpu * (0.6 + p.quality / 125) * (1 + d.fx.revenue))}</b></div>
                <div><span className="label">Quality {Math.round(p.quality)}</span><Bar value={p.quality} /></div>
                <div><span className="label">Bugs {Math.round(p.bugs)}</span><Bar value={100 - p.bugs} /></div>
              </div>
            )}
            <div className="row">
              <button className="btn" disabled={focus} onClick={() => act((s) => setFocus(s, p.id))}>
                {focus ? "★ Team focus" : "Set as focus"}
              </button>
              <span className="dim small">{idea.model} · ${idea.arpu.toFixed(2)}/user/day · market {num(idea.market)}</span>
            </div>
          </div>
        );
      })}
      <h3 className="sub">Ideas</h3>
      {IDEAS.filter((i) => !g.products.some((p) => p.ideaId === i.id)).map((i) => {
        const lock = ideaUnlocked(g, i.id);
        return (
          <div key={i.id} className={`card ${lock ? "locked" : ""}`}>
            <div className="card-head">
              <strong>{i.name}</strong>
              <span className="mono dim small">{num(i.cost)} dev pts</span>
            </div>
            <p className="small">{i.pitch}</p>
            <div className="row">
              <button className="btn primary" disabled={!!lock || building} onClick={() => act((s) => startProduct(s, i.id))}>
                {lock ? `🔒 ${lock}` : building ? "Finish current build first" : "Start building"}
              </button>
              <span className="dim small">{i.model} · ${i.arpu.toFixed(2)}/user/day</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Marketing ---------------- */
export function MarketPanel() {
  const g = useG();
  const act = useAct();
  const live = g.products.filter((p) => p.status === "live");
  const [pid, setPid] = useState<string>("");
  const target = live.find((p) => p.id === pid) ?? live[0];
  const d = deriveStats(g);
  if (!live.length) return <p className="dim">Launch a product to start marketing it. Finish development first.</p>;
  return (
    <div className="stack">
      <div className="row">
        <label className="label" htmlFor="tgt">Promote</label>
        <select id="tgt" value={target.id} onChange={(e) => setPid(e.target.value)}>
          {live.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({num(p.users)} users)</option>
          ))}
        </select>
      </div>
      <p className="dim small">
        Campaign power: <b className="mono">×{d.mktPower.toFixed(2)}</b> (marketers, analytics, your focus). Poor quality wastes ad money, so polish first.
      </p>
      {g.campaigns.length > 0 && (
        <div className="card">
          <div className="label">Running</div>
          {g.campaigns.map((c) => {
            const def = CAMPAIGNS.find((x) => x.id === c.defId)!;
            const p = g.products.find((x) => x.id === c.productId);
            return (
              <div key={c.id} className="line">
                <span>{def.emoji} {def.name} <span className="dim small">→ {p?.name}</span></span>
                <span className="mono dim">{c.daysLeft}d left</span>
              </div>
            );
          })}
        </div>
      )}
      {CAMPAIGNS.map((c) => {
        const lock = c.minRep && g.rep < c.minRep ? `Needs reputation ${c.minRep}` : c.minOffice && g.officeLevel < c.minOffice ? `Needs ${OFFICES[c.minOffice].name}` : null;
        const running = g.campaigns.some((x) => x.defId === c.id && x.productId === target.id);
        const est = Math.round(c.upd * d.mktPower * (0.5 + target.quality / 100) * c.days);
        return (
          <div key={c.id} className={`card ${lock ? "locked" : ""}`}>
            <div className="card-head">
              <strong>{c.emoji} {c.name}</strong>
              <span className="mono">{money(c.cost)}</span>
            </div>
            <p className="small">{c.desc}</p>
            <div className="row">
              <button className="btn primary" disabled={!!lock || running || g.cash < c.cost} onClick={() => act((s) => runCampaign(s, c.id, target.id))}>
                {lock ? `🔒 ${lock}` : running ? "Running" : "Launch"}
              </button>
              <span className="dim small">{c.days} days · ≈{num(est)} users · ~{money(c.cost / Math.max(1, est))}/user</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Team ---------------- */
export function TeamPanel() {
  const g = useG();
  const act = useAct();
  const setFocusMode = useGame((s) => s.setFocusMode);
  const d = deriveStats(g);
  const free = freeDesks(g);
  return (
    <div className="stack">
      <div className="card">
        <div className="label">You, the founder, are focusing on</div>
        <div className="seg">
          {(Object.keys(FOCUS_INFO) as FounderFocus[]).map((k) => (
            <button key={k} aria-pressed={g.founderFocus === k} onClick={() => setFocusMode(k)} title={FOCUS_INFO[k].desc}>
              {FOCUS_INFO[k].emoji} {FOCUS_INFO[k].label}
            </button>
          ))}
        </div>
        <p className="dim small">{FOCUS_INFO[g.founderFocus].desc}</p>
        <div className="label">
          Management load: {d.reports} reports / {d.mgmtCap} capacity {d.overload > 0 && <b className="badc">· overloaded, −{Math.round((1 - d.prodMult) * 100)}% output</b>}
        </div>
        <Bar value={d.mgmtCap - d.overload} max={Math.max(1, d.mgmtCap)} />
        <p className="dim small">Desks: {g.team.length + 1} / {OFFICES[g.officeLevel].desks} · Payroll {money(d.salaries)}/day</p>
      </div>

      <h3 className="sub">Your team ({g.team.length})</h3>
      {g.team.length === 0 && <p className="dim small">Nobody yet. It's just you.</p>}
      {g.team.map((e) => (
        <div key={e.id} className="card">
          <div className="card-head">
            <strong>{ROLES[e.role].emoji} {e.name}</strong>
            <span className="dim small">{ROLES[e.role].label}</span>
          </div>
          <div className="kv">
            <div><span className="label">Skill</span><Stars n={e.skill} /></div>
            <div><span className="label">Morale {Math.round(e.morale)}</span><Bar value={e.morale} /></div>
          </div>
          <div className="row wrap">
            <span className="dim small">{e.trait} · {money(e.salary)}/mo{e.salary < salaryFor(e.role, e.skill) * 0.9 ? " · underpaid" : ""}</span>
          </div>
          <div className="row">
            <button className="btn" onClick={() => act((s) => oneOnOne(s, e.id))}>1:1</button>
            <button className="btn" onClick={() => act((s) => giveRaise(s, e.id))}>Raise</button>
            <button className="btn danger" onClick={() => window.confirm(`Let ${e.name} go?`) && act((s) => fire(s, e.id))}>Let go</button>
          </div>
        </div>
      ))}

      <div className="panel-head">
        <h3 className="sub">Candidates</h3>
        <button className="btn" onClick={() => act((s) => refreshCandidatesPaid(s))} title="Hire a recruiter for fresh candidates">
          Recruiter {money(200 + g.officeLevel * 400)}
        </button>
      </div>
      {free <= 0 && <p className="badc small">No free desks. Upgrade your office to hire more.</p>}
      {g.candidates.map((c) => (
        <div key={c.id} className="card">
          <div className="card-head">
            <strong>{ROLES[c.role].emoji} {c.name}</strong>
            <span className="dim small">{ROLES[c.role].label}</span>
          </div>
          <div className="kv"><div><span className="label">Skill</span><Stars n={c.skill} /></div><div><span className="label">Salary</span><b className="mono">{money(c.salary)}/mo</b></div></div>
          <div className="row">
            <button className="btn primary" disabled={free <= 0 || g.cash < signingFee(c)} onClick={() => act((s) => hire(s, c.id))}>
              Hire · fee {money(signingFee(c))}
            </button>
            <span className="dim small">{c.trait}</span>
          </div>
        </div>
      ))}
      <p className="dim small">New candidates arrive every 10 days. {ROLES.manager.blurb}</p>
    </div>
  );
}

/* ---------------- Tools shop ---------------- */
export function ShopPanel() {
  const g = useG();
  const act = useAct();
  return (
    <div className="stack">
      <p className="dim small">Tools charge a one-time price plus a small monthly subscription.</p>
      {TOOLS.map((t) => {
        const owned = g.tools.includes(t.id);
        const lock = t.minOffice && g.officeLevel < t.minOffice ? `Needs ${OFFICES[t.minOffice].name}` : null;
        return (
          <div key={t.id} className={`card ${owned ? "owned" : lock ? "locked" : ""}`}>
            <div className="card-head">
              <strong>{t.emoji} {t.name}</strong>
              <span className="mono">{owned ? "Owned" : money(t.cost)}</span>
            </div>
            <p className="small">{t.desc}</p>
            <div className="row">
              <button className="btn primary" disabled={owned || !!lock || g.cash < t.cost} onClick={() => act((s) => buyTool(s, t.id))}>
                {owned ? "✓ Installed" : lock ? `🔒 ${lock}` : "Buy"}
              </button>
              {t.monthly && <span className="dim small">+{money(t.monthly)}/mo</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Office ---------------- */
export function OfficePanel() {
  const g = useG();
  const act = useAct();
  const cur = OFFICES[g.officeLevel];
  const next = OFFICES[g.officeLevel + 1];
  return (
    <div className="stack">
      <div className="card focus">
        <div className="card-head"><strong>{cur.emoji} {cur.name}</strong><span className="mono dim small">{cur.desks} desks · rent {money(cur.rent)}/day</span></div>
        <p className="small">{cur.blurb}</p>
      </div>
      {next ? (
        <div className="card">
          <div className="label">Next move</div>
          <div className="card-head"><strong>{next.emoji} {next.name}</strong><span className="mono">{money(next.cost)}</span></div>
          <p className="small">{next.blurb}</p>
          <div className="row">
            <button className="btn primary" disabled={g.cash < next.cost} onClick={() => act((s) => upgradeOffice(s))}>
              Move in
            </button>
            <span className="dim small">{next.desks} desks · rent {money(next.rent)}/day</span>
          </div>
        </div>
      ) : (
        <p className="dim">You already have the finest HQ in the industry.</p>
      )}
      <h3 className="sub">Furnish & perks</h3>
      {DECOR.map((d) => {
        const owned = g.decor.includes(d.id);
        const lock = g.officeLevel < d.minOffice ? `Needs ${OFFICES[d.minOffice].name}` : null;
        return (
          <div key={d.id} className={`card ${owned ? "owned" : lock ? "locked" : ""}`}>
            <div className="card-head"><strong>{d.emoji} {d.name}</strong><span className="mono">{owned ? "Owned" : money(d.cost)}</span></div>
            <p className="small">{d.desc}</p>
            <button className="btn primary" disabled={owned || !!lock || g.cash < d.cost} onClick={() => act((s) => buyDecor(s, d.id))}>
              {owned ? "✓ In the office" : lock ? `🔒 ${lock}` : "Buy"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Company ---------------- */
export function CompanyPanel() {
  const g = useG();
  const d = deriveStats(g);
  const val = valuation(g);
  const goals: [string, boolean][] = [
    ["Launch your first product", g.products.some((p) => p.status === "live")],
    ["Reach 1,000 users", g.peakUsers >= 1_000],
    ["Hire your first employee", g.team.length > 0 || g.flags["seen:first_hire"] === true],
    ["Move out of the garage", g.officeLevel >= 1],
    ["Raise a seed round", g.rounds.includes("seed")],
    ["Series A", g.rounds.includes("seriesA")],
    ["Series B", g.rounds.includes("seriesB")],
    ["Own the Glass HQ", g.officeLevel >= 4],
    ["Team of 40+", g.team.length >= 40],
    ["IPO: valuation $500M, reputation 40+", g.ended === "ipo"],
  ];
  return (
    <div className="stack">
      <div className="card">
        <div className="kv">
          <div><span className="label">Valuation</span><b className="mono">{money(val)}</b></div>
          <div><span className="label">Your stake</span><b className="mono">{(g.equity * 100).toFixed(0)}%</b></div>
          <div><span className="label">Revenue / day</span><b className="mono">{money(d.revenue)}</b></div>
          <div><span className="label">30-day avg</span><b className="mono">{money(dailyRevenueAvg(g))}</b></div>
          <div><span className="label">Burn / day</span><b className="mono">{money(d.burn)}</b></div>
          <div><span className="label">Support coverage</span><b className={`mono ${d.coverage < 0.8 ? "badc" : ""}`}>{Math.round(d.coverage * 100)}%</b></div>
          <div><span className="label">Servers / day</span><b className="mono">{money(d.servers)}</b></div>
          <div><span className="label">Users</span><b className="mono">{num(totalUsers(g))}</b></div>
        </div>
        <p className="dim small">Burn = salaries {money(d.salaries)} + rent {money(d.rent)} + tools {money(d.subs)} + servers {money(d.servers)} + living {money(d.living)} (per day).</p>
      </div>
      <h3 className="sub">Road to IPO</h3>
      <ul className="goals">
        {goals.map(([t, done]) => (
          <li key={t} className={done ? "done" : ""}>{done ? "✔" : "○"} {t}</li>
        ))}
      </ul>
      <button className="btn danger" onClick={() => window.confirm("Start over? Your current save will be erased.") && useGame.getState().reset()}>
        Abandon this company
      </button>
    </div>
  );
}
