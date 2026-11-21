"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DECOR, OFFICES, PARTNER, ROLES } from "@/game/data";
import { sceneAction } from "@/game/engine";
import { computeLayout, STATION_INFO, TILE } from "@/game/layout";
import type { StationId } from "@/game/types";
import { useUI } from "@/store/useUI";
import Avatar, { lookFor, PARTNER_LOOK } from "./Avatar";
import { useAct, useG } from "./ui";

type Near =
  | { kind: "station"; id: StationId; label: string }
  | { kind: "person"; id: string; label: string }
  | { kind: "prop"; key: "coffee" | "whiteboard" | "door"; label: string };

const SPEED = 190; // px per second
const dist = (px: number, py: number, x: number, y: number, w: number, h: number) => {
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
};

export default function Scene() {
  const g = useG();
  const act = useAct();
  const { at, dash, setAt, openDash, closeDash, setTalk } = useUI();
  const L = useMemo(() => computeLayout(g), [g]);
  const office = OFFICES[g.officeLevel];
  const W = L.cols * TILE;
  const H = L.rows * TILE;

  // ---- static geometry
  const solids = useMemo(() => {
    const r: { x: number; y: number; w: number; h: number }[] = [];
    for (const s of L.stations) r.push({ x: s.x * TILE, y: s.y * TILE + TILE * 0.96, w: TILE * 1.8, h: TILE * 1.02 });
    for (const d of L.remote) r.push({ x: d.x * TILE, y: d.y * TILE, w: TILE * 1.8, h: TILE * 1.4 });
    for (const d of L.desks) r.push({ x: d.x * TILE, y: d.y * TILE + TILE * 0.96, w: TILE * 1.8, h: TILE * 1.02 });
    return r;
  }, [L]);

  const props = useMemo(() => {
    const list: { key: "coffee" | "whiteboard" | "door"; label: string; x: number; y: number; w: number; h: number }[] = [];
    if (!L.home) {
      list.push({ key: "door", label: "Go out networking ($100)", x: (L.cols - 2) * TILE, y: 0, w: TILE * 1.6, h: TILE * 1.5 });
      const bottom = L.rows - 1.2;
      for (const d of DECOR) {
        if (!g.decor.includes(d.id) || (d.id !== "coffee" && d.id !== "whiteboard")) continue;
        list.push({ key: d.id as "coffee" | "whiteboard", label: d.id === "coffee" ? "Grab coffee for the team" : "Brainstorm at the whiteboard", x: (0.4 + d.pos[0] * 1.9) * TILE, y: bottom * TILE, w: TILE, h: TILE });
      }
    }
    return list;
  }, [L, g.decor]);

  // ---- movement
  const youSt = L.stations.find((s) => s.id === "you")!;
  const spawn = () => (g.founded && g.officeLevel > 0 ? { x: (L.cols - 1) * TILE, y: TILE * 1.9 } : { x: (youSt.x + 0.9) * TILE, y: (youSt.y + 2.45) * TILE });
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
  const live = useRef({ solids, props, L, g, W, H, frozen: false, scale: 1 });
  const scalerRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ x: 0, y: 0, init: false });

  const shape = `${g.founded}-${g.officeLevel}`;
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
      const { solids, props, L, W, H, frozen } = live.current;
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
          x < 14 || x > W - 14 || y < TILE * 1.55 || y > H - 4 || solids.some((s) => x > s.x - 8 && x < s.x + s.w + 8 && y > s.y - 4 && y < s.y + s.h + 4);
        const p = pos.current;
        if (!blocked(p.x + mx, p.y)) p.x += mx;
        if (!blocked(p.x, p.y + my)) p.y += my;
        if (dx !== 0 && dx !== lastFace) { lastFace = dx; setFacing(dx); }
      }
      if (isMoving !== wasMoving) { wasMoving = isMoving; setMoving(isMoving); }
      const stage = stageRef.current;
      const sc = scalerRef.current;
      if (stage && sc) {
        const s = live.current.scale;
        const vw = stage.clientWidth;
        const availH = stage.clientHeight - 64 - 70;
        const rw = W * s;
        const rh = H * s;
        const tx = rw <= vw ? (vw - rw) / 2 : -Math.max(0, Math.min(rw - vw, pos.current.x * s - vw / 2));
        const ty = rh <= availH ? 64 + (availH - rh) / 2 : 64 - Math.max(0, Math.min(rh - availH, pos.current.y * s - availH / 2));
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
        const d = dist(x, y, d0.x * TILE, d0.y * TILE + TILE * 0.96, TILE * 1.8, TILE * 1.02);
        if (d < bd - 8) { bd = d - 8; best = { kind: "person", id: d0.emp.id, label: d0.emp.name.split(" ")[0] }; }
      }
      for (const p of props) {
        const d = dist(x, y, p.x, p.y, p.w, p.h);
        if (d < bd) { bd = d; best = { kind: "prop", key: p.key, label: p.label }; }
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
    else {
      act((s) => sceneAction(s, n.key));
      say(n.key === "coffee" ? "Coffee time ☕" : n.key === "whiteboard" ? "Big ideas! 📝" : "Networking! 🤝");
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
  live.current = { solids, props, L, g, W, H, frozen: !!g.event, scale: 1 };
  const stageRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  live.current.scale = scale;
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const target = Math.max(0.9, Math.min(1.5, vh / 640));
      const fitS = Math.min((vw - 24) / W, (vh - 150) / H);
      setScale(fitS >= target ? Math.min(fitS, 1.9) : target);
    };
    fit();
    camRef.current.init = false;
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [W, H]);
  const title = L.home ? "Your bedroom" : office.name;
  const blurb = L.home ? "A bed, a desk, a laptop and a dream." : office.blurb;
  const bottom = L.rows - 1.2;
  const prompt = near ? (near.kind === "station" ? `Open ${near.label} dashboard` : near.kind === "person" ? `Talk to ${near.label}` : near.label) : null;
  const showPrompt = !!near && !(near.kind === "station" && dash === near.id);

  return (
    <section className="stage" ref={stageRef} aria-label="Office">
      <div className="room-label">
        <b>{L.home ? "🛏️" : office.emoji} {title}</b>
        <span>{blurb}</span>
      </div>
      <div className="scaler" ref={scalerRef} style={{ width: W * scale, height: H * scale }}>
        <div className={`office ${L.home ? "home" : `lvl${g.officeLevel}`}`} style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", ["--s" as string]: scale } as React.CSSProperties}>
          {!L.home && (
            <div className="prop door" style={{ left: (L.cols - 2) * TILE, top: 0, width: TILE * 1.6, height: TILE * 1.5 }}>
              <span>🚪</span>
              <small>Go out</small>
            </div>
          )}
          {!L.home && <div className="sign" style={{ left: TILE, top: 8 }}>{g.company}</div>}
          {L.home && (
            <>
              <span className="prop decor still" style={{ left: 6.2 * TILE, top: 2.4 * TILE, fontSize: 52 }}>🛏️</span>
              <span className="prop decor still" style={{ left: 2.6 * TILE, top: 0.3 * TILE, fontSize: 40 }}>🪟</span>
              <span className="prop decor still" style={{ left: 7.2 * TILE, top: 0.3 * TILE, fontSize: 32 }}>🌙</span>
            </>
          )}

          {L.stations.map((st) => {
            const you = st.id === "you";
            const partner = st.id === "partner";
            const staffN = !you && !partner ? g.team.filter((e) => e.role === STATION_INFO[st.id].role).length : 1;
            return (
              <div key={st.id} className="deskwrap" style={{ left: st.x * TILE, top: st.y * TILE, width: TILE * 1.8, height: TILE * 2 }}>
                <div className={`desk station ${at === st.id ? "here" : ""} ${you ? "mine" : ""}`}>
                  <span className="mon">{st.emoji}</span>
                  <span className="stlabel">{you && !g.founded ? "Your desk" : st.label}{staffN === 0 ? " · empty" : ""}</span>
                </div>
                {partner && g.founded && (
                  <div className="seated partner">
                    <Avatar look={PARTNER_LOOK} role="partner" size={34} typing />
                    <span className="nm">{PARTNER.first}</span>
                  </div>
                )}
              </div>
            );
          })}

          {L.desks.map(({ x, y, emp }) => (
            <div key={emp.id} className="deskwrap" style={{ left: x * TILE, top: y * TILE, width: TILE * 1.8, height: TILE * 2 }}>
              <div className="desk"><span className="mon">🖥️</span></div>
              <div className={`seated person m${emp.morale > 55 ? "g" : emp.morale > 30 ? "w" : "b"} ${near?.kind === "person" && near.id === emp.id ? "near" : ""}`}>
                <Avatar look={lookFor(emp.id + emp.name, emp.role)} role={emp.role} size={34} typing />
                <span className="nm">{emp.name.split(" ")[0]}</span>
              </div>
            </div>
          ))}

          {L.remote.length > 0 && (
            <div className="remote-label" style={{ left: TILE, top: (L.remote[0].y - 0.55) * TILE }}>📺 Remote team (video wall)</div>
          )}
          {L.remote.map(({ x, y, emp }) => (
            <div key={emp.id} className={`remote-tile ${near?.kind === "person" && near.id === emp.id ? "near" : ""}`} style={{ left: x * TILE, top: y * TILE, width: TILE * 1.8, height: TILE * 1.4 }}>
              <Avatar look={lookFor(emp.id + emp.name, emp.role)} role={emp.role} size={32} typing />
              <span className="nm">🏠 {emp.name.split(" ")[0]}</span>
            </div>
          ))}

          {!L.home &&
            DECOR.filter((d) => g.decor.includes(d.id)).map((d) => {
              const x = 0.4 + d.pos[0] * 1.9;
              const key = d.id === "coffee" ? "coffee" : d.id === "whiteboard" ? "whiteboard" : null;
              const onCd = key ? (g.cooldowns[key] ?? 0) > g.day : false;
              return (
                <span key={d.id} className={`prop decor still ${onCd ? "cd" : ""} ${near?.kind === "prop" && near.key === key ? "near" : ""}`} style={{ left: x * TILE, top: bottom * TILE }} title={d.name}>
                  {d.emoji}
                </span>
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
            <span className="nm">{g.founder.split(" ")[0]}</span>
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
