"use client";
// Hand-drawn SVG furniture for the office scene. Everything is crisp at any zoom.

/** Shared gradients. Render once, anywhere in the page. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="gDeskTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde3ec" />
        </linearGradient>
        <linearGradient id="gOak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcae72" />
          <stop offset="1" stopColor="#b98748" />
        </linearGradient>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16224d" />
          <stop offset=".55" stopColor="#5b4f9e" />
          <stop offset="1" stopColor="#f2a068" />
        </linearGradient>
        <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3ff" stopOpacity=".55" />
          <stop offset="1" stopColor="#4a78b8" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id="gChair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a465e" />
          <stop offset="1" stopColor="#1d2332" />
        </linearGradient>
        <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f3f7" />
          <stop offset="1" stopColor="#b9c0cd" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ScreenUI({ x, y, w, h, accent }: { x: number; y: number; w: number; h: number; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.2" fill="#0b1224" />
      <rect x={x} y={y} width={w} height={h * 0.16} rx="1" fill={accent} opacity=".95" />
      <rect x={x + w * 0.08} y={y + h * 0.3} width={w * 0.4} height={h * 0.09} rx=".6" fill={accent} opacity=".85" />
      <rect x={x + w * 0.08} y={y + h * 0.48} width={w * 0.6} height={h * 0.07} rx=".6" fill="#fff" opacity=".35" />
      <rect x={x + w * 0.08} y={y + h * 0.62} width={w * 0.3} height={h * 0.07} rx=".6" fill="#fff" opacity=".25" />
      <rect x={x + w * 0.62} y={y + h * 0.62} width={w * 0.07} height={h * 0.25} fill={accent} opacity=".6" />
      <rect x={x + w * 0.72} y={y + h * 0.5} width={w * 0.07} height={h * 0.37} fill={accent} opacity=".8" />
      <rect x={x + w * 0.82} y={y + h * 0.38} width={w * 0.07} height={h * 0.49} fill={accent} />
    </g>
  );
}

/** Modern workstation: white desk with oak edge, monitor, open laptop, chair behind. 94x104 */
export function Desk({ accent, big = false, flavor = 0 }: { accent: string; big?: boolean; flavor?: number }) {
  return (
    <svg className="wsdesk" viewBox="0 0 94 104" width="100%" height="100%" aria-hidden>
      {/* chair */}
      <rect x="26" y="22" width="42" height="36" rx="13" fill="url(#gChair)" />
      <rect x="31" y="26" width="32" height="14" rx="7" fill="#4b5a78" opacity=".55" />
      {/* desk */}
      <rect x="6" y="59" width="84" height="45" rx="8" fill="rgba(0,0,0,.3)" />
      <rect x="9" y="96" width="5" height="8" rx="1.5" fill="#262c3b" />
      <rect x="80" y="96" width="5" height="8" rx="1.5" fill="#262c3b" />
      <rect x="4" y="54" width="86" height="44" rx="6" fill="url(#gDeskTop)" stroke="rgba(15,23,42,.22)" strokeWidth=".8" />
      <rect x="4" y="92" width="86" height="6" rx="3" fill="url(#gOak)" />
      <rect x="4" y="54" width="86" height="2" rx="1" fill="#fff" opacity=".9" />
      {/* screen glow on the desk */}
      <ellipse cx="47" cy="84" rx="38" ry="12" fill={accent} opacity=".13" />
      {/* monitor */}
      <rect x="8" y="55" width={big ? 40 : 38} height="27" rx="3.2" fill="#0f1218" />
      <ScreenUI x={10} y={57} w={big ? 36 : 34} h={21} accent={accent} />
      <rect x="25" y="82" width="5" height="5" fill="#9aa3b2" />
      <rect x="19" y="86" width="17" height="2.6" rx="1.3" fill="url(#gSteel)" />
      {/* laptop */}
      <rect x="51" y="62" width="34" height="22" rx="2.6" fill="#1b2030" stroke="#c9cfda" strokeWidth="1" />
      <ScreenUI x={53} y={64} w={30} h={17} accent={accent} />
      <path d="M49.5 92 L86.5 92 L83.5 83.2 L52.5 83.2 Z" fill="url(#gSteel)" stroke="rgba(15,23,42,.25)" strokeWidth=".6" />
      <rect x="62" y="88" width="14" height="2.6" rx="1" fill="#aeb6c4" />
      {/* desk props */}
      {flavor === 0 && (
        <g>
          <circle cx="13" cy="92" r="3.6" fill="#fff" stroke="#c3cad6" strokeWidth=".8" />
          <circle cx="13" cy="92" r="2.2" fill="#6b4226" />
        </g>
      )}
      {flavor === 1 && (
        <g>
          <rect x="9" y="90" width="6" height="5" rx="1.5" fill="#e9ecf1" stroke="#c3cad6" strokeWidth=".6" />
          <circle cx="12" cy="88" r="3.4" fill="#34b36b" />
          <circle cx="14.6" cy="86.6" r="2.4" fill="#4fcf86" />
        </g>
      )}
      {flavor === 2 && (
        <g>
          <rect x="8" y="88" width="10" height="7" rx="1" fill={accent} opacity=".85" />
          <rect x="8" y="88" width="2" height="7" fill="#000" opacity=".15" />
        </g>
      )}
      <rect x="41" y="91" width="4" height="4.5" rx="2" fill="#e8ebf1" stroke="#b4bcc9" strokeWidth=".5" />
    </svg>
  );
}

export function Plant({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" aria-hidden>
      <ellipse cx="26" cy="47" rx="14" ry="4" fill="rgba(0,0,0,.28)" />
      <path d="M26 38 C14 36 8 24 12 12 C22 14 28 24 26 38 Z" fill="#2f9e5f" />
      <path d="M26 38 C38 36 44 24 40 12 C30 14 24 24 26 38 Z" fill="#3fbf77" />
      <path d="M26 36 C20 28 22 14 26 6 C30 14 32 28 26 36 Z" fill="#52d68a" />
      <path d="M15 38 H37 L34 49 H18 Z" fill="#f3f4f7" stroke="#c9ced8" strokeWidth="1" />
      <rect x="15" y="38" width="22" height="3.5" rx="1.5" fill="#d9dde5" />
    </svg>
  );
}

export function Sofa({ w = 96 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 96 48" aria-hidden>
      <ellipse cx="48" cy="44" rx="44" ry="4" fill="rgba(0,0,0,.28)" />
      <rect x="4" y="6" width="88" height="26" rx="10" fill="#4457a0" />
      <rect x="10" y="12" width="36" height="18" rx="7" fill="#5b70c0" />
      <rect x="50" y="12" width="36" height="18" rx="7" fill="#5b70c0" />
      <rect x="0" y="16" width="14" height="26" rx="6" fill="#3a4a8c" />
      <rect x="82" y="16" width="14" height="26" rx="6" fill="#3a4a8c" />
      <rect x="6" y="30" width="84" height="10" rx="5" fill="#4a5eae" />
    </svg>
  );
}

export function Bed() {
  return (
    <svg width="66" height="88" viewBox="0 0 66 88" aria-hidden>
      <ellipse cx="33" cy="84" rx="30" ry="4" fill="rgba(0,0,0,.3)" />
      <rect x="2" y="4" width="62" height="78" rx="8" fill="url(#gOak)" />
      <rect x="6" y="9" width="54" height="70" rx="6" fill="#f7f9fc" />
      <rect x="10" y="13" width="20" height="14" rx="5" fill="#fff" stroke="#d6dce6" />
      <rect x="36" y="13" width="20" height="14" rx="5" fill="#fff" stroke="#d6dce6" />
      <rect x="6" y="36" width="54" height="43" rx="6" fill="#3b82f6" />
      <path d="M6 44 H60" stroke="#fff" strokeOpacity=".35" strokeWidth="3" />
    </svg>
  );
}

export function Lamp() {
  return (
    <svg width="26" height="60" viewBox="0 0 26 60" aria-hidden>
      <ellipse cx="13" cy="57" rx="9" ry="2.6" fill="rgba(0,0,0,.3)" />
      <rect x="12" y="20" width="2" height="36" fill="#2b3245" />
      <path d="M3 22 L8 4 H18 L23 22 Z" fill="#ffe3a6" />
      <ellipse cx="13" cy="22" rx="10" ry="3" fill="#ffd27a" opacity=".6" />
    </svg>
  );
}

export function Bookshelf() {
  const cols = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
  return (
    <svg width="64" height="62" viewBox="0 0 64 62" aria-hidden>
      <ellipse cx="32" cy="58" rx="28" ry="3" fill="rgba(0,0,0,.28)" />
      <rect x="2" y="2" width="60" height="54" rx="3" fill="url(#gOak)" />
      <rect x="5" y="5" width="54" height="22" fill="#6e4a22" opacity=".55" />
      <rect x="5" y="30" width="54" height="22" fill="#6e4a22" opacity=".55" />
      {cols.map((c, i) => <rect key={i} x={8 + i * 8} y={9 + (i % 2) * 2} width="6" height={18 - (i % 2) * 2} rx="1" fill={c} />)}
      {cols.map((c, i) => <rect key={"b" + i} x={8 + i * 8} y={34 + ((i + 1) % 2) * 2} width="6" height={18 - ((i + 1) % 2) * 2} rx="1" fill={cols[(i + 3) % 6]} />)}
    </svg>
  );
}

export function GlassDoor() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 84 78" preserveAspectRatio="none" aria-hidden>
      <rect x="4" y="2" width="76" height="76" rx="3" fill="#1d2536" />
      <rect x="8" y="6" width="32" height="72" fill="url(#gGlass)" />
      <rect x="44" y="6" width="32" height="72" fill="url(#gGlass)" />
      <path d="M12 6 L26 6 L12 40 Z" fill="#fff" opacity=".18" />
      <path d="M48 6 L62 6 L48 40 Z" fill="#fff" opacity=".18" />
      <rect x="37" y="36" width="2.4" height="14" rx="1.2" fill="#e5e9f1" />
      <rect x="44.6" y="36" width="2.4" height="14" rx="1.2" fill="#e5e9f1" />
    </svg>
  );
}

/** Wall with night-time skyline windows. Coordinates are in the wall's own space. */
export function Wall({ width, height, windows, tone, home }: { width: number; height: number; windows: number[]; tone: [string, string]; home?: boolean }) {
  const wy = height - 70;
  const city = "M0 36 H6 V24 H14 V32 H20 V18 H30 V30 H38 V22 H46 V34 H54 V16 H64 V28 H72 V36 H80 V26 H90 V34 H102 V20 H112 V52 H0 Z";
  const lit = [[8, 28], [22, 24], [34, 26], [48, 28], [58, 22], [68, 32], [84, 30], [94, 26], [106, 28]];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id="gWallTone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone[0]} />
          <stop offset="1" stopColor={tone[1]} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="url(#gWallTone)" />
      <rect y={height - 8} width={width} height="8" fill="rgba(0,0,0,.16)" />
      <rect y={height - 9} width={width} height="1.5" fill="rgba(255,255,255,.4)" />
      {windows.map((x, i) => (
        <g key={i} transform={`translate(${x},${wy})`}>
          <rect x="-3" y="-3" width="118" height="58" rx="4" fill="#f4f6fa" />
          <rect width="112" height="52" rx="2" fill="url(#gSky)" />
          {home && i === 0 && <circle cx="86" cy="14" r="8" fill="#fff4cf" />}
          {!home && <circle cx="94" cy="12" r="1.2" fill="#fff" opacity=".8" />}
          <path d={city} fill="#0d1433" transform="translate(0,0)" />
          {lit.map(([lx, ly], j) => <rect key={j} x={lx} y={ly + 4} width="2.2" height="2.2" fill="#ffd67a" opacity={0.5 + ((i + j) % 3) * 0.2} />)}
          <path d="M56 0 V52 M0 26 H112" stroke="#f4f6fa" strokeWidth="2.5" />
          <path d="M8 0 L30 0 L6 52 L0 52 Z" fill="#fff" opacity=".1" />
          <rect x="-5" y="52" width="122" height="4" rx="2" fill="#dfe3ea" />
        </g>
      ))}
    </svg>
  );
}

/** Decor objects for the 52px tile. */
export function DecorArt({ id }: { id: string }) {
  const sh = <ellipse cx="26" cy="47" rx="19" ry="4" fill="rgba(0,0,0,.28)" />;
  const wrap = (children: React.ReactNode) => (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
      {sh}
      {children}
    </svg>
  );
  switch (id) {
    case "plants":
      return <Plant size={52} />;
    case "coffee":
      return wrap(
        <>
          <rect x="9" y="8" width="34" height="36" rx="5" fill="#2b3245" />
          <rect x="9" y="8" width="34" height="9" rx="4" fill="url(#gSteel)" />
          <rect x="14" y="22" width="24" height="14" rx="3" fill="#0f1420" />
          <rect x="21" y="30" width="10" height="9" rx="2" fill="#fff" />
          <rect x="22.5" y="31.5" width="7" height="3" rx="1" fill="#7a4a24" />
          <circle cx="38" cy="13" r="2" fill="#52d68a" />
        </>
      );
    case "whiteboard":
      return wrap(
        <>
          <rect x="4" y="6" width="44" height="30" rx="3" fill="#f7f9fc" stroke="#aeb6c4" strokeWidth="2" />
          <path d="M10 14 H28 M10 20 H36 M10 26 H22" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <circle cx="38" cy="26" r="4" fill="none" stroke="#ef4444" strokeWidth="2" />
          <rect x="12" y="36" width="3" height="10" fill="#8b93a3" />
          <rect x="37" y="36" width="3" height="10" fill="#8b93a3" />
        </>
      );
    case "meeting":
      return wrap(
        <>
          <ellipse cx="26" cy="30" rx="18" ry="11" fill="url(#gOak)" stroke="rgba(0,0,0,.25)" />
          <circle cx="10" cy="18" r="5" fill="#334058" /><circle cx="26" cy="12" r="5" fill="#334058" /><circle cx="42" cy="18" r="5" fill="#334058" />
          <rect x="18" y="26" width="9" height="6" rx="1" fill="#e5e9f1" />
        </>
      );
    case "game":
      return wrap(
        <>
          <rect x="12" y="4" width="28" height="42" rx="5" fill="#6d3fd1" />
          <rect x="16" y="9" width="20" height="14" rx="2" fill="#0b1224" />
          <path d="M20 18 L24 12 L28 18 Z" fill="#52d68a" />
          <circle cx="26" cy="31" r="2.4" fill="#ef4444" />
          <rect x="17" y="36" width="18" height="4" rx="2" fill="#f59e0b" />
        </>
      );
    case "kitchen":
      return wrap(
        <>
          <rect x="4" y="14" width="44" height="30" rx="3" fill="#e9ecf2" stroke="#b7bfcc" />
          <rect x="4" y="14" width="44" height="8" rx="3" fill="url(#gOak)" />
          <circle cx="16" cy="9" r="6" fill="#ef4444" /><rect x="10" y="9" width="12" height="5" fill="#b91c1c" />
          <rect x="30" y="28" width="12" height="10" rx="2" fill="#b7bfcc" />
        </>
      );
    case "studio":
      return wrap(
        <>
          <path d="M8 46 L22 14 M44 46 L30 14 M26 46 V16" stroke="#8a5a2b" strokeWidth="3" strokeLinecap="round" />
          <rect x="12" y="8" width="28" height="22" rx="2" fill="#fff" stroke="#aeb6c4" />
          <circle cx="22" cy="18" r="4" fill="#ec4899" /><circle cx="32" cy="20" r="5" fill="#3b82f6" /><circle cx="27" cy="14" r="3" fill="#f59e0b" />
        </>
      );
    case "gym":
      return wrap(
        <>
          <rect x="8" y="26" width="36" height="5" rx="2.5" fill="#8b93a3" />
          <rect x="6" y="18" width="6" height="21" rx="2" fill="#2b3245" /><rect x="40" y="18" width="6" height="21" rx="2" fill="#2b3245" />
          <rect x="13" y="21" width="5" height="15" rx="2" fill="#475069" /><rect x="34" y="21" width="5" height="15" rx="2" fill="#475069" />
        </>
      );
    default:
      return wrap(<circle cx="26" cy="26" r="14" fill="#8b93a3" />);
  }
}

export function Vending() {
  return (
    <svg width="48" height="68" viewBox="0 0 48 68" aria-hidden>
      <ellipse cx="24" cy="65" rx="20" ry="3" fill="rgba(0,0,0,.3)" />
      <rect x="3" y="2" width="42" height="62" rx="5" fill="#d9304f" />
      <rect x="8" y="7" width="26" height="36" rx="2" fill="#0f1730" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + "" + c} x={11 + c * 8} y={10 + r * 11} width="6" height="8" rx="1.5" fill={["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#fb923c"][(r * 3 + c) % 5]} />))}
      <rect x="37" y="9" width="5" height="14" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="8" y="48" width="34" height="9" rx="2" fill="#7a1228" />
    </svg>
  );
}

export function CoffeeTable({ w = 44 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.7} viewBox="0 0 44 31" aria-hidden>
      <ellipse cx="22" cy="27" rx="18" ry="3" fill="rgba(0,0,0,.28)" />
      <ellipse cx="22" cy="14" rx="19" ry="11" fill="url(#gOak)" stroke="rgba(0,0,0,.2)" />
      <rect x="14" y="9" width="9" height="6" rx="1" fill="#fff" />
      <circle cx="30" cy="14" r="3" fill="#fff" stroke="#c3cad6" /><circle cx="30" cy="14" r="1.8" fill="#6b4226" />
    </svg>
  );
}

export function Cabinet() {
  return (
    <svg width="40" height="58" viewBox="0 0 40 58" aria-hidden>
      <ellipse cx="20" cy="55" rx="16" ry="3" fill="rgba(0,0,0,.28)" />
      <rect x="3" y="3" width="34" height="50" rx="3" fill="url(#gSteel)" stroke="#9aa3b2" />
      {[0, 1, 2].map((i) => (
        <g key={i}><rect x="6" y={6 + i * 15} width="28" height="12" rx="1.5" fill="#dfe3ea" stroke="#b4bcc9" /><rect x="16" y={11 + i * 15} width="8" height="2.4" rx="1.2" fill="#8b93a3" /></g>
      ))}
    </svg>
  );
}
