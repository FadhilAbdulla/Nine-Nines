import type { Role } from "./types";

export const ROLES: Record<Role, { label: string; emoji: string; blurb: string }> = {
  dev: { label: "Developer", emoji: "👩‍💻", blurb: "Builds the product and squashes bugs." },
  designer: { label: "Designer", emoji: "🎨", blurb: "Makes it lovable. Quality drives growth." },
  marketer: { label: "Marketer", emoji: "📣", blurb: "Makes every campaign hit harder." },
  support: { label: "Support", emoji: "🎧", blurb: "Answers tickets so users stay happy." },
  manager: { label: "Manager", emoji: "📋", blurb: "Each manager keeps 6 people productive." },
};

export interface Idea {
  id: string;
  name: string;
  pitch: string;
  cost: number; // dev points to launch
  arpu: number; // $ per user per day
  market: number; // max users
  unlock: { rep?: number; day?: number; officeLevel?: number; team?: number; users?: number };
  model: string;
}

export const IDEAS: Idea[] = [
  { id: "todo", name: "Pocket Todo", pitch: "A to-do list. Yes, another one. But yours has dark mode.", cost: 30, arpu: 0.07, market: 40_000, unlock: {}, model: "Ads" },
  { id: "habit", name: "Streaks", pitch: "Habit tracker with guilt-trip notifications.", cost: 130, arpu: 0.13, market: 150_000, unlock: { users: 300 }, model: "Freemium" },
  { id: "photo", name: "Snapfilter", pitch: "Photo filters that make everyone look like a movie poster.", cost: 450, arpu: 0.08, market: 900_000, unlock: { users: 2_000, team: 2 }, model: "Ads + IAP" },
  { id: "chat", name: "Huddle", pitch: "Team chat for companies tired of the big one.", cost: 1_600, arpu: 0.35, market: 600_000, unlock: { users: 8_000, officeLevel: 1 }, model: "B2B seats" },
  { id: "invoice", name: "Ledgerly", pitch: "Invoicing and payments for freelancers and small shops.", cost: 4_500, arpu: 0.55, market: 1_200_000, unlock: { users: 25_000, officeLevel: 2 }, model: "SaaS" },
  { id: "ai", name: "Orbit AI", pitch: "An assistant that finally does your emails. Probably.", cost: 30_000, arpu: 0.8, market: 12_000_000, unlock: { users: 100_000, officeLevel: 3 }, model: "Subscription" },
];

export interface ToolDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  cost: number;
  monthly?: number;
  minOffice?: number;
  fx: Partial<{ dev: number; design: number; mkt: number; support: number; mgmt: number; morale: number; server: number; revenue: number; bugs: number; security: number }>;
}

export const TOOLS: ToolDef[] = [
  { id: "laptop", name: "Proper laptop", emoji: "💻", desc: "Builds stop taking a coffee break.", cost: 900, fx: { dev: 0.1 } },
  { id: "monitor", name: "Dual monitors", emoji: "🖥️", desc: "Twice the windows, twice the confidence.", cost: 450, fx: { dev: 0.06, design: 0.06 } },
  { id: "ide", name: "Pro IDE licenses", emoji: "⌨️", desc: "Autocomplete that actually completes.", cost: 300, monthly: 40, fx: { dev: 0.1 } },
  { id: "git", name: "Git + CI pipeline", emoji: "🔁", desc: "Tests run themselves. Fewer 3am surprises.", cost: 600, monthly: 30, fx: { bugs: 0.25 } },
  { id: "design", name: "Design suite", emoji: "🖌️", desc: "Pixel-perfect, finally.", cost: 700, monthly: 50, fx: { design: 0.2 } },
  { id: "analytics", name: "Analytics dashboard", emoji: "📈", desc: "Know which campaigns actually work.", cost: 1_200, monthly: 80, fx: { mkt: 0.2 } },
  { id: "helpdesk", name: "Helpdesk software", emoji: "🎫", desc: "Tickets get tagged, routed, and closed faster.", cost: 1_500, monthly: 120, fx: { support: 0.5 } },
  { id: "payments", name: "Billing & payments stack", emoji: "💳", desc: "Smoother checkout, more revenue per user.", cost: 2_500, monthly: 150, fx: { revenue: 0.12 } },
  { id: "pm", name: "Project management suite", emoji: "🗂️", desc: "Managers can handle 3 more people each.", cost: 3_000, monthly: 200, minOffice: 1, fx: { mgmt: 3 } },
  { id: "cloud", name: "Managed cloud hosting", emoji: "☁️", desc: "Servers cost 40% less per user and rarely fall over.", cost: 5_000, monthly: 300, minOffice: 1, fx: { server: 0.4 } },
  { id: "security", name: "Security suite & audits", emoji: "🛡️", desc: "Breaches and outages hurt far less.", cost: 12_000, monthly: 800, minOffice: 2, fx: { security: 0.6 } },
  { id: "ml", name: "Experimentation platform", emoji: "🧪", desc: "A/B test everything. Dev and marketing +12%.", cost: 40_000, monthly: 2_000, minOffice: 3, fx: { dev: 0.12, mkt: 0.12 } },
];

export interface DecorDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  cost: number;
  minOffice: number;
  fx: Partial<{ morale: number; dev: number; mgmt: number; design: number }>;
  pos: [number, number]; // [col, row] in scene (row from bottom region)
}

export const DECOR: DecorDef[] = [
  { id: "plants", name: "Plants", emoji: "🪴", desc: "Calming. Mostly alive.", cost: 120, minOffice: 0, fx: { morale: 3 }, pos: [0, 0] },
  { id: "coffee", name: "Espresso machine", emoji: "☕", desc: "The real engine of any software company.", cost: 450, minOffice: 0, fx: { morale: 5 }, pos: [1, 0] },
  { id: "whiteboard", name: "Whiteboard wall", emoji: "📝", desc: "Brainstorm for a quick boost. Passive +5% dev.", cost: 400, minOffice: 0, fx: { dev: 0.05 }, pos: [2, 0] },
  { id: "meeting", name: "Meeting room", emoji: "🪑", desc: "Managers handle 2 more people each.", cost: 3_000, minOffice: 1, fx: { mgmt: 2 }, pos: [3, 0] },
  { id: "game", name: "Game room", emoji: "🎮", desc: "Morale +6. Productivity dips for ten minutes at a time.", cost: 4_500, minOffice: 2, fx: { morale: 6 }, pos: [4, 0] },
  { id: "kitchen", name: "Kitchen & chef", emoji: "🍜", desc: "Free lunch. Nobody ever leaves.", cost: 14_000, minOffice: 2, fx: { morale: 8 }, pos: [5, 0] },
  { id: "studio", name: "Design studio", emoji: "🎬", desc: "Light, space, and big monitors. Design +15%.", cost: 20_000, minOffice: 3, fx: { design: 0.15 }, pos: [6, 0] },
  { id: "gym", name: "Rooftop gym", emoji: "🏋️", desc: "Morale +8. Lots of LinkedIn posts.", cost: 60_000, minOffice: 3, fx: { morale: 8 }, pos: [7, 0] },
];

export interface OfficeDef {
  name: string;
  emoji: string;
  desks: number; // including founder
  rent: number; // per day
  cost: number; // move-in cost
  blurb: string;
  cols: number;
}

export const OFFICES: OfficeDef[] = [
  { name: "The Garage", emoji: "🏠", desks: 3, rent: 0, cost: 0, blurb: "Cold floor, warm laptop. Where every legend starts.", cols: 8 },
  { name: "Co-working space", emoji: "🏢", desks: 9, rent: 45, cost: 3_000, blurb: "Hot desks, free coffee, a neighbor who loves to talk.", cols: 10 },
  { name: "Small office", emoji: "🏬", desks: 20, rent: 160, cost: 25_000, blurb: "Your own door, your own logo on the wall.", cols: 12 },
  { name: "Floor in a tower", emoji: "🏙️", desks: 45, rent: 550, cost: 220_000, blurb: "City views and a lobby that says 'we have arrived'.", cols: 14 },
  { name: "Glass HQ", emoji: "🏛️", desks: 80, rent: 1_700, cost: 2_000_000, blurb: "Your own campus. There is a slide. Obviously.", cols: 16 },
];

export interface CampaignDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  cost: number;
  days: number;
  upd: number; // users per day at skill 1
  minRep?: number;
  minOffice?: number;
}

export const CAMPAIGNS: CampaignDef[] = [
  { id: "social", name: "Social media blitz", emoji: "📱", desc: "Post, reply, repeat. Cheap and a bit chaotic.", cost: 60, days: 5, upd: 8 },
  { id: "ph", name: "Launch-site feature", emoji: "🚀", desc: "Get listed on a maker/launch site.", cost: 250, days: 3, upd: 45, minRep: 8 },
  { id: "influencer", name: "Influencer shout-out", emoji: "🤳", desc: "A creator with 200k followers likes your app.", cost: 2_400, days: 7, upd: 70, minRep: 12 },
  { id: "ads", name: "Paid ads", emoji: "🎯", desc: "Search and social ads with proper targeting.", cost: 12_000, days: 14, upd: 110, minRep: 20 },
  { id: "conf", name: "Conference sponsorship", emoji: "🎤", desc: "Booth, swag, and a keynote slot.", cost: 55_000, days: 14, upd: 340, minRep: 30, minOffice: 2 },
  { id: "tv", name: "TV & billboard blitz", emoji: "📺", desc: "Your logo, ten stories tall.", cost: 320_000, days: 21, upd: 1_700, minRep: 45, minOffice: 3 },
];

export const FIRST = ["Ava", "Noah", "Mia", "Liam", "Zoe", "Arjun", "Priya", "Kenji", "Sofia", "Omar", "Lena", "Ravi", "Maya", "Diego", "Aisha", "Theo", "Nina", "Sam", "Yuki", "Elif", "Jonas", "Amara", "Ivan", "Chloe", "Tariq", "Hana", "Leo", "Isla", "Marco", "Fatima"];
export const LAST = ["Patel", "Kim", "Garcia", "Nguyen", "Okafor", "Silva", "Novak", "Haddad", "Rossi", "Chen", "Larsen", "Mehta", "Ito", "Dubois", "Khan", "Reyes", "Costa", "Berg", "Singh", "Park"];

export const TRAITS: Record<Role, string[]> = {
  dev: ["Night owl", "Perfectionist", "Ships fast", "Loves refactoring"],
  designer: ["Obsessed with kerning", "User-research nerd", "Motion wizard"],
  marketer: ["Meme lord", "Data-driven", "Natural storyteller"],
  support: ["Endlessly patient", "Emoji enthusiast", "Calm in a crisis"],
  manager: ["Great listener", "Process fan", "Ex-startup veteran"],
};

export const FOCUS_INFO = {
  code: { label: "Code", emoji: "⌨️", desc: "You write code: +4 dev, +1.2 design per day." },
  market: { label: "Market", emoji: "📣", desc: "You do outreach: +35% campaign power." },
  support: { label: "Support", emoji: "🎧", desc: "You answer tickets yourself." },
  manage: { label: "Manage", emoji: "🧭", desc: "You coach the team: +3 management capacity, morale up." },
} as const;
