import { OFFICES } from "./data";
import type { Employee, GameState, Role, StationId } from "./types";

export const TILE = 52;

export interface PlacedStation { id: StationId; label: string; emoji: string; x: number; y: number }
export interface PlacedDesk { x: number; y: number; emp: Employee }
export interface Layout { cols: number; rows: number; home: boolean; park: boolean; event: boolean; stations: PlacedStation[]; desks: PlacedDesk[]; remote: PlacedDesk[]; empty: { x: number; y: number }[] }

export const STATION_INFO: Record<StationId, { label: string; emoji: string; role?: Role }> = {
  you: { label: "Director desk", emoji: "💻" },
  partner: { label: "Partner desk", emoji: "🗂️" },
  eng: { label: "Engineering", emoji: "⌨️", role: "dev" },
  ops: { label: "DevOps", emoji: "☁️", role: "devops" },
  design: { label: "Design", emoji: "🎨", role: "designer" },
  mkt: { label: "Marketing", emoji: "📣", role: "marketer" },
  support: { label: "Support", emoji: "🎧", role: "support" },
};

export function stationUnlocked(s: GameState, id: StationId): boolean {
  const staff = (r: Role) => s.team.some((e) => e.role === r);
  const anyProduct = s.products.length > 0;
  const live = s.products.some((p) => p.status === "live");
  const users = s.products.reduce((a, p) => a + (p.status === "live" ? p.users : 0), 0);
  switch (id) {
    case "you": return true;
    case "partner": return s.founded;
    case "eng": return s.founded && anyProduct;
    case "ops": return s.founded && (staff("devops") || s.products.some((p) => p.status !== "building"));
    case "design": return s.founded && (staff("designer") || s.tools.includes("design") || users >= 500);
    case "mkt": return s.founded && (live || staff("marketer"));
    case "support": return s.founded && (staff("support") || users >= 300);
  }
}

export type Place = "office" | "home" | "park" | "event";

export function computeLayout(s: GameState, place: Place = "office"): Layout {
  if (s.founded && place === "event") return { cols: 13, rows: 9, home: false, park: false, event: true, stations: [], desks: [], remote: [], empty: [] };
  if (s.founded && place === "park") return { cols: 13, rows: 9, home: false, park: true, event: false, stations: [], desks: [], remote: [], empty: [] };
  if (!s.founded || place === "home") {
    return { cols: 9, rows: 7, home: true, park: false, event: false, stations: [{ id: "you", ...STATION_INFO.you, label: "Your desk", x: 2, y: 2 }], desks: [], remote: [], empty: [] };
  }
  const cols = OFFICES[s.officeLevel].cols;
  const perRow = Math.max(2, Math.floor((cols - 1) / 2));
  const stations: PlacedStation[] = [];
  const desks: PlacedDesk[] = [];
  const empty: { x: number; y: number }[] = [];
  const pad = (used: number, y0: number) => {
    const total = Math.ceil(used / perRow) * perRow;
    for (let slot = used; slot < total; slot++) empty.push({ x: 1 + 2 * (slot % perRow), y: y0 + 3 * Math.floor(slot / perRow) });
  };
  let y = 2;

  // management row: you, partner, managers
  const managers = s.team.filter((e) => e.role === "manager" && !e.remote);
  const mgmtSlots = 2 + managers.length;
  stations.push({ id: "you", ...STATION_INFO.you, x: 1, y });
  stations.push({ id: "partner", ...STATION_INFO.partner, x: 3, y });
  managers.forEach((m, i) => {
    const slot = 2 + i;
    desks.push({ emp: m, x: 1 + 2 * (slot % perRow), y: y + 3 * Math.floor(slot / perRow) });
  });
  pad(mgmtSlots, y);
  y += 3 * Math.ceil(mgmtSlots / perRow);

  for (const id of ["eng", "ops", "design", "mkt", "support"] as StationId[]) {
    if (!stationUnlocked(s, id)) continue;
    const role = STATION_INFO[id].role!;
    const staff = s.team.filter((e) => e.role === role && !e.remote);
    stations.push({ id, ...STATION_INFO[id], x: 1, y });
    staff.forEach((e, i) => {
      const slot = 1 + i;
      desks.push({ emp: e, x: 1 + 2 * (slot % perRow), y: y + 3 * Math.floor(slot / perRow) });
    });
    pad(1 + staff.length, y);
    y += 3 * Math.ceil((1 + staff.length) / perRow);
  }
  const remote: PlacedDesk[] = [];
  const rem = s.team.filter((e) => e.remote);
  rem.forEach((e, i) => remote.push({ emp: e, x: 1 + 2 * (i % perRow), y: y + 2 * Math.floor(i / perRow) }));
  if (rem.length) y += 2 * Math.ceil(rem.length / perRow) + 1;
  return { cols, rows: y + 1, home: false, park: false, event: false, stations, desks, remote, empty };
}
