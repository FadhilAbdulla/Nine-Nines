// Headless balance simulation: a simple bot plays the game.
import * as E from "../src/game/engine";
import { getEvent } from "../src/game/events";
import { IDEAS, TOOLS, OFFICES, CAMPAIGNS, DECOR } from "../src/game/data";
import { totalUsers, valuation, money } from "../src/game/util";

const s = E.newGame("Sim Co", "Bot");
let lastPrint = 0;
for (let i = 0; i < 4000 && !s.ended; i++) {
  if (s.event) {
    const ev = getEvent(s.event.id)!;
    const ch = ev.choices.find((c) => !c.disabled?.(s)) ?? ev.choices[0];
    ch.apply(s);
    s.event = null;
  }
  // bot strategy
  const live = s.products.filter((p) => p.status === "live");
  if (!s.products.some((p) => p.status === "building")) {
    const next = IDEAS.find((i) => !s.products.some((p) => p.ideaId === i.id) && !E.ideaUnlocked(s, i.id));
    if (next && (live.length === 0 || s.day % 20 === 0)) E.startProduct(s, next.id);
  }
  for (const p of live) {
    for (const c of [...CAMPAIGNS].reverse()) if (s.cash > c.cost * 2.5 && E.runCampaign(s, c.id, p.id) === null) break;
  }
  if (s.cash > 1500 && s.team.length < 60) {
    const devs = s.team.filter((e) => e.role === "dev").length;
    const mgr = s.team.filter((e) => e.role === "manager").length;
    const want = s.team.length - mgr >= 4 + mgr * 6 ? "manager" : devs <= s.team.length / 2 ? "dev" : null;
    const cand = s.candidates.filter((c) => (want ? c.role === want : true) && s.cash > c.salary * 6).sort((a, b) => b.skill - a.skill)[0];
    if (cand) E.hire(s, cand.id);
  }
  for (const t of TOOLS) if (s.cash > t.cost * 3) E.buyTool(s, t.id);
  for (const d of DECOR) if (s.cash > d.cost * 3) E.buyDecor(s, d.id);
  const nxt = OFFICES[s.officeLevel + 1];
  if (nxt && (E.freeDesks(s) <= 0 || s.cash > nxt.cost * 4) && s.cash > nxt.cost * 1.8) E.upgradeOffice(s);
  E.tick(s);
  if (s.day - lastPrint >= (s.day < 100 ? 25 : 60) || s.ended) {
    lastPrint = s.day;
    const d = E.derive(s);
    console.log(`d${s.day} cash ${money(s.cash)} users ${Math.round(totalUsers(s))} rev/d ${money(d.revenue)} burn ${money(d.burn)} team ${s.team.length} office ${s.officeLevel} rep ${s.rep.toFixed(0)} val ${money(valuation(s))} rounds ${s.rounds.join(",")} prods ${s.products.map((p) => p.name + ":" + p.status).join("|")}`);
  }
}
console.log("END", s.ended, "day", s.day);
