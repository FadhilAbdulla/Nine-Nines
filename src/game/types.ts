export type Role = "dev" | "devops" | "designer" | "marketer" | "support" | "manager";
export type StationId = "you" | "partner" | "eng" | "ops" | "design" | "mkt" | "support";
export interface Look { skin: number; hair: number; hairColor: number; shirt: number }
export type FounderFocus = "code" | "market" | "support" | "manage";
export type Background = "engineer" | "marketer" | "heir";

export type Doing = "work" | "eat" | "washroom" | "nap" | "coffee" | "drowsy" | "out_lunch" | "out_wc" | "queue_wc" | "queue_eat";
export interface Vitals { energy: number; hunger: number; bladder: number; doing: Doing; awayLeft: number; where?: string }

export interface Employee {
  id: string;
  name: string;
  role: Role;
  skill: number; // 1-10
  morale: number; // 0-100
  salary: number; // per month
  hiredDay: number;
  trait: string;
  lowDays: number; // consecutive days of very low morale
  remote?: boolean;
  vitals?: Vitals;
}

export interface Candidate {
  id: string;
  name: string;
  role: Role;
  skill: number;
  salary: number;
  trait: string;
}

export interface Product {
  id: string;
  ideaId: string;
  name: string;
  status: "building" | "built" | "deploying" | "live";
  deployLeft: number;
  progress: number;
  designProgress: number;
  cost: number;
  quality: number; // 0-100
  users: number;
  bugs: number; // 0-100
  version: number;
  updatePts: number;
  revenueTotal: number;
  launchBugs?: number;
  launchedDay?: number;
}

export interface Campaign {
  id: string;
  defId: string;
  productId: string;
  daysLeft: number;
  boost?: number;
}

export interface LogEntry {
  day: number;
  text: string;
  tone: "info" | "good" | "bad" | "story";
}

export interface EventChoice {
  label: string;
  hint?: string;
  disabled?: (s: GameState) => string | null; // returns reason if unavailable
  apply: (s: GameState, text?: string) => string | void;
}

export interface GameEvent {
  id: string;
  kind: "story" | "random";
  title: string;
  emoji: string;
  body: (s: GameState) => string;
  cond: (s: GameState) => boolean;
  weight?: number; // random events only
  once?: boolean;
  input?: { label: string; placeholder: string };
  speaker?: "partner";
  choices: EventChoice[];
}

export interface ActiveEvent {
  id: string;
  result?: string; // shown after a choice is made
}

export interface GameState {
  started: boolean;
  founded: boolean;
  partnerVisit: boolean;
  look: Look;
  company: string;
  founder: string;
  background: Background;
  day: number;
  cash: number;
  rep: number;
  founderFocus: FounderFocus;
  equity: number; // founder ownership 0-1
  rounds: string[];
  products: Product[];
  focusId: string | null;
  team: Employee[];
  candidates: Candidate[];
  nextCandidateDay: number;
  tools: string[];
  officeLevel: number;
  decor: string[];
  campaigns: Campaign[];
  log: LogEntry[];
  event: ActiveEvent | null;
  flags: Record<string, boolean>;
  cooldowns: Record<string, number>;
  revHistory: number[]; // last 30 days revenue
  today: { revenue: number; expenses: number };
  negativeDays: number;
  ended: null | "ipo" | "bankrupt";
  peakUsers: number;
  supportBoost?: { until: number; mult: number };
  partnerVitals?: Vitals;
  seq: number;
}
