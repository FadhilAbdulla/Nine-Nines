export type Role = "dev" | "designer" | "marketer" | "support" | "manager";
export type FounderFocus = "code" | "market" | "support" | "manage";
export type Background = "engineer" | "marketer" | "heir";

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
  status: "building" | "live";
  progress: number;
  designProgress: number;
  cost: number;
  quality: number; // 0-100
  users: number;
  bugs: number; // 0-100
  version: number;
  updatePts: number;
  revenueTotal: number;
  launchedDay?: number;
}

export interface Campaign {
  id: string;
  defId: string;
  productId: string;
  daysLeft: number;
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
  apply: (s: GameState) => string | void;
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
  choices: EventChoice[];
}

export interface ActiveEvent {
  id: string;
  result?: string; // shown after a choice is made
}

export interface GameState {
  started: boolean;
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
  seq: number;
}
