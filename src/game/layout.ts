import { OFFICES } from "./data";
import type { Employee, GameState, Role, StationId } from "./types";

export const TILE = 52;

export interface PlacedStation { id: StationId; label: string; emoji: string; x: number; y: number }
export interface PlacedDesk { x: number; y: number; emp: Employee }
export interface Zone { id: StationId | "mgmt"; label: string; x: number; w: number; y: number; h: number; full: boolean }
export interface Layout { cols: number; rows: number; home: boolean; park: boolean; event: boolean; stations: PlacedStation[]; desks: PlacedDesk[]; remote: PlacedDesk[]; empty: { x: number; y: number }[]; zones: Zone[] }

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
  if (s.founded && place === "event") return { cols: 13, rows: 9, home: false, park: false, event: true, stations: [], desks: [], remote: [], empty: [], zones: [] };
  if (s.founded && place === "park") return { cols: 13, rows: 9, home: false, park: true, event: false, stations: [], desks: [], remote: [], empty: [], zones: [] };
  if (!s.founded || place === "home") {
    return { cols: 9, rows: 7, home: true, park: false, event: false, stations: [{ id: "you", ...STATION_INFO.you, label: "Your desk", x: 2, y: 2 }], desks: [], remote: [], empty: [], zones: [] };
  }
  const cols = OFFICES[s.officeLevel].cols;
  // small offices (the garage) put two departments side by side; bigger ones use one row per department
  const bpr = s.officeLevel === 0 ? 2 : 1;
  const perRow = Math.max(2, Math.floor((cols - 1) / 2));
  const perBlock = bpr === 2 ? Math.max(2, Math.floor(perRow / 2)) : perRow;
  const stations: PlacedStation[] = [];
  const desks: PlacedDesk[] = [];
  const emptyAll: { x: number; y: number }[] = [];
  const zones: Zone[] = [];

  type Block = { id: StationId | "mgmt"; label: string; slots: number; place: (x0: number, y0: number) => void };
  const managers = s.team.filter((e) => e.role === "manager" && !e.remote);
  const slotXY = (x0: number, y0: number, slot: number) => ({ x: x0 + 2 * (slot % perBlock), y: y0 + 3 * Math.floor(slot / perBlock) });
  const blocks: Block[] = [
    {
      id: "mgmt",
      label: "Management",
      slots: 2 + managers.length,
      place: (x0, y0) => {
        stations.push({ id: "you", ...STATION_INFO.you, x: x0, y: y0 });
        stations.push({ id: "partner", ...STATION_INFO.partner, ...slotXY(x0, y0, 1) });
        managers.forEach((m, i) => desks.push({ emp: m, ...slotXY(x0, y0, 2 + i) }));
      },
    },
  ];
  for (const id of ["eng", "ops", "design", "mkt", "support"] as StationId[]) {
    if (!stationUnlocked(s, id)) continue;
    const role = STATION_INFO[id].role!;
    const staff = s.team.filter((e) => e.role === role && !e.remote);
    blocks.push({
      id,
      label: STATION_INFO[id].label,
      slots: 1 + staff.length,
      place: (x0, y0) => {
        stations.push({ id, ...STATION_INFO[id], x: x0, y: y0 });
        staff.forEach((e, i) => desks.push({ emp: e, ...slotXY(x0, y0, 1 + i) }));
      },
    });
  }

  let y = 2;
  for (let i = 0; i < blocks.length; i += bpr) {
    const row = blocks.slice(i, i + bpr);
    const rowH = Math.max(...row.map((b) => 3 * Math.ceil(b.slots / perBlock)));
    row.forEach((b, col) => {
      const x0 = 1 + col * perBlock * 2;
      b.place(x0, y);
      const total = Math.ceil(b.slots / perBlock) * perBlock;
      for (let slot = b.slots; slot < total; slot++) emptyAll.push(slotXY(x0, y, slot));
      zones.push({ id: b.id, label: b.label, x: bpr === 1 ? 0 : (x0 - 0.5) * TILE, w: bpr === 1 ? 0 : perBlock * 2 * TILE - 0.1 * TILE, y: y * TILE - 6, h: (rowH - 0.1) * TILE, full: bpr === 1 });
    });
    y += rowH;
  }

  // only show as many empty desks as the office can really still hold
  const free = Math.max(0, OFFICES[s.officeLevel].desks - 2 - s.team.filter((e) => !e.remote).length);
  const empty = emptyAll.slice(0, free);

  const remote: PlacedDesk[] = [];
  const rem = s.team.filter((e) => e.remote);
  rem.forEach((e, i) => remote.push({ emp: e, x: 1 + 2 * (i % perRow), y: y + 2 * Math.floor(i / perRow) }));
  if (rem.length) y += 2 * Math.ceil(rem.length / perRow) + 1;
  return { cols, rows: y + 1, home: false, park: false, event: false, stations, desks, remote, empty, zones };
}
