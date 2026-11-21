import { CAMPAIGNS, DECOR, FIRST, IDEAS, LAST, OFFICES, PARTNER, ROLES, TOOLS, TRAITS } from "./data";
import { pickEvent } from "./events";
import type { Background, Candidate, Employee, GameState, Look, Role } from "./types";
import { clamp, log, pick, rnd, totalUsers, uid } from "./util";

// ---------- setup ----------

export function newGame(founder: string, look: Look): GameState {
  const background: Background = "engineer";
  const s: GameState = {
    started: true,
    founded: false,
    partnerVisit: false,
    look,
    company: "",
    founder: founder.trim() || "Founder",
    background,
    day: 1,
    cash: 1_200,
    rep: 4,
    founderFocus: "code",
    equity: 1,
    rounds: [],
    products: [],
    focusId: null,
    team: [],
    candidates: [],
    nextCandidateDay: 1,
    tools: [],
    officeLevel: 0,
    decor: [],
    campaigns: [],
    log: [],
    event: null,
    flags: {},
    cooldowns: {},
    revHistory: [],
    today: { revenue: 0, expenses: 0 },
    negativeDays: 0,
    ended: null,
    peakUsers: 0,
    seq: 0,
  };
  refreshCandidates(s);
  log(s, `${s.founder} is alone in a bedroom with a laptop and $${s.cash.toLocaleString("en-US")}.`, "story");
  s.event = { id: "intro" };
  return s;
}

// ---------- derived numbers ----------

type Fx = { dev: number; design: number; mkt: number; support: number; mgmt: number; morale: number; server: number; revenue: number; bugs: number; security: number; capacity: number };

export function deriveStats(s: GameState) { return derive(s); }

export function derive(s: GameState) {
  const fx: Fx = { dev: 0, design: 0, mkt: 0, support: 0, mgmt: 0, morale: 0, server: 0, revenue: 0, bugs: 0, security: 0, capacity: 0 };
  for (const id of s.tools) {
    const t = TOOLS.find((x) => x.id === id);
    if (t) for (const k of Object.keys(t.fx) as (keyof Fx)[]) fx[k] += t.fx[k] ?? 0;
  }
  for (const id of s.decor) {
    const d = DECOR.find((x) => x.id === id);
    if (d) for (const k of Object.keys(d.fx) as (keyof typeof d.fx)[]) fx[k] += d.fx[k] ?? 0;
  }
  if (s.flags.cultureShip) fx.dev += 0.1;
  if (s.flags.cultureCalm) fx.morale += 3;
  fx.server = Math.min(0.7, fx.server);
  fx.bugs = Math.min(0.7, fx.bugs);

  const mf = (e: Employee) => (0.5 + (e.morale / 100) * 0.7) * (e.remote ? 0.88 : 1);
  const by = (r: Role) => s.team.filter((e) => e.role === r);
  const managers = by("manager").length;
  const reports = Math.round(s.team.filter((e) => e.role !== "manager").reduce((a, e) => a + (e.remote ? 1.25 : 1), 0));
  const mgmtCap = 4 + (s.founderFocus === "manage" ? 3 : 0) + managers * (6 + fx.mgmt);
  const overload = Math.max(0, reports - mgmtCap);
  const prodMult = Math.max(0.5, 1 - overload * 0.07);

  const f = s.founderFocus;
  const aiOn = s.tools.includes("ai");
  const devPts =
    ((f === "code" ? 4 * (s.background === "engineer" ? 1.25 : 1) * (aiOn ? 1.3 : 1) : 0) + by("dev").reduce((a, e) => a + e.skill * 0.9 * mf(e) * (aiOn ? 1.08 : 1), 0)) * (1 + fx.dev) * prodMult;
  const designPts = ((f === "code" ? 1.2 : 0) + by("designer").reduce((a, e) => a + e.skill * 0.8 * mf(e), 0)) * (1 + fx.design) * prodMult;
  const mktPower =
    (1 + by("marketer").reduce((a, e) => a + e.skill * 0.07 * mf(e), 0)) * (1 + fx.mkt) * (f === "market" ? 1.35 : 1) * (s.background === "marketer" ? 1.2 : 1) * prodMult;
  const supportCap = (8 + (f === "support" ? 25 : 0) + by("support").reduce((a, e) => a + e.skill * 22 * mf(e), 0)) * (1 + fx.support) * (s.supportBoost && s.supportBoost.until >= s.day ? s.supportBoost.mult : 1);

  let tickets = 0;
  let revenue = 0;
  for (const p of s.products) {
    if (p.status !== "live") continue;
    const idea = IDEAS.find((i) => i.id === p.ideaId)!;
    tickets += p.users * (0.004 + p.bugs * 0.00005);
    revenue += p.users * idea.arpu * (0.6 + p.quality / 125) * (1 + fx.revenue);
  }
  const coverage = tickets <= 0 ? 1 : Math.min(1, supportCap / tickets);

  const users = totalUsers(s);
  const opsSum = by("devops").reduce((a, e) => a + e.skill * mf(e), 0);
  const capacity = (400 + opsSum * 600) * (1 + fx.capacity);
  const load = users / capacity;
  const salaries = s.team.reduce((a, e) => a + e.salary / 30, 0);
  const rent = OFFICES[s.officeLevel].rent;
  const aiSeats = aiOn ? 1 + by("dev").length : 0;
  const ai = (aiSeats * AI_SEAT_MONTHLY) / 30;
  const subs = s.tools.reduce((a, id) => a + (id === "ai" ? 0 : (TOOLS.find((t) => t.id === id)?.monthly ?? 0)) / 30, 0) + ai;
  const servers = users * 0.012 * (1 - fx.server);
  const living = 14;
  const burn = salaries + rent + subs + servers + living;

  return { aiOn, aiSeats, ai, capacity, load, hasEngineer: by("dev").length > 0, hasOps: by("devops").length > 0, fx, managers, reports, mgmtCap, overload, prodMult, devPts, designPts, mktPower, supportCap, tickets, coverage, revenue, salaries, rent, subs, servers, living, burn, users };
}

// ---------- the daily tick ----------

export function tick(s: GameState) {
  if (s.ended) return;
  s.day += 1;
  const d = derive(s);

  // money
  s.cash += d.revenue - d.burn;
  s.today = { revenue: d.revenue, expenses: d.burn };
  s.revHistory.push(d.revenue);
  if (s.revHistory.length > 30) s.revHistory.shift();
  for (const p of s.products) {
    if (p.status === "live") {
      const idea = IDEAS.find((i) => i.id === p.ideaId)!;
      p.revenueTotal += p.users * idea.arpu * (0.6 + p.quality / 125) * (1 + d.fx.revenue);
    }
  }

  // products
  for (const p of s.products) {
    const idea = IDEAS.find((i) => i.id === p.ideaId)!;
    const isFocus = p.id === s.focusId;
    if (p.status === "building") {
      if (isFocus) {
        const cap = d.hasEngineer ? p.cost : p.cost * 0.6;
        p.progress = Math.min(cap, p.progress + d.devPts);
        p.designProgress = Math.min(p.cost, p.designProgress + d.designPts);
        if (p.progress >= p.cost) {
          p.status = "built";
          log(s, `🛠️ ${p.name} is built. It still needs to be hosted.`, "story");
        }
      }
      continue;
    }
    if (p.status === "built") continue;
    if (p.status === "deploying") {
      p.deployLeft -= 1;
      if (p.deployLeft <= 0) launch(s, p);
      continue;
    }
    // live product
    if (isFocus) {
      p.updatePts += d.devPts;
      p.bugs -= d.devPts * 0.12;
      p.quality += (d.designPts * 0.08 + d.devPts * 0.02) * ((100 - p.quality) / 100);
      if (p.updatePts >= Math.max(90, p.cost * 1.2)) {
        p.updatePts = 0;
        p.version += 1;
        p.quality += 3 * ((100 - p.quality) / 100);
        log(s, `${p.name} v${p.version} shipped.`, "good");
        s.rep = clamp(s.rep + 0.15, 0, 100);
      }
    }
    p.bugs += (0.04 + p.users * 0.00002) * (1 - d.fx.bugs);
    p.bugs = clamp(p.bugs, 0, 100);
    p.quality = clamp(p.quality, 0, 100);

    const room = Math.max(0, 1 - p.users / idea.market);
    const thr = d.load > 1 ? 1 / (d.load * d.load) : 1;
    const discovery = (s.rep * 0.12 + p.quality * 0.08) * room * thr;
    const word = p.users * 0.004 * (p.quality / 60) * room * thr;
    let marketing = 0;
    for (const c of s.campaigns) {
      if (c.productId !== p.id) continue;
      const def = CAMPAIGNS.find((x) => x.id === c.defId)!;
      marketing += def.upd * d.mktPower * (c.boost ?? 1) * (0.5 + p.quality / 100) * room * thr;
    }
    const churnRate = 0.006 + p.bugs * 0.0004 + (1 - d.coverage) * 0.012 + Math.max(0, 50 - p.quality) * 0.0001 + (d.load > 1 ? Math.min(0.08, (d.load - 1) * 0.05) : 0);
    p.users = Math.max(0, p.users + discovery + word + marketing - p.users * churnRate);
  }

  // campaigns
  for (const c of s.campaigns) c.daysLeft -= 1;
  const ended = s.campaigns.filter((c) => c.daysLeft <= 0);
  for (const c of ended) log(s, `Campaign finished: ${CAMPAIGNS.find((x) => x.id === c.defId)?.name}.`, "info");
  s.campaigns = s.campaigns.filter((c) => c.daysLeft > 0);

  // people
  const baseMorale = 58 + (s.founded ? 3 : 0) + d.fx.morale - d.overload * 4 + (s.founderFocus === "manage" ? 5 : 0) + (s.cash < 0 ? -10 : 0);
  for (const e of [...s.team]) {
    const mkt = salaryFor(e.role, e.skill) * (e.remote ? 0.85 : 1);
    const payBonus = e.salary > mkt * 1.05 ? 6 : e.salary < mkt * 0.9 ? -8 : 0;
    const target = clamp(baseMorale + payBonus + (e.trait === "Night owl" ? -3 : 0) - (e.remote ? 4 + d.fx.morale * 0.5 : 0), 5, 100);
    e.morale = clamp(e.morale + (target - e.morale) * 0.04, 0, 100);
    if (s.founded && s.day % 10 === 0 && e.morale < 40) {
      e.morale = clamp(e.morale + 10, 0, 100);
      log(s, `${PARTNER.first} (HR) had a check-in with ${e.name}. They feel better.`, "info");
    }
    e.lowDays = e.morale < 28 ? e.lowDays + 1 : 0;
    if (e.lowDays >= 12) {
      s.team = s.team.filter((x) => x.id !== e.id);
      log(s, `${e.name} (${ROLES[e.role].label}) quit. Morale was through the floor.`, "bad");
      continue;
    }
    if (e.skill < 10 && e.morale > 55 && s.day - e.hiredDay > 90 && Math.random() < 1 / 260) {
      e.skill += 1;
      e.salary = Math.round(e.salary * 1.08);
      log(s, `${e.name} levelled up to skill ${e.skill}. Salary adjusted to $${e.salary.toLocaleString("en-US")}/mo.`, "good");
    }
  }

  // reputation
  const live = s.products.filter((p) => p.status === "live");
  if (live.length) {
    const avgQ = live.reduce((a, p) => a + p.quality, 0) / live.length;
    const avgB = live.reduce((a, p) => a + p.bugs, 0) / live.length;
    const target = clamp(avgQ * 0.7 + d.coverage * 20 - avgB * 0.4 + Math.min(10, d.users / 20_000) - (d.load > 1 ? Math.min(15, (d.load - 1) * 10) : 0), 0, 100);
    s.rep += (target - s.rep) * (target > s.rep ? 0.004 : 0.01);
  }
  s.rep = clamp(s.rep, 0, 100);
  s.peakUsers = Math.max(s.peakUsers, totalUsers(s));

  // candidates
  if (s.day >= s.nextCandidateDay) {
    refreshCandidates(s);
    s.nextCandidateDay = s.day + 10;
  }

  // survival
  s.negativeDays = s.cash < 0 ? s.negativeDays + 1 : 0;
  if (s.negativeDays === 1) log(s, "You are out of cash. Fix it fast or the company folds.", "bad");
  if (s.negativeDays >= 10) {
    s.ended = "bankrupt";
    log(s, `${s.company} ran out of money and shut down.`, "bad");
  }

  // story & random events
  if (!s.event && !s.ended) {
    const ev = pickEvent(s);
    if (ev) s.event = { id: ev };
  }
}

function launch(s: GameState, p: (typeof s.products)[number]) {
  const d = derive(s);
  p.status = "live";
  p.quality = clamp(22 + 55 * Math.min(1, p.designProgress / p.cost), 0, 85);
  p.bugs = Math.min(100, 30 * (1 - d.fx.bugs) + (p.launchBugs ?? 0));
  p.users = 8 + s.rep * 2;
  p.launchedDay = s.day;
  p.updatePts = 0;
  log(s, `🚀 ${p.name} is LIVE! Launch quality ${Math.round(p.quality)}/100.`, "story");
}

// ---------- hiring ----------

export function salaryFor(role: Role, skill: number): number {
  const base = 900 + skill * 400;
  return Math.round((role === "manager" ? base * 1.3 : role === "support" ? base * 0.85 : base) / 10) * 10;
}

function makeCandidate(s: GameState, role?: Role): Candidate {
  const r = role ?? pick<Role>(["dev", "devops", "designer", "marketer", "support", "manager"]);
  const cap = 3 + Math.round(s.officeLevel * 1.6) + Math.floor(Math.random() * 3);
  const skill = clamp(Math.round(rnd(1, cap)), 1, 10);
  return { id: uid(s, "c"), name: `${pick(FIRST)} ${pick(LAST)}`, role: r, skill, salary: salaryFor(r, skill), trait: pick(TRAITS[r]) };
}

export function refreshCandidates(s: GameState) {
  s.candidates = [makeCandidate(s, "dev"), makeCandidate(s, "devops"), makeCandidate(s), makeCandidate(s), makeCandidate(s)];
}

export const deskCount = (s: GameState) => OFFICES[s.officeLevel].desks;
export const freeDesks = (s: GameState) => deskCount(s) - (s.founded ? 2 : 1) - s.team.filter((e) => !e.remote).length;
export const signingFee = (c: Candidate) => Math.round(c.salary * 0.3);
export const remoteSalary = (n: number) => Math.round((n * 0.85) / 10) * 10;

export function setRemote(s: GameState, id: string, remote: boolean): string | null {
  const e = s.team.find((x) => x.id === id);
  if (!e) return null;
  if (!remote && freeDesks(s) <= 0) return "No free desk for them. Upgrade the office first.";
  e.remote = remote;
  e.morale = clamp(e.morale + (remote ? -3 : 4), 0, 100);
  log(s, remote ? `${e.name} now works remotely.` : `${e.name} is back in the office.`, "info");
  return null;
}

export function hire(s: GameState, id: string, remote = false): string | null {
  const c = s.candidates.find((x) => x.id === id);
  if (!c) return "Candidate is gone.";
  if (!s.founded) return "Found the company first.";
  if (!remote && freeDesks(s) <= 0) return "No free desks. Upgrade your office or hire remotely.";
  const fee = signingFee(c);
  if (s.cash < fee) return "Not enough cash for the signing fee.";
  s.cash -= fee;
  s.team.push({ id: uid(s, "e"), name: c.name, role: c.role, skill: c.skill, morale: remote ? 70 : 75, salary: remote ? remoteSalary(c.salary) : c.salary, hiredDay: s.day, trait: c.trait, lowDays: 0, remote });
  s.candidates = s.candidates.filter((x) => x.id !== id);
  log(s, `${c.name} joined${remote ? " remotely" : ""} as ${ROLES[c.role].label} (skill ${c.skill}).`, "good");
  return null;
}

export function fire(s: GameState, id: string) {
  const e = s.team.find((x) => x.id === id);
  if (!e) return;
  s.team = s.team.filter((x) => x.id !== id);
  const sev = Math.round(e.salary * 0.5);
  s.cash -= sev;
  for (const o of s.team) o.morale = clamp(o.morale - 6, 0, 100);
  log(s, `You let ${e.name} go (severance $${sev.toLocaleString("en-US")}). The team is shaken.`, "bad");
}

export function oneOnOne(s: GameState, id: string): string | null {
  const e = s.team.find((x) => x.id === id);
  if (!e) return null;
  const key = `1on1:${id}`;
  if ((s.cooldowns[key] ?? 0) > s.day) return "You talked recently. Give it a few days.";
  s.cooldowns[key] = s.day + 4;
  e.morale = clamp(e.morale + 14, 0, 100);
  e.lowDays = 0;
  log(s, `1:1 with ${e.name}. They feel heard.`, "good");
  return null;
}

export function giveRaise(s: GameState, id: string): string | null {
  const e = s.team.find((x) => x.id === id);
  if (!e) return null;
  if (e.salary >= salaryFor(e.role, e.skill) * 1.3) return "Already paid well above market.";
  e.salary = Math.round(e.salary * 1.15);
  e.morale = clamp(e.morale + 15, 0, 100);
  log(s, `${e.name} got a raise to $${e.salary.toLocaleString("en-US")}/mo.`, "good");
  return null;
}

// ---------- purchases & actions ----------

export const AI_SEAT_MONTHLY = 20;

export function cancelTool(s: GameState, id: string): string | null {
  if (!s.tools.includes(id)) return null;
  s.tools = s.tools.filter((x) => x !== id);
  log(s, `Cancelled ${TOOLS.find((t) => t.id === id)?.name ?? id}.`, "info");
  return null;
}

export function deployCost(p: { cost: number }) {
  return 150 + Math.round(p.cost * 0.5);
}

export function deployProduct(s: GameState, id: string): string | null {
  const p = s.products.find((x) => x.id === id);
  if (!p || p.status !== "built") return "Nothing to deploy.";
  const ops = s.team.filter((e) => e.role === "devops");
  if (!ops.length) return "You need a DevOps engineer to host it. Hire one at your partner's desk.";
  const cost = deployCost(p);
  if (s.cash < cost) return "Not enough cash for hosting setup.";
  s.cash -= cost;
  const best = Math.max(...ops.map((e) => e.skill));
  p.status = "deploying";
  p.deployLeft = Math.max(2, 8 - best);
  log(s, `DevOps started deploying ${p.name} (${p.deployLeft} days).`, "info");
  return null;
}

export function deployMyself(s: GameState, id: string, mistakes: number): string | null {
  const p = s.products.find((x) => x.id === id);
  if (!p || p.status !== "built") return "Nothing to deploy.";
  const cost = deployCost(p);
  if (s.cash < cost) return "Not enough cash for hosting setup.";
  s.cash -= cost;
  p.status = "deploying";
  p.deployLeft = 8;
  p.launchBugs = Math.min(30, mistakes * 7);
  log(s, `You deployed ${p.name} yourself${mistakes ? ` (${mistakes} mistake${mistakes > 1 ? "s" : ""}, extra launch bugs)` : " flawlessly"}.`, mistakes ? "info" : "good");
  return null;
}

const onCooldown = (s: GameState, k: string) => (s.cooldowns[k] ?? 0) > s.day;

export function handsOnCooldown(s: GameState, kind: string): number {
  return Math.max(0, (s.cooldowns[`hands:${kind}`] ?? 0) - s.day);
}

export function codeHandsOn(s: GameState, score: number): string | null {
  const p = s.products.find((x) => x.id === s.focusId);
  if (!p) return "Pick a product to focus on first.";
  const d = derive(s);
  const pts = (6 + 14 * score) * (1 + d.fx.dev) * (d.aiOn ? 1.25 : 1);
  s.cooldowns["hands:code"] = s.day + 2;
  if (p.status === "building") {
    p.progress = Math.min(p.cost, p.progress + pts);
    p.designProgress = Math.min(p.cost, p.designProgress + pts * 0.1);
    if (p.progress >= p.cost) {
      p.status = "built";
      log(s, `🛠️ ${p.name} is built. It still needs to be hosted.`, "story");
    }
  } else if (p.status === "live") {
    p.updatePts += pts;
    p.bugs = clamp(p.bugs - pts * 0.2, 0, 100);
  } else return "That product is already built.";
  log(s, `You coded${d.aiOn ? " with your AI assistant" : " by hand"} (${Math.round(score * 100)}% clean): +${pts.toFixed(0)} dev points on ${p.name}.`, score >= 0.67 ? "good" : "info");
  return null;
}

export function designHandsOn(s: GameState, score: number): string | null {
  const p = s.products.find((x) => x.id === s.focusId);
  if (!p) return "Pick a product to focus on first.";
  const d = derive(s);
  s.cooldowns["hands:design"] = s.day + 3;
  if (p.status === "building") p.designProgress = Math.min(p.cost, p.designProgress + (6 + 14 * score) * (1 + d.fx.design));
  else if (p.status === "live") p.quality = clamp(p.quality + (1 + 5 * score) * (1 + d.fx.design), 0, 100);
  else return "Design needs a product in development or live.";
  log(s, `You designed the UX yourself (${Math.round(score * 100)}% good decisions) for ${p.name}.`, score >= 0.67 ? "good" : "info");
  return null;
}

export function supportHandsOn(s: GameState, score: number): string | null {
  s.cooldowns["hands:support"] = s.day + 4;
  s.supportBoost = { until: s.day + 8, mult: 1.4 + score * 1.2 };
  s.rep = clamp(s.rep + score * 1.5, 0, 100);
  log(s, `You answered tickets personally (${Math.round(score * 100)}% great replies). Support is stronger for 8 days.`, score >= 0.67 ? "good" : "info");
  return null;
}

export function marketHandsOn(s: GameState, defId: string, productId: string, score: number): string | null {
  const err = runCampaign(s, defId, productId);
  if (err) return err;
  const c = s.campaigns[s.campaigns.length - 1];
  c.boost = 0.75 + score * 0.6;
  log(s, `You planned the campaign yourself: ×${c.boost.toFixed(2)} effectiveness.`, score >= 0.67 ? "good" : "info");
  return null;
}

export function sourceRole(s: GameState, role: Role): string | null {
  const cost = 150 + s.officeLevel * 300;
  if (s.cash < cost) return "Not enough cash for sourcing.";
  s.cash -= cost;
  for (let i = 0; i < 3; i++) s.candidates.push(makeCandidate(s, role));
  log(s, `${PARTNER.first} sourced ${ROLES[role].label} candidates.`, "info");
  return null;
}

export function designSprint(s: GameState): string | null {
  const p = s.products.find((x) => x.id === s.focusId && x.status === "live");
  if (!p) return "Your focus product must be live.";
  if ((s.cooldowns.sprint ?? 0) > s.day) return "The team needs a break from research. Try again later.";
  const cost = 400 + s.officeLevel * 600;
  if (s.cash < cost) return "Not enough cash for user research.";
  s.cash -= cost;
  s.cooldowns.sprint = s.day + 14;
  p.quality = clamp(p.quality + 4 + derive(s).designPts * 0.2, 0, 100);
  log(s, `Design sprint finished. ${p.name} feels noticeably better.`, "good");
  return null;
}

export function foundCompany(s: GameState, name: string) {
  s.company = name.trim() || "Garage Labs";
  s.founded = true;
  s.cash += 20_000;
  s.equity = 0.75;
  log(s, `🏁 ${s.company} is founded. Your partner invested $20,000 for 25%.`, "story");
}

export function startProduct(s: GameState, ideaId: string): string | null {
  const idea = IDEAS.find((i) => i.id === ideaId);
  if (!idea) return "Unknown idea.";
  if (s.products.some((p) => p.status !== "live")) return "Finish the product you're working on first.";
  if (s.products.some((p) => p.ideaId === ideaId)) return "You already built that one.";
  s.products.push({ id: uid(s, "p"), ideaId, name: idea.name, status: "building", deployLeft: 0, progress: 0, designProgress: 0, cost: idea.cost, quality: 0, users: 0, bugs: 0, version: 1, updatePts: 0, revenueTotal: 0 });
  s.focusId = s.products[s.products.length - 1].id;
  log(s, `Started building ${idea.name}.`, "info");
  return null;
}

export function ideaUnlocked(s: GameState, ideaId: string): string | null {
  const idea = IDEAS.find((i) => i.id === ideaId)!;
  const u = idea.unlock;
  if (ideaId !== "todo" && !s.founded) return "Found the company first";
  const users = totalUsers(s);
  if (u.users && s.peakUsers < u.users && users < u.users) return `Reach ${u.users.toLocaleString("en-US")} users`;
  if (u.team && s.team.length < u.team) return `Hire ${u.team} people`;
  if (u.officeLevel && s.officeLevel < u.officeLevel) return `Move to ${OFFICES[u.officeLevel].name}`;
  if (u.rep && s.rep < u.rep) return `Reach reputation ${u.rep}`;
  return null;
}

export function runCampaign(s: GameState, defId: string, productId: string): string | null {
  const def = CAMPAIGNS.find((c) => c.id === defId);
  const p = s.products.find((x) => x.id === productId);
  if (!def || !p || p.status !== "live") return "Launch a product first.";
  if (def.minRep && s.rep < def.minRep) return `Needs reputation ${def.minRep}.`;
  if (def.minOffice && s.officeLevel < def.minOffice) return `Needs ${OFFICES[def.minOffice].name} or bigger.`;
  if (s.campaigns.some((c) => c.defId === defId && c.productId === productId)) return "That campaign is already running.";
  if (s.cash < def.cost) return "Not enough cash.";
  s.cash -= def.cost;
  s.campaigns.push({ id: uid(s, "m"), defId, productId, daysLeft: def.days });
  log(s, `Started "${def.name}" for ${p.name}.`, "info");
  return null;
}

export function buyTool(s: GameState, id: string): string | null {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) return "Unknown tool.";
  if (s.tools.includes(id)) return "You already own it.";
  if (t.minOffice && s.officeLevel < t.minOffice) return `Needs ${OFFICES[t.minOffice].name}.`;
  if (s.cash < t.cost) return "Not enough cash.";
  s.cash -= t.cost;
  s.tools.push(id);
  log(s, `Bought ${t.name}.`, "good");
  return null;
}

export function buyDecor(s: GameState, id: string): string | null {
  const t = DECOR.find((x) => x.id === id);
  if (!t) return "Unknown item.";
  if (s.decor.includes(id)) return "You already own it.";
  if (s.officeLevel < t.minOffice) return `Needs ${OFFICES[t.minOffice].name}.`;
  if (s.cash < t.cost) return "Not enough cash.";
  s.cash -= t.cost;
  s.decor.push(id);
  log(s, `Added ${t.name} to the office.`, "good");
  return null;
}

export function upgradeOffice(s: GameState): string | null {
  const next = OFFICES[s.officeLevel + 1];
  if (!next) return "You already own the best office there is.";
  if (s.cash < next.cost) return "Not enough cash for the move.";
  s.cash -= next.cost;
  s.officeLevel += 1;
  log(s, `🏢 Moved into: ${next.name}.`, "story");
  return null;
}

export function refreshCandidatesPaid(s: GameState): string | null {
  const cost = 200 + s.officeLevel * 400;
  if (s.cash < cost) return "Not enough cash for a recruiter.";
  s.cash -= cost;
  refreshCandidates(s);
  s.nextCandidateDay = s.day + 10;
  log(s, "A recruiter brought fresh candidates.", "info");
  return null;
}

// scene interactions
export function sceneAction(s: GameState, key: "coffee" | "whiteboard" | "door"): string | null {
  if ((s.cooldowns[key] ?? 0) > s.day) return "Not right now. Try again in a few days.";
  const d = derive(s);
  if (key === "coffee") {
    s.cooldowns[key] = s.day + 4;
    for (const e of s.team) e.morale = clamp(e.morale + 6, 0, 100);
    log(s, "Coffee run. The whole team perks up.", "good");
  } else if (key === "whiteboard") {
    const p = s.products.find((x) => x.id === s.focusId);
    if (!p) return "Pick a product to focus on first.";
    s.cooldowns[key] = s.day + 3;
    const burst = Math.max(3, d.devPts * 1.5);
    if (p.status === "building") p.progress += burst;
    else p.updatePts += burst;
    log(s, `Whiteboard session. ${p.name} jumps ahead.`, "good");
  } else {
    if (s.cash < 100) return "Not enough cash for the networking event ($100).";
    s.cash -= 100;
    s.cooldowns[key] = s.day + 5;
    const live = s.products.find((x) => x.status === "live");
    if (live) live.users += 25 + s.rep * 3;
    s.rep = clamp(s.rep + 0.8, 0, 100);
    log(s, "You hit a networking meetup and handed out stickers.", "good");
  }
  return null;
}

export function setFocus(s: GameState, id: string) {
  s.focusId = id;
}
