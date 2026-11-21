"use client";
import { useState } from "react";
import { CAMPAIGNS, DECOR, FOCUS_INFO, IDEAS, OFFICES, PARTNER, ROLES, TOOLS, type ToolDef } from "@/game/data";
import { handsOnCooldown, sourceRole, remoteSalary, buyDecor, buyTool, deployCost, deployProduct, derive, designSprint, freeDesks, ideaUnlocked, refreshCandidatesPaid, runCampaign, setFocus, signingFee, startProduct, upgradeOffice, hire } from "@/game/engine";
import { STATION_INFO } from "@/game/layout";
import type { FounderFocus, Role, StationId } from "@/game/types";
import { dailyRevenueAvg, money, num, totalUsers, valuation } from "@/game/util";
import { useGame } from "@/store/useGame";
import { useUI } from "@/store/useUI";
import Avatar, { lookFor, PARTNER_LOOK } from "./Avatar";
import { Bar, Stars, useAct, useG } from "./ui";

/* ---------- shared bits ---------- */
function Staff({ role }: { role: Role }) {
  const g = useG();
  const setTalk = useUI((u) => u.setTalk);
  const staff = g.team.filter((e) => e.role === role);
  return (
    <div className="staffbar">
      {staff.length === 0 && <span className="dim small">No {ROLES[role].label.toLowerCase()}s yet. Do it yourself or hire below.</span>}
      {staff.map((e) => (
        <button key={e.id} className="chip-person" onClick={() => setTalk(e.id)} title="Open card">
          <Avatar look={lookFor(e.id + e.name, e.role)} role={e.role} size={28} />
          <span>{e.remote ? "🏠 " : ""}{e.name.split(" ")[0]} <span className="dim">· {e.skill}</span></span>
        </button>
      ))}
    </div>
  );
}

function HireInline({ role }: { role: Role }) {
  const g = useG();
  const act = useAct();
  const free = freeDesks(g);
  const cands = g.candidates.filter((c) => c.role === role);
  const cost = 150 + g.officeLevel * 300;
  return (
    <div className="hire-inline">
      <div className="partner-head">
        <Avatar look={PARTNER_LOOK} role="partner" size={38} />
        <p className="small">"{PARTNER.first} here. I handle HR: sourcing, interviews, onboarding and check-ins. Pick someone and I'll bring them on."</p>
      </div>
      {cands.length === 0 && <p className="dim small">No {ROLES[role].label.toLowerCase()} candidates right now.</p>}
      {cands.map((c) => (
        <div key={c.id} className="card">
          <div className="card-head">
            <span className="cand-name"><Avatar look={lookFor(c.id + c.name, c.role)} role={c.role} size={30} /><strong>{c.name}</strong></span>
            <span className="mono small">{money(c.salary)}/mo</span>
          </div>
          <div className="kv"><div><span className="label">Skill</span><Stars n={c.skill} /></div><div><span className="label">Trait</span><span className="small">{c.trait}</span></div></div>
          <div className="row">
            <button className="btn primary" disabled={free <= 0 || g.cash < signingFee(c)} onClick={() => act((s) => hire(s, c.id, false))}>🏢 In office</button>
            <button className="btn" disabled={g.cash < Math.round(remoteSalary(c.salary) * 0.3)} onClick={() => act((s) => hire(s, c.id, true))}>🏠 Remote · {money(remoteSalary(c.salary))}/mo</button>
          </div>
        </div>
      ))}
      <button className="btn" onClick={() => act((s) => sourceRole(s, role))}>Ask {PARTNER.first} to source more · {money(cost)}</button>
      {free <= 0 && <p className="badc small">No free desks: hire remotely or move to a bigger office.</p>}
    </div>
  );
}

function JobChoice({ role, mineTitle, mineDesc, mineLabel, onMine, mineDisabled }: { role: Role; mineTitle: string; mineDesc: string; mineLabel: string; onMine: () => void; mineDisabled?: string | null }) {
  const [hiring, setHiring] = useState(false);
  const g = useG();
  const n = g.team.filter((e) => e.role === role).length;
  return (
    <div className="stack">
      <div className="jobchoice">
        <div className="jc mine">
          <b>🧑 Do it myself</b>
          <p className="small">{mineDesc}</p>
          <button className="btn primary" disabled={!!mineDisabled} onClick={onMine}>{mineDisabled ?? mineLabel}</button>
          <span className="dim small">{mineTitle}</span>
        </div>
        <div className="jc hire">
          <b>🧑‍💼 Hire an employee</b>
          <p className="small">{n > 0 ? `${n} ${ROLES[role].label.toLowerCase()}${n > 1 ? "s" : ""} on the job already. They work automatically.` : `A ${ROLES[role].label.toLowerCase()} does this for you, every day.`}</p>
          <button className="btn" onClick={() => setHiring((h) => !h)}>{hiring ? "Hide candidates" : `Hire a ${ROLES[role].label}`}</button>
          <span className="dim small">{ROLES[role].blurb}</span>
        </div>
      </div>
      {hiring && <HireInline role={role} />}
    </div>
  );
}

function ToolList({ dept }: { dept: ToolDef["dept"] }) {
  const g = useG();
  const act = useAct();
  const list = TOOLS.filter((t) => t.dept === dept);
  if (!list.length) return null;
  return (
    <>
      <h3 className="sub">Tools</h3>
      {list.map((t) => {
        const owned = g.tools.includes(t.id);
        const lock = t.minOffice && g.officeLevel < t.minOffice ? `Needs ${OFFICES[t.minOffice].name}` : null;
        return (
          <div key={t.id} className={`card ${owned ? "owned" : lock ? "locked" : ""}`}>
            <div className="card-head"><strong>{t.emoji} {t.name}</strong><span className="mono">{owned ? "Owned" : money(t.cost)}</span></div>
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
    </>
  );
}

function Frame({ id, children }: { id: StationId; children: React.ReactNode }) {
  const g = useG();
  const close = useUI((u) => u.closeDash);
  const info = STATION_INFO[id];
  const label = id === "you" && !g.founded ? "Your laptop" : info.label;
  return (
    <div className="dash">
      <div className="dash-head">
        <h2>{info.emoji} {label} dashboard</h2>
        <button className="btn" onClick={close} aria-label="Close dashboard">✕</button>
      </div>
      <div className="dash-body">{children}</div>
    </div>
  );
}

/* ---------- Engineering / laptop ---------- */
function Products() {
  const g = useG();
  const act = useAct();
  const d = derive(g);
  const unfinished = g.products.some((p) => p.status !== "live");
  return (
    <div className="stack">
      <p className="dim small">
        Dev output <b className="mono">{d.devPts.toFixed(1)}</b> pts/day · design <b className="mono">{d.designPts.toFixed(1)}</b>/day. Only the <b>focus</b> product gets work.
      </p>
      {g.products.map((p) => {
        const idea = IDEAS.find((i) => i.id === p.ideaId)!;
        const focus = g.focusId === p.id;
        const capped = p.status === "building" && !d.hasEngineer && p.progress >= p.cost * 0.6 - 0.01;
        return (
          <div key={p.id} className={`card ${focus ? "focus" : ""}`}>
            <div className="card-head">
              <strong>{p.name}</strong>
              <span className={`pill ${p.status === "live" ? "ok" : "info"}`}>
                {p.status === "live" ? `LIVE v${p.version}` : p.status === "building" ? (g.founded ? "In development" : "Prototype") : p.status === "built" ? "Built · needs hosting" : "Deploying…"}
              </span>
            </div>
            {p.status === "building" && (
              <>
                <div className="label">Development {Math.round((p.progress / p.cost) * 100)}% · Design {Math.round(Math.min(1, p.designProgress / p.cost) * 100)}%</div>
                <Bar value={p.progress} max={p.cost} tone="accent" />
                <Bar value={p.designProgress} max={p.cost} tone="warn" />
                {capped ? (
                  <p className="badc small">{g.founded ? `Prototype limit reached. Hire an application engineer at ${PARTNER.first}'s desk to finish it.` : "You've taken it as far as you can alone."}</p>
                ) : (
                  <p className="dim small">Design progress sets launch quality. Alone, you can only get to 60%: a real engineer finishes it.</p>
                )}
              </>
            )}
            {p.status === "built" && <p className="small">The code is done. Go to the <b>DevOps desk</b> to host it. You'll need a DevOps engineer.</p>}
            {p.status === "deploying" && (<><p className="small">DevOps is deploying: {p.deployLeft} day(s) left.</p><Bar value={Math.max(0, 8 - p.deployLeft)} max={8} tone="accent" /></>)}
            {p.status === "live" && (
              <div className="kv">
                <div><span className="label">Users</span><b className="mono">{num(p.users)}</b></div>
                <div><span className="label">Revenue / day</span><b className="mono">{money(p.users * idea.arpu * (0.6 + p.quality / 125) * (1 + d.fx.revenue))}</b></div>
                <div><span className="label">Quality {Math.round(p.quality)}</span><Bar value={p.quality} /></div>
                <div><span className="label">Bugs {Math.round(p.bugs)}</span><Bar value={100 - p.bugs} /></div>
              </div>
            )}
            <div className="row">
              <button className="btn" disabled={focus} onClick={() => act((s) => setFocus(s, p.id))}>{focus ? "★ Team focus" : "Set as focus"}</button>
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
            <div className="card-head"><strong>{i.name}</strong><span className="mono dim small">{num(i.cost)} dev pts</span></div>
            <p className="small">{i.pitch}</p>
            <div className="row">
              <button className="btn primary" disabled={!!lock || unfinished} onClick={() => act((s) => startProduct(s, i.id))}>
                {lock ? `🔒 ${lock}` : unfinished ? "Finish current product first" : "Start building"}
              </button>
              <span className="dim small">{i.model} · ${i.arpu.toFixed(2)}/user/day</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AiCard({ can, cd }: { can: boolean; cd: number }) {
  const openHands = useUI((u) => u.openHands);
  return (
    <div className="card">
      <strong>🤖 Code with AI</strong>
      <p className="small">Solve a real task by writing the prompt yourself. A sharp prompt ships clean code fast. A vague one ships bugs, security holes and invented packages. AI only writes code: you still run marketing, deploys and support.</p>
      <button className="btn" disabled={!can || cd > 0} onClick={() => openHands({ kind: "aicode" })}>{cd > 0 ? `Resting ${cd}d` : "🤖 Write a prompt"}</button>
    </div>
  );
}

function EngDash() {
  const g = useG();
  const openHands = useUI((u) => u.openHands);
  const cd = handsOnCooldown(g, "code");
  const focus = g.products.find((p) => p.id === g.focusId);
  const can = focus && (focus.status === "building" || focus.status === "live");
  if (!g.founded) {
    return (
      <>
        <div className="card focus">
          <strong>🧑 Code it yourself</strong>
          <p className="small">It's just you. Write the code by hand: you handle the technical details and your score sets the progress. Passive coding also continues while you wait.</p>
          <button className="btn primary" disabled={!can || cd > 0} onClick={() => openHands({ kind: "code" })}>{cd > 0 ? `Resting ${cd}d` : "⌨️ Code a feature"}</button>
        </div>
        <AiCard can={!!can} cd={cd} />
        <Products />
      </>
    );
  }
  return (
    <>
      <Staff role="dev" />
      <JobChoice
        role="dev"
        mineTitle="Hands-on: you solve real coding questions. Clean code = more progress."
        mineDesc="Write the code yourself. You handle the technical details, and your score sets the progress."
        mineLabel="⌨️ Code a feature"
        mineDisabled={!can ? "Pick a product in development first" : cd > 0 ? `Resting ${cd}d` : null}
        onMine={() => openHands({ kind: "code" })}
      />
      <AiCard can={!!can} cd={cd} />
      <Products />
      <ToolList dept="eng" />
    </>
  );
}

/* ---------- DevOps ---------- */
function OpsDash() {
  const g = useG();
  const act = useAct();
  const openHands = useUI((u) => u.openHands);
  const [hireOps, setHireOps] = useState(false);
  const d = derive(g);
  const built = g.products.filter((p) => p.status === "built");
  const deploying = g.products.filter((p) => p.status === "deploying");
  const load = d.load;
  const uptime = Math.max(90, 100 - Math.max(0, load - 0.8) * 12);
  return (
    <div className="stack">
      <Staff role="devops" />
      <div className="card">
        <div className="kv">
          <div><span className="label">Server capacity</span><b className="mono">{num(d.capacity)} users</b></div>
          <div><span className="label">Current load</span><b className={`mono ${load > 1 ? "badc" : load > 0.8 ? "warnc" : ""}`}>{Math.round(load * 100)}%</b></div>
          <div><span className="label">Uptime</span><b className="mono">{uptime.toFixed(2)}%</b></div>
          <div><span className="label">Servers / day</span><b className="mono">{money(d.servers)}</b></div>
        </div>
        <Bar value={Math.min(1, load)} max={1} tone={load > 1 ? "bad" : load > 0.8 ? "warn" : "ok"} />
        {load > 1 && <p className="badc small">Over capacity! Pages are slow, growth is throttled, and users are leaving. Hire DevOps or buy infrastructure.</p>}
        <p className="dim small">Capacity grows with DevOps skill and infrastructure tools.</p>
      </div>
      {(built.length > 0 || deploying.length > 0) && <h3 className="sub">Deployments</h3>}
      {built.map((p) => (
        <div key={p.id} className="card focus">
          <div className="card-head"><strong>{p.name}</strong><span className="pill info">Ready to host</span></div>
          <p className="small">Choose how to take it live. Hosting setup costs {money(deployCost(p))}.</p>
          <div className="jobchoice">
            <div className="jc mine">
              <b>🧑 Do it myself</b>
              <p className="small">Run the deployment steps in the right order. Slower (8 days) and mistakes add bugs.</p>
              <button className="btn primary" disabled={g.cash < deployCost(p)} onClick={() => openHands({ kind: "deploy", productId: p.id })}>☁️ Deploy it</button>
            </div>
            <div className="jc hire">
              <b>🧑‍💼 DevOps team</b>
              <p className="small">{d.hasOps ? "Your DevOps engineer deploys it faster and cleaner." : "You need a DevOps engineer. Hire one below."}</p>
              <button className="btn" disabled={!d.hasOps || g.cash < deployCost(p)} onClick={() => act((s) => deployProduct(s, p.id))}>Have DevOps deploy</button>
            </div>
          </div>
        </div>
      ))}
      {deploying.map((p) => (
        <div key={p.id} className="card"><strong>{p.name}</strong><p className="small">Deploying… {p.deployLeft} day(s) left.</p></div>
      ))}
      {built.length + deploying.length === 0 && <p className="dim small">Nothing waiting to be hosted.</p>}
      <button className="btn" onClick={() => setHireOps((h) => !h)}>{hireOps ? "Hide candidates" : "🧑‍💼 Hire a DevOps Engineer"}</button>
      {hireOps && <HireInline role="devops" />}
      <ToolList dept="ops" />
    </div>
  );
}

/* ---------- Design ---------- */
function DesignDash() {
  const g = useG();
  const act = useAct();
  const openHands = useUI((u) => u.openHands);
  const d = derive(g);
  const cost = 400 + g.officeLevel * 600;
  return (
    <div className="stack">
      <Staff role="designer" />
      <JobChoice
        role="designer"
        mineTitle="Hands-on: make real usability decisions. Good calls = better quality."
        mineDesc="Design the UX yourself. Your decisions raise design progress or product quality."
        mineLabel="🎨 Design the UX"
        mineDisabled={!g.products.some((p) => p.id === g.focusId && p.status !== "built" && p.status !== "deploying") ? "Pick a product in development or live" : handsOnCooldown(g, "design") > 0 ? `Resting ${handsOnCooldown(g, "design")}d` : null}
        onMine={() => openHands({ kind: "design" })}
      />
      <div className="card">
        <div className="kv">
          <div><span className="label">Design output</span><b className="mono">{d.designPts.toFixed(1)}/day</b></div>
          <div><span className="label">Design tools</span><b className="mono">{g.tools.includes("design") ? "Installed" : "None"}</b></div>
        </div>
        <p className="dim small">Designers raise product quality, which drives growth, conversion and reputation.</p>
      </div>
      {g.products.filter((p) => p.status === "live").map((p) => (
        <div key={p.id} className="card"><div className="card-head"><strong>{p.name}</strong><span className="mono dim small">Quality {Math.round(p.quality)}</span></div><Bar value={p.quality} /></div>
      ))}
      <div className="card">
        <strong>🔬 User-research sprint</strong>
        <p className="small">Interview real users and fix what hurts. Improves quality on your focus product.</p>
        <button className="btn primary" disabled={g.cash < cost} onClick={() => act((s) => designSprint(s))}>Run sprint · {money(cost)}</button>
      </div>
      <ToolList dept="design" />
    </div>
  );
}

/* ---------- Marketing ---------- */
function MktDash() {
  const g = useG();
  const act = useAct();
  const openHands = useUI((u) => u.openHands);
  const [hireMkt, setHireMkt] = useState(false);
  const live = g.products.filter((p) => p.status === "live");
  const [pid, setPid] = useState("");
  const target = live.find((p) => p.id === pid) ?? live[0];
  const d = derive(g);
  return (
    <div className="stack">
      <Staff role="marketer" />
      {!target ? (
        <p className="dim">Launch a product first. There's nothing to market yet.</p>
      ) : (
        <>
          <div className="row">
            <label className="label" htmlFor="tgt">Promote</label>
            <select id="tgt" value={target.id} onChange={(e) => setPid(e.target.value)}>
              {live.map((p) => <option key={p.id} value={p.id}>{p.name} ({num(p.users)} users)</option>)}
            </select>
          </div>
          <p className="dim small">Campaign power <b className="mono">×{d.mktPower.toFixed(2)}</b>. Poor quality wastes ad money. If servers are overloaded, new users get throttled.</p>
          {g.campaigns.length > 0 && (
            <div className="card">
              <div className="label">Running</div>
              {g.campaigns.map((c) => {
                const def = CAMPAIGNS.find((x) => x.id === c.defId)!;
                return <div key={c.id} className="line"><span>{def.emoji} {def.name} <span className="dim small">→ {g.products.find((x) => x.id === c.productId)?.name}</span></span><span className="mono dim">{c.daysLeft}d</span></div>;
              })}
            </div>
          )}
          {CAMPAIGNS.map((c) => {
            const lock = c.minRep && g.rep < c.minRep ? `Needs reputation ${c.minRep}` : c.minOffice && g.officeLevel < c.minOffice ? `Needs ${OFFICES[c.minOffice].name}` : null;
            const running = g.campaigns.some((x) => x.defId === c.id && x.productId === target.id);
            const est = Math.round(c.upd * d.mktPower * (0.5 + target.quality / 100) * c.days);
            return (
              <div key={c.id} className={`card ${lock ? "locked" : ""}`}>
                <div className="card-head"><strong>{c.emoji} {c.name}</strong><span className="mono">{money(c.cost)}</span></div>
                <p className="small">{c.desc}</p>
                <div className="row">
                  <button className="btn primary" disabled={!!lock || running || g.cash < c.cost} onClick={() => openHands({ kind: "market", defId: c.id, productId: target.id })}>{lock ? `🔒 ${lock}` : running ? "Running" : "🧑 Plan it myself"}</button>
                  {!lock && !running && <button className="btn" disabled={g.cash < c.cost} onClick={() => act((s) => runCampaign(s, c.id, target.id))}>{g.team.some((e) => e.role === "marketer") ? "🧑‍💼 Delegate to marketing" : "⚡ Quick launch"}</button>}
                </div>
                <span className="dim small">{c.days} days · ≈{num(est)} users · ~{money(c.cost / Math.max(1, est))}/user</span>
              </div>
            );
          })}
        </>
      )}
      <button className="btn" onClick={() => setHireMkt((h) => !h)}>{hireMkt ? "Hide candidates" : "🧑‍💼 Hire a Marketer"}</button>
      {hireMkt && <HireInline role="marketer" />}
      <ToolList dept="mkt" />
    </div>
  );
}

/* ---------- Support ---------- */
function SupportDash() {
  const g = useG();
  const d = derive(g);
  const openHands = useUI((u) => u.openHands);
  const cd = handsOnCooldown(g, "support");
  return (
    <div className="stack">
      <Staff role="support" />
      <JobChoice
        role="support"
        mineTitle="Hands-on: reply to real customer tickets. Great replies boost capacity for 8 days."
        mineDesc="Answer tickets personally. Calm, specific replies keep customers and lift reputation."
        mineLabel="🎧 Answer tickets"
        mineDisabled={cd > 0 ? `Resting ${cd}d` : null}
        onMine={() => openHands({ kind: "support" })}
      />
      <div className="card">
        <div className="kv">
          <div><span className="label">Tickets / day</span><b className="mono">{num(d.tickets)}</b></div>
          <div><span className="label">Team capacity</span><b className="mono">{num(d.supportCap)}</b></div>
          <div><span className="label">Coverage</span><b className={`mono ${d.coverage < 0.8 ? "badc" : "goodc"}`}>{Math.round(d.coverage * 100)}%</b></div>
        </div>
        <Bar value={d.coverage} max={1} />
        <p className="dim small">Unanswered tickets drive churn and hurt reputation. You can also switch your own focus to Support from the Director dashboard.</p>
      </div>
      <ToolList dept="support" />
    </div>
  );
}

/* ---------- Partner: hiring, office, perks ---------- */
function PartnerDash() {
  const g = useG();
  const act = useAct();
  const [tab, setTab] = useState<"hire" | "office" | "tools">("hire");
  const free = freeDesks(g);
  const cur = OFFICES[g.officeLevel];
  const next = OFFICES[g.officeLevel + 1];
  const d = derive(g);
  return (
    <div className="stack">
      <div className="partner-head">
        <Avatar look={PARTNER_LOOK} role="partner" size={44} />
        <p className="small">"{tab === "hire" ? "I run HR: sourcing, interviews, onboarding and check-ins (+3 morale for everyone, and I step in when someone's below 40). Who do we bring on?" : tab === "office" ? "A bigger office means more desks, but rent adds up." : "The right tools make everyone faster."}" <span className="dim">· {PARTNER.first}</span></p>
      </div>
      <div className="seg3" role="tablist">
        {(["hire", "office", "tools"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === "hire" ? "👥 Hire" : t === "office" ? "🏢 Office" : "🧰 Tools"}</button>
        ))}
      </div>

      {tab === "hire" && (
        <>
          <p className="dim small">Free desks: <b>{free}</b> · Payroll {money(d.salaries)}/day · Management load {d.reports}/{d.mgmtCap}{d.overload > 0 && <b className="badc"> (overloaded)</b>}</p>
          <div className="panel-head">
            <h3 className="sub">Candidates</h3>
            <button className="btn" onClick={() => act((s) => refreshCandidatesPaid(s))}>Recruiter {money(200 + g.officeLevel * 400)}</button>
          </div>
          {free <= 0 && <p className="badc small">No free desks. Hire remotely, or move to a bigger office.</p>}
          <p className="dim small">🏠 <b>Remote</b>: no desk or rent, salary −15%, but output −12%, lower morale, and they need a bit more management. 🏢 <b>In office</b>: needs a free desk, benefits from perks.</p>
          {g.candidates.map((c) => (
            <div key={c.id} className="card">
              <div className="card-head">
                <span className="cand-name"><Avatar look={lookFor(c.id + c.name, c.role)} role={c.role} size={34} /><strong>{c.name}</strong></span>
                <span className="dim small">{ROLES[c.role].label}</span>
              </div>
              <div className="kv"><div><span className="label">Skill</span><Stars n={c.skill} /></div><div><span className="label">Salary</span><b className="mono">{money(c.salary)}/mo</b></div></div>
              <div className="row">
                <button className="btn primary" disabled={free <= 0 || g.cash < signingFee(c)} onClick={() => act((s) => hire(s, c.id, false))} title="Sits at a desk in your office">🏢 In office · {money(signingFee(c))} fee</button>
                <button className="btn" disabled={g.cash < Math.round(remoteSalary(c.salary) * 0.3)} onClick={() => act((s) => hire(s, c.id, true))} title="Works from home: no desk, 15% cheaper, a little less productive">🏠 Remote · {money(remoteSalary(c.salary))}/mo</button>
              </div>
              <span className="dim small">{c.trait}</span>
            </div>
          ))}
          <p className="dim small">New candidates arrive every 10 days. {ROLES.manager.blurb}</p>
        </>
      )}

      {tab === "office" && (
        <>
          <div className="card focus">
            <div className="card-head"><strong>{cur.emoji} {cur.name}</strong><span className="mono dim small">{cur.desks - 2} staff desks · rent {money(cur.rent)}/day</span></div>
            <p className="small">{cur.blurb}</p>
          </div>
          {next ? (
            <div className="card">
              <div className="label">Next move</div>
              <div className="card-head"><strong>{next.emoji} {next.name}</strong><span className="mono">{money(next.cost)}</span></div>
              <p className="small">{next.blurb}</p>
              <div className="row">
                <button className="btn primary" disabled={g.cash < next.cost} onClick={() => act((s) => upgradeOffice(s))}>Move in</button>
                <span className="dim small">{next.desks - 2} staff desks · rent {money(next.rent)}/day</span>
              </div>
            </div>
          ) : <p className="dim">You already have the finest HQ in the industry.</p>}
          <h3 className="sub">Furnish & perks</h3>
          {DECOR.map((x) => {
            const owned = g.decor.includes(x.id);
            const lock = g.officeLevel < x.minOffice ? `Needs ${OFFICES[x.minOffice].name}` : null;
            return (
              <div key={x.id} className={`card ${owned ? "owned" : lock ? "locked" : ""}`}>
                <div className="card-head"><strong>{x.emoji} {x.name}</strong><span className="mono">{owned ? "Owned" : money(x.cost)}</span></div>
                <p className="small">{x.desc}</p>
                <button className="btn primary" disabled={owned || !!lock || g.cash < x.cost} onClick={() => act((s) => buyDecor(s, x.id))}>{owned ? "✓ In the office" : lock ? `🔒 ${lock}` : "Buy"}</button>
              </div>
            );
          })}
        </>
      )}
      {tab === "tools" && <ToolList dept="partner" />}
    </div>
  );
}

/* ---------- Director ---------- */
function DirectorDash() {
  const g = useG();
  const d = derive(g);
  const setFocusMode = useGame((s) => s.setFocusMode);
  const setTree = useUI((u) => u.setTree);
  const [tab, setTab] = useState<"overview" | "laptop">("overview");
  const val = valuation(g);
  const goals: [string, boolean][] = [
    ["Build a prototype", g.products.length > 0],
    ["Found the company with your partner", g.founded],
    ["Hire an application engineer", g.team.some((e) => e.role === "dev")],
    ["Hire DevOps and host the app", g.team.some((e) => e.role === "devops") && g.products.some((p) => p.status === "live")],
    ["Reach 1,000 users", g.peakUsers >= 1_000],
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
      <div className="seg3" role="tablist">
        <button role="tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")}>📊 Overview</button>
        <button role="tab" aria-selected={tab === "laptop"} onClick={() => setTab("laptop")}>💻 My laptop</button>
      </div>
      {tab === "laptop" ? (
        <EngDash />
      ) : (
        <>
          <button className="btn primary" onClick={() => setTree(true)}>🌳 View company tree</button>
          <div className="card">
            <div className="kv">
              <div><span className="label">Valuation</span><b className="mono">{money(val)}</b></div>
              <div><span className="label">Your stake</span><b className="mono">{(g.equity * 100).toFixed(0)}%</b></div>
              <div><span className="label">Revenue / day</span><b className="mono">{money(d.revenue)}</b></div>
              <div><span className="label">30-day avg</span><b className="mono">{money(dailyRevenueAvg(g))}</b></div>
              <div><span className="label">Burn / day</span><b className="mono">{money(d.burn)}</b></div>
              <div><span className="label">Users</span><b className="mono">{num(totalUsers(g))}</b></div>
            </div>
            <p className="dim small">Burn = salaries {money(d.salaries)} + rent {money(d.rent)} + tools {money(d.subs)} + servers {money(d.servers)} + living {money(d.living)} (per day).</p>
          </div>
          <div className="card">
            <div className="label">You are focusing on</div>
            <div className="seg">
              {(Object.keys(FOCUS_INFO) as FounderFocus[]).map((k) => (
                <button key={k} aria-pressed={g.founderFocus === k} onClick={() => setFocusMode(k)} title={FOCUS_INFO[k].desc}>{FOCUS_INFO[k].emoji} {FOCUS_INFO[k].label}</button>
              ))}
            </div>
            <p className="dim small">{FOCUS_INFO[g.founderFocus].desc}</p>
            <div className="label">Management load: {d.reports} / {d.mgmtCap} {d.overload > 0 && <b className="badc">· overloaded, −{Math.round((1 - d.prodMult) * 100)}% output</b>}</div>
            <Bar value={d.mgmtCap - d.overload} max={Math.max(1, d.mgmtCap)} />
          </div>
          <h3 className="sub">Road to IPO</h3>
          <ul className="goals">{goals.map(([t, done]) => <li key={t} className={done ? "done" : ""}>{done ? "✔" : "○"} {t}</li>)}</ul>
          <button className="btn danger" onClick={() => window.confirm("Start over? Your current save will be erased.") && useGame.getState().reset()}>Abandon this company</button>
        </>
      )}
    </div>
  );
}

/* ---------- router ---------- */
export default function Dashboard({ id }: { id: StationId }) {
  const g = useG();
  return (
    <Frame id={id}>
      {id === "you" && (g.founded ? <DirectorDash /> : <EngDash />)}
      {id === "partner" && <PartnerDash />}
      {id === "eng" && <EngDash />}
      {id === "ops" && <OpsDash />}
      {id === "design" && <DesignDash />}
      {id === "mkt" && <MktDash />}
      {id === "support" && <SupportDash />}
    </Frame>
  );
}
