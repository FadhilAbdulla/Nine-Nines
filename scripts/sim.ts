// Headless balance simulation: a simple bot plays the whole story.
import * as E from "../src/game/engine";
import { EAT_ORDER } from "../src/game/engine";
import { getEvent } from "../src/game/events";
import { IDEAS, TOOLS, OFFICES, CAMPAIGNS, DECOR } from "../src/game/data";
import { totalUsers, valuation, money } from "../src/game/util";

const s = E.newGame("Bot", { skin: 1, hair: 0, hairColor: 0, shirt: 0 });
let lastPrint = 0;
const want = (role: string) => s.candidates.filter((c) => c.role === role && s.cash > c.salary * 4 && c.skill >= 2).sort((a, b) => (s.team.length < 2 ? a.salary - b.salary : b.skill - a.skill))[0];
for (let i = 0; i < 5000 && !s.ended; i++) {
  if (s.event) {
    const ev = getEvent(s.event.id)!;
    const ch = ev.choices.find((c) => !c.disabled?.(s)) ?? ev.choices[0];
    ch.apply(s, "Sim Co");
    s.event = null;
  }
  const live = s.products.filter((p) => p.status === "live");
  if (s.founded) {
    const has = (r: string) => s.team.filter((e) => e.role === r).length;
    const hiring = (r: string) => { const c = want(r); if (c) E.hire(s, c.id, E.freeDesks(s) <= 0); };
    if (!has("dev")) hiring("dev");
    else if (!has("devops")) hiring("devops");
    else if (live.length && s.cash > 1500) {
      const n = s.team.length;
      const mgr = has("manager");
      if (n - mgr >= 4 + mgr * 6) hiring("manager");
      else if (live.reduce((a, p) => a + p.users, 0) > E.derive(s).capacity * 0.7 && s.cash > 4000) hiring("devops");
      else if (E.derive(s).coverage < 0.8) hiring("support");
      else if (has("designer") < 1 && n >= 3) hiring("designer");
      else if (has("marketer") < 1 && n >= 4) hiring("marketer");
      else if (has("dev") <= n / 3) hiring("dev");
      else if (s.team.length < 60 && s.cash > 20000) hiring(["dev", "devops", "support", "designer", "marketer"][s.day % 5]);
    }
    for (const p of s.products.filter((x) => x.status === "built")) E.deployProduct(s, p.id);
    if (!s.products.some((p) => p.status !== "live") && live.length) {
      const next = IDEAS.find((i) => !s.products.some((p) => p.ideaId === i.id) && !E.ideaUnlocked(s, i.id));
      if (next && s.day % 15 === 0) E.startProduct(s, next.id);
    }
    for (const p of live) for (const c of [...CAMPAIGNS].reverse()) if (s.cash > c.cost * 2.5 && E.runCampaign(s, c.id, p.id) === null) break;
    for (const t of TOOLS) if (s.cash > t.cost * 5 && live.length) E.buyTool(s, t.id);
    const fr = E.facilityReport(s);
    const queued = (id: string) => (id === "washroom" ? fr[0].queue : EAT_ORDER.includes(id) ? fr[1].queue : 0) > 1;
    for (const d of DECOR) if (s.cash > d.cost * 5 && live.length && (E.decorUnits(s, d.id) === 0 || queued(d.id))) E.buyDecor(s, d.id);
    const nxt = OFFICES[s.officeLevel + 1];
    if (nxt && E.freeDesks(s) <= 0 && s.cash > nxt.cost * 2.5) E.upgradeOffice(s);
  }
  E.tick(s);
  if (s.day - lastPrint >= (s.day < 150 ? 15 : 100) || s.ended) {
    lastPrint = s.day;
    const d = E.derive(s);
    console.log(`d${s.day} f=${s.founded} cash ${money(s.cash)} users ${Math.round(totalUsers(s))} cap ${Math.round(d.capacity)} rev/d ${money(d.revenue)} burn ${money(d.burn)} team ${s.team.length} off ${s.officeLevel} rep ${s.rep.toFixed(0)} val ${money(valuation(s))} ${s.rounds.join(",")} ${s.products.map((p) => p.name + ":" + p.status).join("|")}`);
  }
}
console.log("END", s.ended, "day", s.day);
