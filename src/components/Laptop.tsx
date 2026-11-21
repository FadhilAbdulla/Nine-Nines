"use client";
import { useEffect, useState } from "react";
import { CAMPAIGNS, OFFICES, TOOLS } from "@/game/data";
import { buyTool, derive, freeDesks } from "@/game/engine";
import { money, num, totalUsers } from "@/game/util";
import { useUI, type LaptopTab } from "@/store/useUI";
import { useAct, useG } from "./ui";

/* ---------- tiny charts ---------- */
function Spark({ data, color = "#52d6a0", height = 64, label }: { data: number[]; color?: string; height?: number; label?: string }) {
  const pts = data.length > 1 ? data : [0, ...(data.length ? data : [0])];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const w = 300;
  const x = (i: number) => (i / (pts.length - 1)) * w;
  const y = (v: number) => height - 4 - ((v - min) / (max - min || 1)) * (height - 10);
  const line = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={`${line} L${w} ${height} L0 ${height} Z`} fill={color} opacity=".16" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="lp-tile">
      <span className="label">{label}</span>
      <b className={`mono ${tone === "bad" ? "badc" : tone === "warn" ? "warnc" : tone === "good" ? "goodc" : ""}`}>{value}</b>
      {sub && <span className="dim small">{sub}</span>}
    </div>
  );
}

function Meter({ pct, tone }: { pct: number; tone: "ok" | "warn" | "bad" }) {
  return <div className="lp-meter"><i className={`t-${tone}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>;
}

/* ---------- locked app ---------- */
function Locked({ toolId, why }: { toolId: string; why: string }) {
  const g = useG();
  const act = useAct();
  const t = TOOLS.find((x) => x.id === toolId)!;
  const blocked = t.minOffice && g.officeLevel < t.minOffice ? `Needs ${OFFICES[t.minOffice].name}` : g.cash < t.cost ? "Not enough cash" : null;
  return (
    <div className="lp-locked">
      <div className="lock-ico">🔒</div>
      <h3>{t.emoji} {t.name}</h3>
      <p>{why}</p>
      <p className="dim small">{t.desc}</p>
      <p className="mono">{money(t.cost)}{t.monthly ? ` + ${money(t.monthly)}/mo` : ""}</p>
      <button className="btn primary" disabled={!!blocked} onClick={() => act((s) => buyTool(s, toolId))}>{blocked ?? `Buy & connect (${money(t.cost)})`}</button>
    </div>
  );
}

/* ---------- To-do ---------- */
function TodoApp() {
  const g = useG();
  const act = useAct();
  const d = derive(g);
  const [text, setText] = useState("");
  const live = g.products.filter((p) => p.status === "live");
  const runway = d.burn > d.revenue ? g.cash / (d.burn - d.revenue) : Infinity;

  const alerts: string[] = [];
  if (g.cash < 0) alerts.push("You're out of cash. Cut costs, run a cheap campaign or take an investor offer.");
  else if (runway < 20) alerts.push(`Cash runs out in about ${Math.max(1, Math.floor(runway))} days at this burn.`);
  if (d.load > 1) alerts.push("Servers are overloaded. Buy hosting tools or hire DevOps.");
  if (d.overload > 0) alerts.push("Your team is overloaded. Hire a manager or switch your focus to Manage.");
  if (d.coverage < 0.7) alerts.push("Support tickets are piling up. Hire support or buy helpdesk software.");
  if (live.some((p) => p.bugs > 50)) alerts.push("A live product has many bugs. Put engineering on it.");
  if (g.founded && freeDesks(g) <= 0 && g.officeLevel < OFFICES.length - 1) alerts.push("No free desks. Ask Maya about a bigger office.");

  const goals: { text: string; done: boolean; hint?: string }[] = [
    { text: "Build your first prototype", done: g.products.some((p) => p.status !== "building"), hint: g.products[0] ? `${Math.round((g.products[0].progress / g.products[0].cost) * 100)}% built` : undefined },
    { text: "Found the company with Maya", done: g.founded },
    { text: "Take the app live", done: live.length > 0 || g.peakUsers > 0 },
    { text: "Reach 100 users", done: g.peakUsers >= 100, hint: `${num(totalUsers(g))} now` },
    { text: "Run a marketing campaign", done: g.campaigns.length > 0 || g.peakUsers >= 500 },
    { text: "Buy Analytics to see what works", done: g.tools.includes("analytics") },
    { text: "Connect Monitoring to see your servers", done: g.tools.includes("monitoring") },
    { text: "Set up a helpdesk for support", done: g.tools.includes("helpdesk") },
    { text: "Move into a bigger office", done: g.officeLevel > 0 },
  ];
  const todos = g.todos ?? [];
  const add = () => {
    const t = text.trim();
    if (!t) return;
    act((s) => { (s.todos ??= []).push({ id: `t${Date.now()}`, text: t, done: false }); });
    setText("");
  };

  return (
    <div className="lp-cols">
      <div>
        <h3>⚠ Needs attention</h3>
        {alerts.length === 0 ? <p className="dim">All clear. Nothing is on fire.</p> : <ul className="lp-alerts">{alerts.map((a) => <li key={a}>{a}</li>)}</ul>}
        <h3>🎯 Goals</h3>
        <ul className="lp-checks">
          {goals.map((q) => <li key={q.text} className={q.done ? "done" : ""}><i>{q.done ? "✔" : "○"}</i>{q.text}{!q.done && q.hint && <span className="dim small"> · {q.hint}</span>}</li>)}
        </ul>
      </div>
      <div>
        <h3>📝 My to-do list</h3>
        <form className="lp-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task… e.g. hire a designer" maxLength={80} />
          <button className="btn primary" disabled={!text.trim()}>Add</button>
        </form>
        {todos.length === 0 && <p className="dim small">Nothing here yet. Jot down what you plan to do next.</p>}
        <ul className="lp-checks mine">
          {todos.map((t) => (
            <li key={t.id} className={t.done ? "done" : ""}>
              <button className="chk" aria-label={t.done ? "Mark as not done" : "Mark as done"} onClick={() => act((s) => { const x = s.todos?.find((y) => y.id === t.id); if (x) x.done = !x.done; })}>{t.done ? "✔" : "○"}</button>
              <span>{t.text}</span>
              <button className="x" aria-label="Delete" onClick={() => act((s) => { s.todos = (s.todos ?? []).filter((y) => y.id !== t.id); })}>✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Finance ---------- */
function FinanceApp() {
  const g = useG();
  const d = derive(g);
  const net = d.revenue - d.burn;
  const lines: [string, number][] = [["Salaries", d.salaries], ["Rent", d.rent], ["Software", d.subs], ["Servers", d.servers], ["Living costs", d.living]];
  const total = Math.max(1, d.burn);
  return (
    <div className="lp-stack">
      <div className="lp-tiles">
        <Tile label="Cash" value={money(g.cash)} tone={g.cash < 0 ? "bad" : undefined} />
        <Tile label="Income / day" value={`+${money(d.revenue)}`} tone="good" />
        <Tile label="Expenses / day" value={`−${money(d.burn)}`} tone="bad" />
        <Tile label="Net / day" value={`${net >= 0 ? "+" : "−"}${money(Math.abs(net))}`} tone={net >= 0 ? "good" : "warn"} sub={net < 0 ? `Runway ≈ ${Math.max(0, Math.floor(g.cash / -net))} days` : "Growing"} />
      </div>
      <div className="lp-panel">
        <h3>Income, last 30 days</h3>
        <Spark data={g.revHistory} label="Revenue per day" />
      </div>
      <div className="lp-panel">
        <h3>Where the money goes (per day)</h3>
        {lines.filter(([, v]) => v > 0).map(([k, v]) => (
          <div key={k} className="lp-row"><span>{k}</span><Meter pct={(v / total) * 100} tone="warn" /><b className="mono">{money(v)}</b></div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Analytics ---------- */
function AnalyticsApp() {
  const g = useG();
  const d = derive(g);
  const hist = g.userHistory ?? [];
  const users = totalUsers(g);
  const week = hist.length > 7 ? users - hist[hist.length - 8] : 0;
  const arpu = users ? d.revenue / users : 0;
  const best = [...g.products].filter((p) => p.status === "live").sort((a, b) => b.users - a.users)[0];
  return (
    <div className="lp-stack">
      <div className="lp-tiles">
        <Tile label="Users" value={num(users)} sub={hist.length > 7 ? `${week >= 0 ? "+" : "−"}${num(Math.abs(week))} this week` : "collecting data…"} tone={week > 0 ? "good" : undefined} />
        <Tile label="Revenue / day" value={money(d.revenue)} />
        <Tile label="Per user / day" value={`$${arpu.toFixed(3)}`} />
        <Tile label="Reputation" value={`${Math.round(g.rep)}/100`} />
      </div>
      <div className="lp-panel">
        <h3>Users, last 30 days</h3>
        <Spark data={hist} color="#6ab7ff" label="Users over time" />
      </div>
      <div className="lp-panel">
        <h3>Products</h3>
        {g.products.length === 0 && <p className="dim">No products yet.</p>}
        <table className="lp-table">
          <thead><tr><th>Product</th><th>Status</th><th>Users</th><th>Quality</th><th>Bugs</th></tr></thead>
          <tbody>
            {g.products.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td>{p.status}</td><td className="mono">{num(p.users)}</td><td className="mono">{Math.round(p.quality)}</td><td className={`mono ${p.bugs > 50 ? "badc" : ""}`}>{Math.round(p.bugs)}</td></tr>
            ))}
          </tbody>
        </table>
        {best && <p className="dim small">💡 Best performer: <b>{best.name}</b> with {num(best.users)} users.</p>}
      </div>
      <div className="lp-panel">
        <h3>Campaigns</h3>
        {g.campaigns.length === 0 ? <p className="dim">No campaign running. Plan one at the Marketing desk.</p> : (
          <ul className="lp-checks">{g.campaigns.map((c) => <li key={c.id}><i>📣</i>{CAMPAIGNS.find((x) => x.id === c.defId)?.name ?? "Campaign"} <span className="dim small">· {c.daysLeft}d left</span></li>)}</ul>
        )}
      </div>
    </div>
  );
}

/* ---------- DevOps ---------- */
const OPS_TOOLS = ["monitoring", "cloud", "cdn", "k8s", "region", "security"];
function DevopsApp() {
  const g = useG();
  const d = derive(g);
  const loadPct = Math.round(d.load * 100);
  const tone = d.load > 1 ? "bad" : d.load > 0.7 ? "warn" : "ok";
  const devops = g.team.filter((e) => e.role === "devops").length;
  return (
    <div className="lp-stack">
      <div className="lp-tiles">
        <Tile label="Server load" value={`${loadPct}%`} tone={tone === "ok" ? "good" : tone} sub={d.load > 1 ? "Overloaded: pages are slow" : d.load > 0.7 ? "Getting busy" : "Healthy"} />
        <Tile label="Capacity" value={num(Math.round(d.capacity))} sub="users at once" />
        <Tile label="Server cost / day" value={money(d.servers)} />
        <Tile label="DevOps staff" value={String(devops)} sub={devops ? "on call" : "none: you handle it"} />
      </div>
      <div className="lp-panel">
        <h3>Load, last 30 days</h3>
        <Spark data={g.loadHistory ?? []} color={tone === "bad" ? "#ff7272" : tone === "warn" ? "#ffb454" : "#52d6a0"} label="Server load percent" />
        <Meter pct={loadPct} tone={tone} />
      </div>
      <div className="lp-panel">
        <h3>Deployments & health</h3>
        {g.products.length === 0 && <p className="dim">Nothing deployed yet.</p>}
        {g.products.map((p) => (
          <div key={p.id} className="lp-row"><span>{p.name} <span className="dim small">· {p.status}{p.status === "deploying" ? ` (${p.deployLeft}d)` : ""}</span></span><Meter pct={100 - p.bugs} tone={p.bugs > 50 ? "bad" : p.bugs > 25 ? "warn" : "ok"} /><b className="mono">{Math.round(p.bugs)} bugs</b></div>
        ))}
      </div>
      <div className="lp-panel">
        <h3>Infrastructure integrations</h3>
        <ul className="lp-checks">
          {OPS_TOOLS.map((id) => { const t = TOOLS.find((x) => x.id === id)!; const on = g.tools.includes(id); return <li key={id} className={on ? "done" : "off"}><i>{on ? "✔" : "○"}</i>{t.emoji} {t.name}</li>; })}
        </ul>
        <p className="dim small">Buy more at the DevOps desk to raise capacity and cut incidents.</p>
      </div>
    </div>
  );
}

/* ---------- Support ---------- */
function SupportApp() {
  const g = useG();
  const d = derive(g);
  const cov = Math.round(d.coverage * 100);
  const staff = g.team.filter((e) => e.role === "support").length;
  const tone = cov >= 90 ? "ok" : cov >= 70 ? "warn" : "bad";
  return (
    <div className="lp-stack">
      <div className="lp-tiles">
        <Tile label="Tickets / day" value={num(Math.round(d.tickets))} />
        <Tile label="Capacity / day" value={num(Math.round(d.supportCap))} />
        <Tile label="Answered" value={`${cov}%`} tone={tone === "ok" ? "good" : tone} />
        <Tile label="Support staff" value={String(staff)} />
      </div>
      <div className="lp-panel"><h3>Coverage</h3><Meter pct={cov} tone={tone} /><p className="dim small">{cov >= 90 ? "Customers are happy." : "Unanswered tickets hurt reputation and growth. Hire support or answer tickets yourself."}</p></div>
    </div>
  );
}

/* ---------- shell ---------- */
const TABS: { id: LaptopTab; icon: string; label: string; tool?: string; why?: string }[] = [
  { id: "todo", icon: "📋", label: "To-do" },
  { id: "finance", icon: "💰", label: "Finance" },
  { id: "analytics", icon: "📈", label: "Analytics", tool: "analytics", why: "Buy the Analytics dashboard to see users, revenue trends and which campaigns work." },
  { id: "devops", icon: "☁️", label: "DevOps", tool: "monitoring", why: "Connect Monitoring & observability to see live server load, capacity and deployment health on your laptop." },
  { id: "support", icon: "🎫", label: "Support", tool: "helpdesk", why: "Connect Helpdesk software to see ticket volume and how well you're keeping up." },
];

export default function Laptop() {
  const g = useG();
  const { laptop, laptopTab, setLaptopTab, closeLaptop, openLaptop } = useUI();

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "Escape" && laptop) closeLaptop();
      if ((e.key === "l" || e.key === "L") && !e.metaKey && !e.ctrlKey && !g.event) { laptop ? closeLaptop() : openLaptop(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [laptop, g.event, closeLaptop, openLaptop]);

  if (!laptop || g.event) return null;
  const tab = TABS.find((t) => t.id === laptopTab) ?? TABS[0];
  const unlocked = !tab.tool || g.tools.includes(tab.tool);
  return (
    <div className="laptop-back" onClick={closeLaptop}>
      <div className="laptop" role="dialog" aria-label="Your laptop" onClick={(e) => e.stopPropagation()}>
        <div className="lp-bar">
          <span className="dots"><i /><i /><i /></span>
          <b>💻 {g.company || "My"} laptop</b>
          <button className="btn sm" onClick={closeLaptop}>Close <kbd>Esc</kbd></button>
        </div>
        <div className="lp-body">
          <nav className="lp-dock" aria-label="Apps">
            {TABS.map((t) => {
              const lock = t.tool && !g.tools.includes(t.tool);
              return (
                <button key={t.id} aria-pressed={laptopTab === t.id} onClick={() => setLaptopTab(t.id)}>
                  <span className="ico">{t.icon}</span><span>{t.label}</span>{lock && <i className="lk">🔒</i>}
                </button>
              );
            })}
          </nav>
          <section className="lp-main">
            <h2>{tab.icon} {tab.label}</h2>
            {!unlocked ? <Locked toolId={tab.tool!} why={tab.why!} /> : tab.id === "todo" ? <TodoApp /> : tab.id === "finance" ? <FinanceApp /> : tab.id === "analytics" ? <AnalyticsApp /> : tab.id === "devops" ? <DevopsApp /> : <SupportApp />}
          </section>
        </div>
      </div>
    </div>
  );
}
