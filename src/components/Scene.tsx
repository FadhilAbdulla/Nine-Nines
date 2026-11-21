"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DECOR, OFFICES, PARTNER, ROLES } from "@/game/data";
import { sceneAction, type NetKey } from "@/game/engine";
import { emotionOf } from "@/game/util";
import { computeLayout, STATION_INFO, TILE } from "@/game/layout";
import type { StationId } from "@/game/types";
import { useUI } from "@/store/useUI";
import Avatar, { lookFor, PARTNER_LOOK, ROLE_SHIRT, SHIRTS } from "./Avatar";
import { Buffet, EventBanner, StandTable, StringLights } from "./EventScene";
import { CafeTable, LampPost, ParkAmbient, ParkGround, ParkSky } from "./ParkScene";
import { Bed, Bench, Bookshelf, Cabinet, CoffeeCart, CoffeeTable, DecorArt, Desk, Gate, GlassDoor, Lamp, Plant, Sofa, SvgDefs, Tree, Vending, Wall } from "./Furniture";
import { useAct, useG } from "./ui";

type PropKey = "coffee" | "whiteboard" | "door" | "bed" | "cart" | "bench" | "exit" | NetKey;
type Near =
  | { kind: "station"; id: StationId; label: string }
  | { kind: "person"; id: string; label: string }
  | { kind: "prop"; key: PropKey; label: string };

const SPEED = 190; // px per second
const NET_ATTENDEES: { key: NetKey; name: string; job: string; emoji: string; role: "marketer" | "manager" | "support" | "dev"; x: number; y: number; label: string }[] = [
  { key: "net_press", name: "Dana", job: "Tech journalist", emoji: "📰", role: "marketer", x: 2.3, y: 3.0, label: "Pitch Dana, the tech journalist" },
  { key: "net_investor", name: "Priya", job: "Investor", emoji: "💼", role: "manager", x: 6.0, y: 2.2, label: "Chat with Priya, an investor" },
  { key: "net_recruiter", name: "Marco", job: "Recruiter", emoji: "🧑‍💼", role: "support", x: 9.6, y: 3.2, label: "Talk to Marco, a recruiter" },
  { key: "net_mentor", name: "Wen", job: "Veteran founder", emoji: "🧙", role: "dev", x: 4.4, y: 5.7, label: "Ask Wen, a veteran founder, for advice" },
];
const PARK_TREES: [number, number][] = [[2.6, 1.5], [10.4, 1.4], [11.7, 4.2], [0.6, 5.4], [6.4, 6.3], [3.0, 6.6]];
const HUD_H = 56; // px of room kept under the HUD (drawn as ceiling/wall)
const ZONE_COLOR: Record<string, string> = { you: "#38bdf8", partner: "#a78bfa" };
const WALL_TONE: Record<string, [string, string]> = {
  home: ["#4a4d86", "#34376a"],
  lvl0: ["#cfd6e2", "#b4bdcc"],
  lvl1: ["#e7ecf4", "#cbd4e2"],
  lvl2: ["#e4ecf0", "#c4d2da"],
  lvl3: ["#eef0f6", "#d0d4e2"],
  lvl4: ["#6a7692", "#4c5875"],
};
/** Where the i-th owned decor item stands: along the bottom wall, wrapping upward when the room is narrow. */
const decorSpot = (i: number, cols: number, bottom: number) => {
  const per = Math.max(3, Math.floor((cols - 0.4) / 1.6));
  return { x: 0.5 + (i % per) * 1.6, y: bottom - Math.floor(i / per) * 1.25 };
};
const gapLineY = (seatY: number) => (2 + 3 * Math.max(0, Math.floor((seatY / TILE - 2) / 3))) * TILE + 2.45 * TILE;
type NpcTarget = { kind: "seat" | "spot" | "door"; x: number; y: number };
type NpcLive = { id: string; seat: { x: number; y: number }; doing: string; remote: false; target: NpcTarget };
const dist = (px: number, py: number, x: number, y: number, w: number, h: number) => {
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
};

export default function Scene() {
  const g = useG();
  const act = useAct();
  const { at, dash, setAt, openDash, closeDash, setTalk, place, goOut, setGoOut, setPlace } = useUI();
  const effPlace = g.founded ? place : "office";
  const L = useMemo(() => computeLayout(g, effPlace), [g, effPlace]);
  const inOffice = !L.home && !L.park && !L.event;
  const atHome = L.home && g.founded;
  const office = OFFICES[g.officeLevel];
  const W = L.cols * TILE;
  const H = L.rows * TILE;
  // the room is stretched to fill the whole screen: extra floor left/right (extX) and below (extY)
  const [ext, setExt] = useState({ x: 0, y: 0, top: HUD_H });

  // ---- static geometry
  const solids = useMemo(() => {
    const r: { x: number; y: number; w: number; h: number }[] = [];
    if (L.event) {
      for (const a of NET_ATTENDEES) r.push({ x: a.x * TILE - 4, y: a.y * TILE + 20, w: TILE * 1.5, h: TILE * 0.9 });
      r.push({ x: 8.2 * TILE, y: 6.3 * TILE, w: 2.5 * TILE, h: 0.9 * TILE });
    }
    if (L.park) {
      r.push({ x: 7.4 * TILE, y: 2.5 * TILE, w: 1.8 * TILE, h: 1.2 * TILE }); // coffee cart
      r.push({ x: 8.35 * TILE, y: 5.1 * TILE, w: 3.3 * TILE, h: 2.3 * TILE }); // pond
      r.push({ x: 4.85 * TILE, y: 1.45 * TILE, w: 1.1 * TILE, h: 0.95 * TILE }); // fountain
      for (const [tx, ty] of PARK_TREES) r.push({ x: tx * TILE + 24, y: ty * TILE + 64, w: 24, h: 24 });
    }
    for (const s of L.stations) r.push({ x: s.x * TILE, y: s.y * TILE + TILE * 0.96, w: TILE * 1.8, h: TILE * 1.02 });
    for (const d of L.remote) r.push({ x: d.x * TILE, y: d.y * TILE, w: TILE * 1.8, h: TILE * 1.4 });
    for (const d of L.desks) r.push({ x: d.x * TILE, y: d.y * TILE + TILE * 0.96, w: TILE * 1.8, h: TILE * 1.02 });
    return r;
  }, [L]);

  const props = useMemo(() => {
    const list: { key: PropKey; label: string; x: number; y: number; w: number; h: number }[] = [];
    if (L.park) {
      list.push({ key: "exit", label: "Walk back to the office", x: 0.5 * TILE, y: 0, w: TILE * 1.6, h: TILE * 1.5 });
      list.push({ key: "cart", label: "Buy a coffee ($5)", x: 7.4 * TILE, y: 2.5 * TILE, w: 1.8 * TILE, h: 1.2 * TILE });
      list.push({ key: "bench", label: "Sit and recharge", x: 3.6 * TILE, y: 4.6 * TILE, w: 1.8 * TILE, h: 0.8 * TILE });
    }
    if (L.event) {
      list.push({ key: "exit", label: "Leave the event", x: 0.5 * TILE, y: 0, w: TILE * 1.6, h: TILE * 1.5 });
      for (const a of NET_ATTENDEES) list.push({ key: a.key, label: a.label, x: a.x * TILE - 8, y: a.y * TILE, w: TILE * 1.6, h: TILE * 1.4 });
    }
    if (atHome) {
      list.push({ key: "exit", label: "Head back to the office", x: 4.8 * TILE, y: 0, w: TILE * 1.3, h: TILE * 1.5 });
      list.push({ key: "bed", label: "Take a nap at home", x: 6.2 * TILE, y: 2.1 * TILE, w: 66, h: 88 });
    }
    if (inOffice) {
      list.push({ key: "door", label: "Step outside: park, home, networking", x: (L.cols - 2) * TILE, y: 0, w: TILE * 1.6, h: TILE * 1.5 });
      const bottom = L.rows - 1.2;
      DECOR.filter((d) => g.decor.includes(d.id)).forEach((d, i) => {
        if (d.id !== "coffee" && d.id !== "whiteboard") return;
        const sp = decorSpot(i, L.cols, bottom);
        list.push({ key: d.id as "coffee" | "whiteboard", label: d.id === "coffee" ? "Grab coffee for the team" : "Brainstorm at the whiteboard", x: sp.x * TILE, y: sp.y * TILE, w: TILE, h: TILE });
      });
    }
    return list;
  }, [L, g.decor]);

  // ---- people who walk around (needs: sleepy / washroom / pantry / out for food)
  const spots = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    const bottom = L.rows - 1.2;
    DECOR.filter((d) => g.decor.includes(d.id)).forEach((d, i) => {
      const sp = decorSpot(i, L.cols, bottom);
      m[d.id] = { x: (sp.x + 0.5) * TILE, y: (sp.y + 0.95) * TILE };
    });
    return m;
  }, [L, g.decor]);
  const doorPos = { x: (L.cols - 2) * TILE + 0.8 * TILE, y: 1.75 * TILE };
  const seatOf = (x: number, y: number) => ({ x: x * TILE + 0.9 * TILE, y: y * TILE + 0.78 * TILE });
  const npcs: NpcLive[] = useMemo(() => {
    const list: NpcLive[] = [];
    const targetFor = (doing: string, seat: { x: number; y: number }): NpcTarget => {
      const spot = (id: string) => spots[id];
      if (doing === "eat") { const p = spot("pantry") ?? spot("kitchen"); if (p) return { kind: "spot", ...p }; }
      if (doing === "washroom") { const p = spot("washroom"); if (p) return { kind: "spot", ...p }; }
      if (doing === "nap") { const p = spot("lounge"); if (p) return { kind: "spot", ...p }; }
      if (doing === "coffee") { const p = spot("coffee"); if (p) return { kind: "spot", ...p }; }
      if (doing === "out_lunch" || doing === "out_wc" || doing === "eat" || doing === "washroom" || doing === "nap") return { kind: "door", ...doorPos };
      return { kind: "seat", ...seat };
    };
    if (g.founded) {
      const ps = L.stations.find((s) => s.id === "partner");
      if (ps) { const seat = seatOf(ps.x, ps.y); const doing = g.partnerVitals?.doing ?? "work"; list.push({ id: "maya", seat, doing, remote: false, target: targetFor(doing, seat) }); }
    }
    for (const d of L.desks) {
      const seat = seatOf(d.x, d.y);
      const doing = d.emp.vitals?.doing ?? "work";
      list.push({ id: d.emp.id, seat, doing, remote: false, target: targetFor(doing, seat) });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, spots, g.partnerVitals?.doing, g.team.map((e) => e.vitals?.doing ?? "w").join("|")]);
  const npcState = useRef<Record<string, { x: number; y: number; path: { x: number; y: number }[]; key: string; moving: boolean; face: number; hidden: boolean }>>({});
  const npcRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [npcMoving, setNpcMoving] = useState<Record<string, boolean>>({});

  // ---- movement
  const youSt = L.stations.find((s) => s.id === "you")!;
  const spawn = () => (L.park || L.event ? { x: 1.3 * TILE, y: 2.3 * TILE } : atHome ? { x: 5.45 * TILE, y: 1.9 * TILE } : g.founded && g.officeLevel > 0 ? { x: (L.cols - 1) * TILE, y: TILE * 1.9 } : { x: (youSt.x + 0.9) * TILE, y: (youSt.y + 2.45) * TILE });
  const pos = useRef(spawn());
  const keys = useRef<Record<string, boolean>>({});
  const foundRef = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState(1);
  const [near, setNear] = useState<Near | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const say = (t: string) => {
    setBubble(t);
    timers.current.push(setTimeout(() => setBubble(null), 2400));
  };

  // live copies for the animation loop
  const live = useRef({ solids, props, L, g, W, H, frozen: false, scale: 1, ext: { x: 0, y: 0, top: HUD_H }, npcs, doorPos });
  const scalerRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ x: 0, y: 0, init: false });

  const shape = `${g.founded}-${g.officeLevel}-${effPlace}`;
  useEffect(() => {
    pos.current = spawn();
    closeDash();
    setTalk(null);
    setAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  useEffect(() => {
    const dirKeys: Record<string, string> = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", s: "d", a: "l", d: "r", W: "u", S: "d", A: "l", D: "r" };
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      const k = dirKeys[e.key];
      if (k) { keys.current[k] = true; e.preventDefault(); }
      if ((e.key === "e" || e.key === "E" || e.key === "Enter") && !live.current.frozen) { e.preventDefault(); interactRef.current(); }
    };
    const up = (e: KeyboardEvent) => { const k = dirKeys[e.key]; if (k) keys.current[k] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);

    let raf = 0;
    let last = performance.now();
    let wasMoving = false;
    let lastFace = 1;
    let lastNear = "";
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { solids, props, L, W, H, frozen, ext } = live.current;
      const k = keys.current;
      let dx = (k.r ? 1 : 0) - (k.l ? 1 : 0);
      let dy = (k.d ? 1 : 0) - (k.u ? 1 : 0);
      if (frozen) { dx = 0; dy = 0; }
      const isMoving = dx !== 0 || dy !== 0;
      if (isMoving) {
        const len = Math.hypot(dx, dy);
        const mx = (dx / len) * SPEED * dt;
        const my = (dy / len) * SPEED * dt;
        const blocked = (x: number, y: number) =>
          x < 14 - ext.x || x > W + ext.x - 14 || y < TILE * 1.55 || y > H + ext.y - 4 || solids.some((s) => x > s.x - 8 && x < s.x + s.w + 8 && y > s.y - 4 && y < s.y + s.h + 4);
        const p = pos.current;
        if (!blocked(p.x + mx, p.y)) p.x += mx;
        if (!blocked(p.x, p.y + my)) p.y += my;
        if (dx !== 0 && dx !== lastFace) { lastFace = dx; setFacing(dx); }
      }
      if (isMoving !== wasMoving) { wasMoving = isMoving; setMoving(isMoving); }
      // ---- NPCs walk to where their needs take them
      const laneX = 0.45 * TILE;
      let movedChange = false;
      for (const n of live.current.npcs) {
        const key = `${n.target.kind}:${Math.round(n.target.x)}:${Math.round(n.target.y)}`;
        let st = npcState.current[n.id];
        if (!st) { st = { x: n.seat.x, y: n.seat.y, path: [], key: n.target.kind === "seat" ? key : "init", moving: false, face: 1, hidden: false }; npcState.current[n.id] = st; }
        if (st.key !== key) {
          st.key = key;
          if (st.hidden) { st.x = live.current.doorPos.x; st.y = live.current.doorPos.y; st.hidden = false; }
          const atSeat = Math.abs(st.y - n.seat.y) < 8 && Math.abs(st.x - n.seat.x) < 8;
          const yFrom = atSeat ? gapLineY(n.seat.y) : st.y;
          const yTo = n.target.kind === "seat" ? gapLineY(n.seat.y) : n.target.y;
          const pts = [
            { x: st.x, y: yFrom }, { x: laneX, y: yFrom }, { x: laneX, y: yTo }, { x: n.target.x, y: yTo }, { x: n.target.x, y: n.target.y },
          ];
          st.path = pts.filter((p, i) => i === 0 ? Math.hypot(p.x - st!.x, p.y - st!.y) > 1 : Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1);
        }
        let mv = false;
        if (st.path.length && !st.hidden) {
          const wp = st.path[0];
          const ddx = wp.x - st.x;
          const ddy = wp.y - st.y;
          const dd = Math.hypot(ddx, ddy);
          const step = 120 * dt;
          if (dd <= step) { st.x = wp.x; st.y = wp.y; st.path.shift(); } else { st.x += (ddx / dd) * step; st.y += (ddy / dd) * step; }
          if (Math.abs(ddx) > 0.5) st.face = ddx > 0 ? 1 : -1;
          mv = true;
          if (!st.path.length && n.target.kind === "door") st.hidden = true;
        }
        if (mv !== st.moving) { st.moving = mv; movedChange = true; }
        const el = npcRefs.current[n.id];
        if (el) {
          el.style.transform = `translate(${st.x - 26}px, ${st.y - 52}px)`;
          el.style.visibility = st.hidden ? "hidden" : "visible";
        }
      }
      if (movedChange) {
        const snap: Record<string, boolean> = {};
        for (const k of Object.keys(npcState.current)) snap[k] = npcState.current[k].moving;
        setNpcMoving(snap);
      }
      const stage = stageRef.current;
      const sc = scalerRef.current;
      if (stage && sc) {
        const s = live.current.scale;
        const vw = stage.clientWidth;
        const vh = stage.clientHeight;
        const rw = (W + ext.x * 2) * s;
        const rh = (ext.top + H + ext.y) * s;
        const tx = rw <= vw ? (vw - rw) / 2 : -Math.max(0, Math.min(rw - vw, (pos.current.x + ext.x) * s - vw / 2));
        const ty = rh <= vh ? 0 : -Math.max(0, Math.min(rh - vh, (pos.current.y + ext.top) * s - vh / 2));
        const cam = camRef.current;
        if (!cam.init) { cam.x = tx; cam.y = ty; cam.init = true; } else { cam.x += (tx - cam.x) * Math.min(1, dt * 7); cam.y += (ty - cam.y) * Math.min(1, dt * 7); }
        sc.style.transform = `translate(${cam.x.toFixed(1)}px, ${cam.y.toFixed(1)}px)`;
      }
      const el = foundRef.current;
      if (el) el.style.transform = `translate(${pos.current.x - 26}px, ${pos.current.y - 60}px)`;

      // nearest interactable
      const { x, y } = pos.current;
      let best: Near | null = null;
      let bd = 46;
      for (const s of L.stations) {
        const d = dist(x, y, s.x * TILE, s.y * TILE + TILE * 0.96, TILE * 1.8, TILE * 1.02);
        if (d < bd) { bd = d; best = { kind: "station", id: s.id, label: (s.id === "you" && !live.current.g.founded ? "Your laptop" : s.label) }; }
      }
      for (const r0 of L.remote) {
        const d = dist(x, y, r0.x * TILE, r0.y * TILE, TILE * 1.8, TILE * 1.4);
        if (d < bd - 8) { bd = d - 8; best = { kind: "person", id: r0.emp.id, label: r0.emp.name.split(" ")[0] }; }
      }
      for (const d0 of L.desks) {
        const ns = npcState.current[d0.emp.id];
        if (!ns || ns.hidden) continue;
        const d = Math.hypot(x - ns.x, y - ns.y) - 14;
        if (d < bd - 8) { bd = d - 8; best = { kind: "person", id: d0.emp.id, label: d0.emp.name.split(" ")[0] }; }
      }
      for (const p of props) {
        const d = dist(x, y, p.x, p.y, p.w, p.h);
        if (d < bd) { bd = d; best = { kind: "prop", key: p.key, label: p.label }; }
      }
      // close the open dashboard as soon as you step away from its desk
      const openId = useUI.getState().dash;
      if (openId) {
        const st = L.stations.find((s0) => s0.id === openId);
        const away = !st || dist(x, y, st.x * TILE, st.y * TILE + TILE * 0.96, TILE * 1.8, TILE * 1.02) > 30;
        if (away) useUI.getState().closeDash();
      }
      const sig = best ? `${best.kind}:${"id" in best ? best.id : best.key}` : "";
      if (sig !== lastNear) { lastNear = sig; setNear(best); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // keep store in sync with which station you're standing at; close dashboards when you walk away
  useEffect(() => {
    const st = near?.kind === "station" ? near.id : null;
    setAt(st);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near]);

  const interact = () => {
    const n = near;
    if (!n) return;
    if (n.kind === "station") openDash(n.id);
    else if (n.kind === "person") setTalk(n.id);
    else if (n.key === "door") setGoOut(true);
    else if (n.key === "exit") setPlace("office");
    else {
      const before = (g.cooldowns[n.key] ?? 0) > g.day;
      act((s) => sceneAction(s, n.key as Exclude<PropKey, "door" | "exit">));
      if (!before) say(n.key === "coffee" ? "Coffee time ☕" : n.key === "whiteboard" ? "Big ideas! 📝" : n.key.startsWith("net_") ? "Great chat! 🤝" : n.key === "cart" ? "Fresh coffee ☕✨" : n.key === "bench" ? "Ahh, fresh air 🌿" : "Zzz… 😴");
    }
  };
  const interactRef = useRef(interact);
  interactRef.current = interact;

  // partner walks in during the founding scene
  const partnerVisiting = !g.founded && (g.event?.id === "partner_offer" || g.event?.id === "intro");
  const [partnerIn, setPartnerIn] = useState(false);
  useEffect(() => {
    if (!partnerVisiting) { setPartnerIn(false); return; }
    const t = setTimeout(() => setPartnerIn(true), 80);
    return () => clearTimeout(t);
  }, [partnerVisiting]);
  const [partnerWalking, setPartnerWalking] = useState(false);
  useEffect(() => {
    if (!partnerIn) return;
    setPartnerWalking(true);
    const t = setTimeout(() => setPartnerWalking(false), 2600);
    return () => clearTimeout(t);
  }, [partnerIn]);

  const press = (k: "u" | "d" | "l" | "r", on: boolean) => { keys.current[k] = on; };

  // game camera: fixed zoom that follows you; small rooms are centred
  live.current = { solids, props, L, g, W, H, frozen: !!g.event || goOut, scale: 1, ext, npcs, doorPos };
  const stageRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  live.current.scale = scale;
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const target = Math.max(1, Math.min(1.7, vh / 560));
      const fitS = Math.min(vw / W, (vh - 120) / H);
      const sc = fitS >= target ? Math.min(fitS, 1.8) : target;
      setScale(sc);
      setExt({
        x: Math.max(0, (vw / sc - W) / 2),
        y: Math.max(0, vh / sc - H - HUD_H / sc),
        top: HUD_H / sc,
      });
    };
    fit();
    camRef.current.init = false;
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [W, H]);
  const title = L.event ? "Startup Meetup" : L.park ? "City Park" : L.home ? (atHome ? "Home" : "Your bedroom") : office.name;
  const blurb = L.event ? "Mingle: press, investors, recruiters and mentors." : L.park ? "Fresh air, a bench and a coffee cart." : L.home ? (atHome ? "Your own bed. The company can wait an hour." : "A bed, a desk, a laptop and a dream.") : office.blurb;
  const bottom = L.rows - 1.2;
  const prompt = near ? (near.kind === "station" ? `Open ${near.label} dashboard` : near.kind === "person" ? `Talk to ${near.label}` : near.label) : null;
  const showPrompt = !!near && !(near.kind === "station" && dash === near.id);

  const Wt = W + ext.x * 2;
  const Ht = ext.top + H + ext.y;
  const lvlKey = L.event ? "event" : L.park ? "park" : L.home ? "home" : `lvl${g.officeLevel}`;
  const tone = WALL_TONE[lvlKey] ?? (L.event ? (["#4b3d8f", "#2f2760"] as [string, string]) : WALL_TONE.home);
  const wallH = ext.top + TILE * 1.5;
  // window positions in content coordinates (skip the logo and the door)
  const windows: number[] = [];
  for (let x = -ext.x + 24; x < W + ext.x - 120; x += 150) {
    const cx = x + ext.x; // wall-space x
    const overlapsSign = inOffice && x + 118 > TILE - 8 && x < TILE * 4.4;
    const overlapsDoor = inOffice && x + 118 > (L.cols - 2) * TILE - 12 && x < (L.cols - 0.3) * TILE;
    if (!overlapsSign && !overlapsDoor) windows.push(cx);
  }
  const homeWindows = [ext.x + 2.4 * TILE];
  // department floor zones (come from the layout)
  const zones = L.zones.map((z) => {
    const color = z.id === "mgmt" ? ZONE_COLOR.you : SHIRTS[ROLE_SHIRT[STATION_INFO[z.id].role!]];
    return { ...z, color };
  });
  const sideItems: { left: boolean; y: number; dx: number; w: number; h: number; node: React.ReactNode }[] = [];
  if (inOffice) {
    const kinds = [
      { w: 96, h: 48, node: <Sofa /> },
      { w: 48, h: 68, node: <Vending /> },
      { w: 44, h: 31, node: <CoffeeTable /> },
      { w: 40, h: 58, node: <Cabinet /> },
      { w: 64, h: 62, node: <Bookshelf /> },
      { w: 44, h: 44, node: <Plant size={44} /> },
    ];
    for (let y = 2.9 * TILE, i = 0; y < H - 1.6 * TILE; y += 1.55 * TILE, i++) {
      const k = kinds[i % kinds.length];
      const k2 = kinds[(i + 3) % kinds.length];
      sideItems.push({ left: true, y, dx: 0, ...k });
      sideItems.push({ left: false, y: y + 0.4 * TILE, dx: 0, ...k2 });
    }
  }
  const accentFor = (role: keyof typeof ROLE_SHIRT) => SHIRTS[ROLE_SHIRT[role]];

  return (
    <section className="stage" ref={stageRef} aria-label="Office">
      <SvgDefs />
      <div className="room-label" title={blurb}>
        <b>{L.event ? "🤝" : L.park ? "🌳" : L.home ? (atHome ? "🏠" : "🛏️") : office.emoji} {title}</b>
        {(g.refreshUntil ?? 0) >= g.day && <i className="refreshed">✨ Refreshed · team works faster</i>}
        <span>{blurb}</span>
      </div>
      <div className="scaler" ref={scalerRef} style={{ width: Wt * scale, height: Ht * scale }}>
        <div className={`office ${L.event ? "event" : L.park ? "park" : L.home ? "home" : `lvl${g.officeLevel}`}`} style={{ width: Wt, height: Ht, transform: `scale(${scale})`, transformOrigin: "top left", ["--s" as string]: scale } as React.CSSProperties}>
          <div className={`floor f-${lvlKey}`} />
          {L.park ? <ParkSky width={Wt} height={wallH} /> : <Wall width={Wt} height={wallH} windows={L.home ? homeWindows : L.event ? [] : windows} tone={tone} home={L.home} />}
          <div className="wall-shadow" style={{ top: wallH, width: Wt }} />

          <div className="content" style={{ left: ext.x, top: ext.top, width: W, height: H }}>
            {inOffice && zones.map((z) => (
              <div key={z.id} className="zone" style={{ left: z.full ? -ext.x + 10 : z.x, top: z.y, width: z.full ? Wt - 20 : z.w, height: z.h, ["--zc" as string]: z.color } as React.CSSProperties}>
                <span style={{ left: z.full ? ext.x + 0.45 * TILE : 12 }}>{z.label}</span>
              </div>
            ))}
            {inOffice && (
              <div className="prop door" style={{ left: (L.cols - 2) * TILE, top: -ext.top + wallH - TILE * 1.5, width: TILE * 1.6, height: TILE * 1.5 }}>
                <GlassDoor />
                <small>Go out · park · home · meetup</small>
              </div>
            )}
            {inOffice && <div className="sign" style={{ left: TILE, top: 12 }}><i />{g.company}</div>}
            {L.home && (
              <>
                <div className="rug" style={{ left: 1.0 * TILE, top: 2.2 * TILE, width: 3.8 * TILE, height: 3.3 * TILE }} />
                {atHome && (
                  <div className={`prop door ${near?.kind === "prop" && near.key === "exit" ? "near" : ""}`} style={{ left: 4.8 * TILE, top: 0, width: TILE * 1.3, height: TILE * 1.5 }}>
                    <GlassDoor />
                    <small>Office</small>
                  </div>
                )}
                <span className={`prop decor still ${near?.kind === "prop" && near.key === "bed" ? "near" : ""} ${(g.cooldowns.bed ?? 0) > g.day ? "cd" : ""}`} style={{ left: 6.2 * TILE, top: 2.1 * TILE, width: 66, height: 88 }}><Bed /></span>
                <span className="prop decor still" style={{ left: 7.5 * TILE, top: 1.0 * TILE, width: 64, height: 62 }}><Bookshelf /></span>
                <span className="prop decor still" style={{ left: 0.2 * TILE, top: 1.25 * TILE, width: 26, height: 60 }}><Lamp /></span>
                <span className="prop decor still" style={{ left: 6.3 * TILE, top: 5.2 * TILE, width: 40, height: 40 }}><Plant size={40} /></span>
              </>
            )}
            {inOffice && (
              <>
                <span className="prop decor still" style={{ left: -ext.x + 8, top: 1.45 * TILE, width: 44, height: 44 }}><Plant size={44} /></span>
                <span className="prop decor still" style={{ left: W + ext.x - 52, top: 1.45 * TILE, width: 44, height: 44 }}><Plant size={44} /></span>
                {ext.x >= 60 && sideItems.map((it, i) => (
                  <span key={i} className="prop decor still" style={{ left: it.left ? -ext.x + 16 + it.dx : W + ext.x - 16 - it.dx - it.w, top: it.y, width: it.w, height: it.h }}>{it.node}</span>
                ))}
              </>
            )}

            {L.empty.map((e, i) => (
              <div key={"g" + i} className="deskwrap ghost" style={{ left: e.x * TILE, top: e.y * TILE, width: TILE * 1.8, height: TILE * 2 }}>
                <Desk accent="#94a3b8" flavor={i % 3} />
              </div>
            ))}

            {L.event && (
              <>
                <div className="string-lights" style={{ left: -ext.x, top: -ext.top + wallH - 14, width: Wt }}><StringLights width={Wt} /></div>
                <EventBanner width={W} />
                <div className="prop door" style={{ left: 0.5 * TILE, top: 0, width: TILE * 1.6, height: TILE * 1.5 }}>
                  <GlassDoor />
                  <small>Exit</small>
                </div>
                <span className="prop decor still" style={{ left: 8.1 * TILE, top: 5.7 * TILE, width: 132, height: 60 }}><Buffet /></span>
                {NET_ATTENDEES.map((a) => {
                  const done = !!g.flags[a.key];
                  const isNear = near?.kind === "prop" && near.key === a.key;
                  return (
                    <div key={a.key}>
                      <span className="prop decor still" style={{ left: (a.x + 0.95) * TILE, top: (a.y + 0.25) * TILE, width: 46, height: 58 }}><StandTable /></span>
                      <div className={`attendee ${isNear ? "near" : ""} ${done ? "done" : ""}`} style={{ left: a.x * TILE - 5, top: a.y * TILE - 6 }}>
                        {done && <span className="tick">✅</span>}
                        <Avatar look={lookFor(a.name + a.job, a.role)} role={a.role} size={38} />
                        <span className="nm">{a.emoji} {a.name}</span>
                        <span className="role">{a.job}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {L.park && (
              <>
                <ParkGround W={W} Wt={Wt} Ht={Ht} ext={ext} />
                {PARK_TREES.map(([tx, ty], i) => (
                  <span key={"ts" + i} className="tree-shadow" style={{ left: tx * TILE - 6, top: ty * TILE + 62, width: 86, height: 26 }} />
                ))}
                <span className="prop decor still" style={{ left: 9.45 * TILE, top: 1.55 * TILE, width: 62, height: 74 }}><CafeTable /></span>
                <span className="prop decor still" style={{ left: 3.2 * TILE, top: 2.55 * TILE, width: 26, height: 72 }}><LampPost /></span>
                <span className="prop decor still" style={{ left: 11.3 * TILE, top: 2.4 * TILE, width: 26, height: 72 }}><LampPost /></span>
                <span className="prop decor still" style={{ left: 7.2 * TILE, top: 4.7 * TILE, width: 26, height: 72 }}><LampPost /></span>
                <ParkAmbient W={W} H={H} />
                <div className="prop door" style={{ left: 0.5 * TILE, top: 0, width: TILE * 1.6, height: TILE * 1.5 }}>
                  <Gate />
                  <small>Office</small>
                </div>
                <span className={`prop decor still ${near?.kind === "prop" && near.key === "cart" ? "near" : ""} ${(g.cooldowns.cart ?? 0) > g.day ? "cd" : ""}`} style={{ left: 7.3 * TILE, top: 1.9 * TILE, width: 96, height: 84 }}><CoffeeCart /></span>
                <span className={`prop decor still ${near?.kind === "prop" && near.key === "bench" ? "near" : ""} ${(g.cooldowns.bench ?? 0) > g.day ? "cd" : ""}`} style={{ left: 3.5 * TILE, top: 4.35 * TILE, width: 94, height: 48 }}><Bench /></span>
                {PARK_TREES.map(([tx, ty], i) => (
                  <span key={i} className="prop decor still" style={{ left: tx * TILE, top: ty * TILE, width: 72, height: 90 }}><Tree tone={i} /></span>
                ))}
              </>
            )}

            {L.park && <div className="park-rays" style={{ left: -ext.x, top: -ext.top, width: Wt, height: Ht }} />}

            {L.stations.map((st) => {
              const you = st.id === "you";
              const partner = st.id === "partner";
              const role = !you && !partner ? STATION_INFO[st.id].role : undefined;
              const staffN = role ? g.team.filter((e) => e.role === role).length : 1;
              const accent = ZONE_COLOR[st.id] ?? accentFor(role!);
              return (
                <div key={st.id} className={`deskwrap ${at === st.id ? "here" : ""} ${you ? "mine" : ""}`} style={{ left: st.x * TILE, top: st.y * TILE, width: TILE * 1.8, height: TILE * 2 }}>
                  <Desk accent={accent} big flavor={st.id.length % 3} />
                  <span className="mon">{st.emoji}</span>
                  <span className="stlabel" style={{ ["--ac" as string]: accent } as React.CSSProperties}>{you && !g.founded ? "Your desk" : st.label}{staffN === 0 ? " · empty" : ""}</span>
                </div>
              );
            })}

            {L.desks.map(({ x, y, emp }) => (
              <div key={emp.id} className="deskwrap" style={{ left: x * TILE, top: y * TILE, width: TILE * 1.8, height: TILE * 2 }}>
                <Desk accent={accentFor(emp.role)} flavor={emp.id.length % 3} />
              </div>
            ))}

            {L.remote.length > 0 && (
              <div className="remote-label" style={{ left: TILE, top: (L.remote[0].y - 0.55) * TILE }}>📺 Remote team · video wall</div>
            )}
            {L.remote.map(({ x, y, emp }) => (
              <div key={emp.id} className={`remote-tile ${near?.kind === "person" && near.id === emp.id ? "near" : ""}`} style={{ left: x * TILE, top: y * TILE, width: TILE * 1.8, height: TILE * 1.4 }}>
                <i className="live" />
                <span className="emo" title={emotionOf(emp.vitals, emp.morale).label}>{emotionOf(emp.vitals, emp.morale).emoji}</span>
                <Avatar look={lookFor(emp.id + emp.name, emp.role)} role={emp.role} size={32} typing />
                <span className="nm">🏠 {emp.name.split(" ")[0]}</span>
              </div>
            ))}

            {inOffice &&
              DECOR.filter((d) => g.decor.includes(d.id)).map((d, i) => {
                const sp = decorSpot(i, L.cols, bottom);
                const x = sp.x;
                const key = d.id === "coffee" ? "coffee" : d.id === "whiteboard" ? "whiteboard" : null;
                const onCd = key ? (g.cooldowns[key] ?? 0) > g.day : false;
                return (
                  <span key={d.id} className={`prop decor still ${onCd ? "cd" : ""} ${near?.kind === "prop" && near.key === key ? "near" : ""}`} style={{ left: x * TILE, top: sp.y * TILE }} title={d.name}>
                    <DecorArt id={d.id} />
                  </span>
                );
              })}

            {npcs.map((n) => {
              const isMaya = n.id === "maya";
              const emp = isMaya ? null : g.team.find((e) => e.id === n.id);
              if (!isMaya && !emp) return null;
              const emo = isMaya ? emotionOf(g.partnerVitals, 75) : emotionOf(emp!.vitals, emp!.morale);
              const mood = emp ? (emp.morale > 55 ? "g" : emp.morale > 30 ? "w" : "b") : "g";
              const mv = !!npcMoving[n.id];
              return (
                <div key={n.id} ref={(el) => { npcRefs.current[n.id] = el; }} className={`npc m${mood} ${near?.kind === "person" && near.id === n.id ? "near" : ""}`} style={{ transform: `translate(${n.seat.x - 26}px, ${n.seat.y - 52}px)` }}>
                  <span className="emo" title={emo.label}>{emo.emoji}</span>
                  {isMaya ? <Avatar look={PARTNER_LOOK} role="partner" size={mv ? 38 : 34} legs={mv} walking={mv} typing={!mv} /> : <Avatar look={lookFor(emp!.id + emp!.name, emp!.role)} role={emp!.role} size={mv ? 38 : 34} legs={mv} walking={mv} typing={!mv} />}
                  <span className="nm">{isMaya ? PARTNER.first : emp!.name.split(" ")[0]}</span>
                </div>
              );
            })}

            {partnerVisiting && (
              <div className="walker" style={{ transform: partnerIn ? `translate(${4.3 * TILE}px, ${3.6 * TILE}px)` : `translate(${8 * TILE}px, ${5.5 * TILE}px)` }}>
                <Avatar look={PARTNER_LOOK} role="partner" size={40} legs walking={partnerWalking} flip />
                <span className="nm">{PARTNER.first}</span>
              </div>
            )}

            <div className="founder" ref={foundRef} style={{ transform: `translate(${pos.current.x - 26}px, ${pos.current.y - 60}px)` }}>
              {bubble && <div className="bubble">{bubble}</div>}
              {showPrompt && prompt && (
                <button className="open-dash" onClick={interact}>
                  {near!.kind === "station" ? "🖥️ " : near!.kind === "person" ? "💬 " : "✋ "}{prompt} <kbd>E</kbd>
                </button>
              )}
              <Avatar look={g.look} role="you" size={40} legs walking={moving} flip={facing < 0} />
              <span className="nm">YOU</span>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-row">
        <p className="dim small tip">
          Move with <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>. Walk up to a desk and press <kbd>E</kbd> (or the button) to open its dashboard.
        </p>
        <div className="dpad" aria-label="On-screen movement pad">
          {([["u", "▲"], ["l", "◀"], ["d", "▼"], ["r", "▶"]] as const).map(([k, l]) => (
            <button key={k} className={`dp-${k}`} onPointerDown={(e) => { e.preventDefault(); press(k, true); }} onPointerUp={() => press(k, false)} onPointerLeave={() => press(k, false)} onPointerCancel={() => press(k, false)} aria-label={`Move ${k}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
