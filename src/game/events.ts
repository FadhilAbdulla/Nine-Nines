import { OFFICES, PARTNER, ROLES } from "./data";
import { foundCompany, startProduct } from "./engine";
import type { Employee, GameEvent, GameState } from "./types";
import { clamp, log, money, totalUsers, valuation } from "./util";

const live = (s: GameState) => s.products.filter((p) => p.status === "live");
const who = (s: GameState): Employee | undefined => (s.team.length ? s.team[s.day % s.team.length] : undefined);
const cdOK = (s: GameState, k: string) => (s.cooldowns[k] ?? 0) <= s.day;
const noMoney = (cost: number) => (s: GameState) => (s.cash < cost ? "Not enough cash" : null);
const securityShield = (s: GameState) => (s.tools.includes("security") ? 0.4 : 1);
const hasFreeDesk = (s: GameState) => OFFICES[s.officeLevel].desks - (s.founded ? 2 : 1) - s.team.length;
const hasRole = (s: GameState, r: string) => s.team.some((e) => e.role === r);
const building = (s: GameState) => s.products.find((p) => p.status === "building");

function offer(id: "seed" | "seriesA" | "seriesB", title: string, amount: number, pct: number, minVal: number, minUsers: number, investor: string, blurb: string): GameEvent {
  return {
    id: `offer:${id}`,
    kind: "story",
    emoji: "💼",
    title,
    cond: (s) => !s.rounds.includes(id) && valuation(s) >= minVal && totalUsers(s) >= minUsers && cdOK(s, `offer:${id}`) && (id !== "seriesA" || s.rounds.includes("seed")) && (id !== "seriesB" || s.rounds.includes("seriesA")),
    body: (s) => `${investor} has been watching ${s.company}. ${blurb}\n\nThe offer: ${money(amount)} for ${Math.round(pct * 100)}% of the company. Your current valuation is about ${money(valuation(s))}.`,
    choices: [
      {
        label: `Take the ${money(amount)}`,
        hint: `You keep ${Math.round(100 - pct * 100)}% of your stake`,
        apply: (s) => {
          s.cash += amount;
          s.equity *= 1 - pct;
          s.rounds.push(id);
          log(s, `💼 Raised ${money(amount)} (${title}).`, "story");
          return `The wire lands. ${money(amount)} in the bank. Time to build faster, and pressure is now part of the job.`;
        },
      },
      {
        label: "Not yet",
        hint: "They may come back in a few months",
        apply: (s) => {
          s.cooldowns[`offer:${id}`] = s.day + 120;
          return "You thank them. Bootstrapping a bit longer keeps more of the company yours.";
        },
      },
    ],
  };
}

export const EVENTS: GameEvent[] = [
  // ---------- story ----------
  {
    id: "intro",
    kind: "story",
    emoji: "🌙",
    title: "Midnight in your bedroom",
    speaker: "partner",
    cond: () => false,
    body: (s) =>
      `It's 1:12am. Your laptop fan is louder than the fridge. You have $${s.cash.toLocaleString("en-US")} in the bank and an idea you can't stop thinking about.\n\nThe door creaks open. ${PARTNER.name}, your college friend, walks in holding two coffees.\n\n@maya Still awake? Let me guess. The to-do app.\n\n@you It's not just a to-do app. It has dark mode.\n\n@maya Ha! Okay, I'm listening. Walk me through it.\n\n@you Right now it's only an idea. I need to sit down at my laptop and build the prototype first.\n\n@maya Then do it. Go to your desk, open the laptop dashboard and start. I'll be around.`,
    choices: [{ label: "Start coding Pocket Todo", hint: "Begin the prototype", apply: (s) => { startProduct(s, "todo"); return "@maya Take your time. But not too much. I have a feeling about this one."; } }],
  },
  {
    id: "partner_offer",
    kind: "story",
    emoji: "🤝",
    title: "A knock at the door",
    speaker: "partner",
    cond: (s) => !s.founded && !!building(s) && building(s)!.progress >= building(s)!.cost * 0.4 && cdOK(s, "partner"),
    input: { label: "Name your company", placeholder: "e.g. Pixel Forge" },
    body: (s) =>
      `A knock at the door. It's ${PARTNER.name} again. Your prototype is ${Math.round((building(s)!.progress / building(s)!.cost) * 100)}% done.\n\n@maya I saw your demo on the group chat. This is good. Really good.\n\n@maya I've saved some money, and I know how to run a business. Can we create a company together?\n\n@maya I'd put in $20,000 for 25%, and we can use my family's garage as our first office.`,
    choices: [
      {
        label: "Yes, let's create a company",
        hint: "Name it above. Maya invests $20,000 for 25%.",
        apply: (s, text) => {
          foundCompany(s, text ?? "");
          return `@you Let's do it. Welcome to ${s.company}!\n\n@maya First problem: your app is still a prototype. For every job from here on you have two options: do it yourself, or hire someone.\n\n@maya I'll handle HR: hiring, onboarding, and keeping the team happy. You decide who does what.`;
        },
      },
      { label: "Let me think about it", hint: "She'll come back in a couple of weeks", apply: (s) => { s.cooldowns.partner = s.day + 14; return `@maya Take your time. But don't take too long.`; } },
    ],
  },
  {
    id: "need_engineer",
    kind: "story",
    once: true,
    emoji: "🧑‍💻",
    title: "The prototype is stuck",
    cond: (s) => s.founded && !hasRole(s, "dev") && !!building(s) && building(s)!.progress >= building(s)!.cost * 0.6 - 0.5,
    body: () => `You've taken the prototype as far as one person can. The code works on your laptop, mostly. Parts of it are held together with comments that say "TODO fix later".\n\n@maya You have two choices. Go to the Engineering desk and finish the code yourself, by hand, or let me hire an application engineer. I handle the HR side either way.`,
    choices: [
      { label: "Go find an engineer", hint: "Maya handles hiring. Your engineer builds, you can focus on the business", apply: () => "You rub your eyes. For the first time, you're not alone in this." },
      {
        label: "Code it myself with AI help",
        hint: "No hire. But you run EVERYTHING else too: deploys, marketing, support",
        apply: (s) => {
          s.flags.aiSolo = true;
          s.founderFocus = "code";
          log(s, "You opened an AI pair-programmer and kept shipping solo. You are now the whole company.", "story");
          return `You paste the stack trace into an AI assistant. It answers faster than any teammate could, and it never asks for a raise.\n\n@maya Fine, solo it is. But listen: an AI can write the code, it can't run the company. You still have to deploy it, market it and answer every support ticket yourself, at the DevOps, Marketing and Support desks. Burn out if you must, but I'd hire help the moment cash allows.`;
        },
      },
    ],
  },
  {
    id: "built_notice",
    kind: "story",
    once: true,
    emoji: "📦",
    title: "The app is built. Now it needs a home.",
    cond: (s) => s.products.some((p) => p.status === "built"),
    body: (s) => `The last feature is merged. ${s.products.find((p) => p.status === "built")?.name} works, but only on your machines.\n\n@maya Nobody can use it yet. We have to host it somewhere safe, fast, and online. Walk to the DevOps desk. You can deploy it yourself, step by step, or I can hire a DevOps engineer to do it properly.`,
    choices: [{ label: "Hire DevOps and deploy", apply: () => "You open the candidates list. One of them lists 'sleeps next to a server rack' as a hobby." }],
  },
  {
    id: "first_deploy",
    kind: "story",
    once: true,
    emoji: "☁️",
    title: "First deployment",
    cond: (s) => s.products.some((p) => p.status === "deploying"),
    body: (s) => `Your DevOps engineer types a command and a terminal fills with green text. ${s.products.find((p) => p.status === "deploying")?.name} is being deployed to its first real server.\n\nRemember: every server has a capacity. More users than capacity means slow pages and angry customers. Keep an eye on the DevOps dashboard.`,
    choices: [{ label: "Watch the logs scroll", hint: "+1 reputation", apply: (s) => { s.rep += 1; return "Four lines turn red. Then, magically, green again."; } }],
  },
  {
    id: "first_launch",
    kind: "story",
    once: true,
    emoji: "🚀",
    title: "Launch day",
    cond: (s) => live(s).length > 0,
    body: (s) => `You hit publish on ${live(s)[0].name}. Nothing happens. You refresh. Still nothing. Then: one sign-up. A stranger.\n\nThey email you a bug report and a heart emoji.`,
    choices: [
      { label: "Reply personally, fix it tonight", hint: "+3 reputation", apply: (s) => { s.rep += 3; const p = live(s)[0]; p.bugs = clamp(p.bugs - 10, 0, 100); return "They reply in minutes: 'wow, a real person!' They tell three friends."; } },
      { label: "Celebrate with a pizza ($30)", hint: "Pure vibes", disabled: noMoney(30), apply: (s) => { s.cash -= 30; s.rep += 1; return "Cold pizza, warm feelings. You earned this."; } },
    ],
  },
  {
    id: "users_100",
    kind: "story",
    once: true,
    emoji: "🎉",
    title: "Your first 100 users",
    cond: (s) => totalUsers(s) >= 100,
    body: () => "A hundred real people use something you made. Your mom shares it on her feed with 14 exclamation marks.",
    choices: [{ label: "Frame the dashboard screenshot", hint: "+2 reputation", apply: (s) => { s.rep += 2; return "It goes on the garage wall, right next to the hand-drawn logo."; } }],
  },
  {
    id: "first_hire",
    kind: "story",
    once: true,
    emoji: "🤝",
    title: "You're not alone anymore",
    cond: (s) => s.team.length >= 1,
    body: (s) => `${s.team[0].name} starts today. The garage suddenly has a second chair, and it's occupied.\n\nTip: more people means more management load. Past four direct reports, hire a manager.`,
    choices: [{ label: "Give them a tour (two steps)", hint: "+10 morale for them", apply: (s) => { s.team[0].morale = clamp(s.team[0].morale + 10, 0, 100); return "'The coffee machine is that corner. The office is wherever we are.'"; } }],
  },
  {
    id: "garage_full",
    kind: "story",
    once: true,
    emoji: "📦",
    title: "The garage is bursting",
    cond: (s) => s.officeLevel === 0 && hasFreeDesk(s) <= 0 && s.team.length >= 2,
    body: () => "Three people, four laptops, one extension cord that smells like toast. The neighbor has started leaving notes.\n\nIt might be time to find a real office. Open the Office tab.",
    choices: [{ label: "Start browsing listings", apply: () => "A co-working space downtown offers day passes and unlimited kombucha." }],
  },
  {
    id: "first_office",
    kind: "story",
    once: true,
    emoji: "🏢",
    title: "First day at the office",
    cond: (s) => s.officeLevel >= 1,
    body: (s) => `You carry a cardboard box through a glass door. ${OFFICES[s.officeLevel].name}. Your name is on the door sticker, spelled right.\n\nThe team files in, looking around. Someone asks if they can put a plant here.`,
    choices: [
      { label: "Throw an opening party ($400)", hint: "+12 morale for everyone", disabled: noMoney(400), apply: (s) => { s.cash -= 400; for (const e of s.team) e.morale = clamp(e.morale + 12, 0, 100); return "Pizza, a speaker, and an unsettling dance by the new intern's cousin. Perfect."; } },
      { label: "Straight to work", hint: "+3 reputation for focus", apply: (s) => { s.rep += 3; return "You write the first commit from the new desk. It's a typo fix, but it's a start."; } },
    ],
  },
  {
    id: "team_10",
    kind: "story",
    once: true,
    emoji: "🏗️",
    title: "Ten people. Culture time.",
    cond: (s) => s.team.length >= 9,
    body: () => "Someone asks a simple question: 'What's our culture?' The room is quiet. You realize you've been building one by accident.",
    choices: [
      { label: "Move fast, ship daily", hint: "Dev +10%, morale −6", apply: (s) => { s.flags.cultureShip = true; for (const e of s.team) e.morale = clamp(e.morale - 6, 0, 100); return "Pager rotations get a rubber duck mascot. Velocity goes up. So does the number of energy drinks."; } },
      { label: "Sustainable pace", hint: "Morale +10, steady", apply: (s) => { s.flags.cultureCalm = true; for (const e of s.team) e.morale = clamp(e.morale + 10, 0, 100); return "Friday afternoons are 'no meetings'. A senior engineer cries a little. Happy tears."; } },
    ],
  },
  {
    id: "users_10k",
    kind: "story",
    once: true,
    emoji: "📈",
    title: "10,000 users",
    cond: (s) => totalUsers(s) >= 10_000,
    body: () => "A tech blog writes about you. The headline contains the word 'rocket'. Your server bill contains the word 'ouch'.",
    choices: [{ label: "Make a press kit", hint: "+4 reputation", apply: (s) => { s.rep += 4; return "You finally have a logo that exists in more than one resolution."; } }],
  },
  {
    id: "competitor",
    kind: "story",
    once: true,
    emoji: "🥊",
    title: "A big competitor notices you",
    cond: (s) => totalUsers(s) >= 25_000,
    body: () => "A well-funded rival just shipped a 'strikingly familiar' feature and made it free. Their CEO tweeted a rocket emoji. At you, you're fairly sure.",
    choices: [
      { label: "Out-build them", hint: "Quality +6 on your focus product", apply: (s) => { const p = s.products.find((x) => x.id === s.focusId); if (p) p.quality = clamp(p.quality + 6, 0, 100); return "The team rallies. You ship a response in nine days. It's better."; } },
      { label: "Out-market them ($5,000)", hint: "+5 reputation, users surge", disabled: noMoney(5_000), apply: (s) => { s.cash -= 5_000; s.rep += 5; for (const p of live(s)) p.users *= 1.08; return "Your 'We were first' campaign is cheeky and works."; } },
    ],
  },
  offer("seed", "Seed round", 120_000, 0.12, 120_000, 800, "An angel investor who sold her last startup", "She likes your growth curve and your total lack of a slide deck."),
  offer("seriesA", "Series A", 1_800_000, 0.2, 2_000_000, 6_000, "A seed-stage VC firm on Sand Hill Road", "They want you to hire faster and aim bigger."),
  offer("seriesB", "Series B", 9_000_000, 0.15, 20_000_000, 40_000, "A growth fund with a very tall office", "They see you as a category leader. Their intern has a slide for it."),
  {
    id: "offer:ipo",
    kind: "story",
    emoji: "🔔",
    title: "The bell is waiting",
    cond: (s) => valuation(s) >= 500_000_000 && s.team.length >= 40 && s.officeLevel >= 4 && s.rep >= 40 && s.rounds.includes("seriesB") && cdOK(s, "offer:ipo"),
    body: (s) => `Bankers are calling. ${s.company} is valued at roughly ${money(valuation(s))} with ${totalUsers(s).toLocaleString("en-US")} users and ${s.team.length} employees.\n\nGoing public would be the finish line of this story. You'd hold about ${Math.round(s.equity * 100)}% of the company.`,
    choices: [
      { label: "Ring the bell 🔔", hint: "Go public and win the game", apply: (s) => { s.ended = "ipo"; log(s, `🔔 ${s.company} went public at ${money(valuation(s))}.`, "story"); return "The floor erupts. Someone hands you a tiny hammer."; } },
      { label: "Keep building", hint: "Ask again in 90 days", apply: (s) => { s.cooldowns["offer:ipo"] = s.day + 90; return "You tell the bankers to call back. Your CFO needs a minute and a chair."; } },
    ],
  },

  // ---------- random ----------
  {
    id: "viral",
    kind: "random",
    weight: 3,
    emoji: "🔥",
    title: "You're going viral",
    cond: (s) => totalUsers(s) >= 50 && live(s).length > 0,
    body: () => "A popular account just posted about your app, and traffic is spiking. Servers sweat nervously.",
    choices: [
      { label: "Boost servers ($300)", hint: "Capture the wave", disabled: noMoney(300), apply: (s) => { s.cash -= 300; for (const p of live(s)) p.users += Math.max(60, p.users * 0.35); s.rep += 2; return "The graph looks like a hockey stick. Screenshots will be taken."; } },
      { label: "Ride it out", hint: "Free, smaller bump", apply: (s) => { for (const p of live(s)) p.users += Math.max(20, p.users * 0.12); return "Some pages time out, but plenty of people still sign up."; } },
    ],
  },
  {
    id: "outage",
    kind: "random",
    weight: 3,
    emoji: "🧯",
    title: "Production is down",
    cond: (s) => totalUsers(s) >= 500,
    body: (s) => `Pager goes off. Error rates are 100%. ${s.tools.includes("cloud") ? "Your managed cloud is already failing over." : "Your single server is, to be technical, on fire."}`,
    choices: [
      { label: "Pay for emergency help ($800)", hint: "Fast fix", disabled: noMoney(800), apply: (s) => { s.cash -= 800; return "A contractor appears like a wizard. Everything's up in 40 minutes."; } },
      { label: "Fix it ourselves", hint: "Lose users and reputation", apply: (s) => { const k = securityShield(s); for (const p of live(s)) { p.users *= 1 - 0.06 * k; p.bugs = clamp(p.bugs + 5, 0, 100); } s.rep = clamp(s.rep - 3 * k, 0, 100); return "Six hours later it's fixed. Users are annoyed; the post-mortem is brutal and kind."; } },
    ],
  },
  {
    id: "clone",
    kind: "random",
    weight: 2,
    emoji: "👯",
    title: "A clone appears",
    cond: (s) => totalUsers(s) >= 4_000,
    body: () => "A suspiciously similar app is climbing the charts. It even copied your typo.",
    choices: [
      { label: "Ship a standout feature", hint: "Quality +4", apply: (s) => { for (const p of live(s)) p.quality = clamp(p.quality + 4, 0, 100); return "You differentiate hard. Users appreciate it."; } },
      { label: "Ignore it", hint: "Lose some users", apply: (s) => { for (const p of live(s)) p.users *= 0.95; return "Some users wander off. Most come back when the clone breaks."; } },
    ],
  },
  {
    id: "burnout",
    kind: "random",
    weight: 2,
    emoji: "🥱",
    title: "Someone is burning out",
    cond: (s) => s.team.length >= 2,
    body: (s) => `${who(s)?.name} (${who(s) ? ROLES[who(s)!.role].label : ""}) has been quiet for two weeks and looks like they haven't slept.`,
    choices: [
      { label: "Give them a week off", hint: "Morale +25, lose a few days of their output", apply: (s) => { const e = who(s); if (e) e.morale = clamp(e.morale + 25, 0, 100); return "They come back refreshed. 'Thank you,' they say, and mean it."; } },
      { label: "Push through the sprint", hint: "Morale −15", apply: (s) => { const e = who(s); if (e) e.morale = clamp(e.morale - 15, 0, 100); return "The sprint ships. Their Slack status is now a skull."; } },
    ],
  },
  {
    id: "poach",
    kind: "random",
    weight: 2,
    emoji: "🧲",
    title: "A recruiter calls your best person",
    cond: (s) => s.team.length >= 3 && s.day > 90,
    body: (s) => `${who(s)?.name} got a 30% higher offer from a big company. They came to you first. That means they want to stay.`,
    choices: [
      { label: "Match the offer", hint: "Raise 20%, morale up", apply: (s) => { const e = who(s); if (e) { e.salary = Math.round(e.salary * 1.2); e.morale = clamp(e.morale + 18, 0, 100); } return "They stay. Payroll sighs."; } },
      { label: "Wish them luck", hint: "They leave", apply: (s) => { const e = who(s); if (e) { s.team = s.team.filter((x) => x.id !== e.id); for (const o of s.team) o.morale = clamp(o.morale - 5, 0, 100); } return "They leave on good terms. Their desk stays warm for a while."; } },
    ],
  },
  {
    id: "press",
    kind: "random",
    weight: 2,
    emoji: "📰",
    title: "A journalist wants to write about you",
    cond: (s) => s.rep >= 12 && live(s).length > 0,
    body: () => "A reporter from a well-known tech outlet asks for a 30-minute chat about your product.",
    choices: [
      { label: "Take the interview", hint: "+5 reputation, new users", apply: (s) => { s.rep = clamp(s.rep + 5, 0, 100); for (const p of live(s)) p.users += Math.max(80, p.users * 0.1); return "The story runs with a flattering photo. Your parents print it."; } },
      { label: "Pass", hint: "No change", apply: () => "You decline. The article goes up anyway, about someone else." },
    ],
  },
  {
    id: "bug",
    kind: "random",
    weight: 3,
    emoji: "🐛",
    title: "A nasty bug slipped into production",
    cond: (s) => live(s).some((p) => p.bugs > 35),
    body: () => "Users are posting screenshots of a very strange bug. One of them is actually pretty funny.",
    choices: [
      { label: "Drop everything and fix it", hint: "Bugs −25", apply: (s) => { for (const p of live(s)) p.bugs = clamp(p.bugs - 25, 0, 100); return "Patched in a day. A user sends you a thank-you gif."; } },
      { label: "Ship a patch next sprint", hint: "Reputation −2", apply: (s) => { s.rep = clamp(s.rep - 2, 0, 100); return "It lingers a while. Reviews get a little spicier."; } },
    ],
  },
  {
    id: "tax",
    kind: "random",
    weight: 2,
    emoji: "🧾",
    title: "Tax season",
    cond: (s) => s.day > 100 && cdOK(s, "tax"),
    body: () => "An accountant politely asks for receipts you don't have. 'Do you have... anything?'",
    choices: [
      { label: "Hire an accountant ($600)", hint: "Clean books", disabled: noMoney(600), apply: (s) => { s.cash -= 600; s.cooldowns.tax = s.day + 150; return "She finds $0 in missing deductions and 3 in suspicious coffee receipts. Everything's filed."; } },
      { label: "DIY with a spreadsheet", hint: "Risk a penalty", apply: (s) => { s.cooldowns.tax = s.day + 150; const fine = Math.round(300 + Math.max(0, s.cash) * 0.03); s.cash -= fine; return `You miss a form. The penalty is ${money(fine)}.`; } },
    ],
  },
  {
    id: "breach",
    kind: "random",
    weight: 1.5,
    emoji: "🕵️",
    title: "Security researcher reports a hole",
    cond: (s) => totalUsers(s) >= 3_000 && s.day > 120,
    body: (s) => `A friendly researcher found a way to read other users' data. ${s.tools.includes("security") ? "Your security suite already caught most of it." : "No audits, no scanner, no safety net."}`,
    choices: [
      { label: "Patch and disclose openly", hint: "Reputation takes a smaller hit", apply: (s) => { const k = securityShield(s); s.rep = clamp(s.rep - 2 * k, 0, 100); s.cash -= 500; return "Transparent, calm, thorough. Users appreciate the honesty."; } },
      { label: "Quietly patch it", hint: "Cheap, but risky", apply: (s) => { const k = securityShield(s); if (Math.random() < 0.5) { s.rep = clamp(s.rep - 8 * k, 0, 100); for (const p of live(s)) p.users *= 1 - 0.05 * k; return "It leaks anyway. The headline writes itself."; } return "Nobody ever finds out. You decide not to think about it."; } },
    ],
  },
  {
    id: "outing",
    kind: "random",
    weight: 1.5,
    emoji: "🎳",
    title: "Team wants a night out",
    cond: (s) => s.team.length >= 3 && cdOK(s, "outing"),
    body: () => "Someone floated bowling. A second person said yes. Now it's a thing.",
    choices: [
      { label: "Pay for everything ($250)", hint: "+12 morale for all", disabled: noMoney(250), apply: (s) => { s.cash -= 250; s.cooldowns.outing = s.day + 60; for (const e of s.team) e.morale = clamp(e.morale + 12, 0, 100); return "Someone bowls a 7. Someone else bowls a 300 by cheating. Nobody minds."; } },
      { label: "Split the bill", hint: "+4 morale", apply: (s) => { s.cooldowns.outing = s.day + 60; for (const e of s.team) e.morale = clamp(e.morale + 4, 0, 100); return "Fine, but the group chat is quiet for a day."; } },
    ],
  },
  {
    id: "grant",
    kind: "random",
    weight: 1.5,
    emoji: "🎁",
    title: "A small startup grant",
    cond: (s) => s.day > 20 && s.day < 400 && cdOK(s, "grant"),
    body: () => "A regional innovation fund picked your application out of a pile. 'Congratulations' reads the email, followed by a long PDF.",
    choices: [{ label: "Accept $2,500", hint: "Free money", apply: (s) => { s.cash += 2_500; s.cooldowns.grant = s.day + 9999; return "You fill in nine forms. The check clears."; } }],
  },
];

export function getEvent(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export function pickEvent(s: GameState): string | null {
  for (const e of EVENTS) {
    if (e.kind !== "story" || e.id === "intro") continue;
    if (e.once && s.flags[`seen:${e.id}`]) continue;
    if (e.cond(s)) {
      if (e.once) s.flags[`seen:${e.id}`] = true;
      return e.id;
    }
  }
  if (!s.founded) return null;
  if ((s.cooldowns.random ?? 0) > s.day) return null;
  if (Math.random() > 0.045) return null;
  const pool = EVENTS.filter((e) => e.kind === "random" && e.cond(s));
  const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
  if (!pool.length) return null;
  let r = Math.random() * total;
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) {
      s.cooldowns.random = s.day + 8;
      return e.id;
    }
  }
  return null;
}
