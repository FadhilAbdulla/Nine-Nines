"use client";
// Visual layers for the park: sky, ground details (paths, plaza, lake, picnic) and ambient life.
const T = 52;

export function ParkSky({ width, height }: { width: number; height: number }) {
  const h = height;
  return (
    <div className="park-sky" style={{ width, height: h }} aria-hidden>
      <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="gPSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4aa8f0" />
            <stop offset=".6" stopColor="#9fd8ff" />
            <stop offset="1" stopColor="#e7f7ff" />
          </linearGradient>
          <radialGradient id="gSun" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#fffbe0" stopOpacity="1" />
            <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={width} height={h} fill="url(#gPSky)" />
        <circle cx={width * 0.8} cy={h * 0.4} r="70" fill="url(#gSun)" />
        <circle cx={width * 0.8} cy={h * 0.4} r="17" fill="#fffbe6" />
        {/* far city skyline */}
        <g fill="#9bb8d8" opacity=".55">
          {Array.from({ length: Math.ceil(width / 44) }, (_, i) => (
            <rect key={i} x={i * 44} y={h - 46 - ((i * 37) % 30)} width={30 + ((i * 13) % 14)} height={80} rx="2" />
          ))}
        </g>
        {/* rolling hills */}
        <path d={`M0 ${h} V${h - 22} Q${width * 0.18} ${h - 54} ${width * 0.36} ${h - 24} T${width * 0.7} ${h - 28} T${width} ${h - 26} V${h} Z`} fill="#8fd07f" />
        <path d={`M0 ${h} V${h - 10} Q${width * 0.25} ${h - 32} ${width * 0.5} ${h - 12} T${width} ${h - 14} V${h} Z`} fill="#6fbe62" />
        {/* birds */}
        <g stroke="#3b4a66" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".7">
          <path d={`M${width * 0.3} ${h * 0.32} q4 -5 8 0 q4 -5 8 0`} />
          <path d={`M${width * 0.36} ${h * 0.4} q3 -4 6 0 q3 -4 6 0`} />
        </g>
      </svg>
      {[0.05, 0.4, 0.7].map((f, i) => (
        <svg key={i} className="cloud" width="110" height="40" viewBox="0 0 110 40" style={{ top: 6 + i * 18, animationDuration: `${70 + i * 25}s`, animationDelay: `${-f * 90}s` }}>
          <ellipse cx="40" cy="26" rx="34" ry="11" fill="#fff" opacity=".92" />
          <ellipse cx="62" cy="18" rx="24" ry="12" fill="#fff" opacity=".95" />
          <ellipse cx="26" cy="20" rx="18" ry="9" fill="#fff" opacity=".95" />
          <ellipse cx="80" cy="27" rx="20" ry="8" fill="#fff" opacity=".9" />
        </svg>
      ))}
    </div>
  );
}

export function ParkGround({ W, Wt, Ht, ext }: { W: number; Wt: number; Ht: number; ext: { x: number; top: number } }) {
  const x0 = -ext.x - 80;
  const x1 = W + ext.x + 80;
  const main = `M ${x0} ${3.8 * T} C ${2 * T} ${3.2 * T}, ${5 * T} ${4.3 * T}, ${8 * T} ${3.8 * T} S ${12 * T} ${3.2 * T}, ${x1} ${3.9 * T}`;
  const branch = `M ${1.3 * T} ${1.2 * T} C ${1.3 * T} ${2.6 * T}, ${1.5 * T} ${3.3 * T}, ${1.8 * T} ${3.75 * T}`;
  const spur = `M ${5.4 * T} ${2.9 * T} C ${5.4 * T} ${3.3 * T}, ${5.4 * T} ${3.5 * T}, ${5.5 * T} ${3.9 * T}`;
  const stroke = (d: string, k: string) => (
    <g key={k}>
      <path d={d} stroke="#c7b27c" strokeWidth="64" fill="none" strokeLinecap="round" />
      <path d={d} stroke="#f1e4bd" strokeWidth="56" fill="none" strokeLinecap="round" />
      <path d={d} stroke="#fff9e6" strokeWidth="2.4" strokeDasharray="0.1 16" strokeLinecap="round" fill="none" opacity=".8" />
    </g>
  );
  const pondX = 10 * T, pondY = 6.25 * T;
  return (
    <svg className="park-ground" width={Wt} height={Ht} style={{ left: -ext.x, top: -ext.top }} aria-hidden>
      <defs>
        <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9be6ff" />
          <stop offset="1" stopColor="#3b95d6" />
        </linearGradient>
        <pattern id="pPicnic" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#fff" />
          <rect width="8" height="16" fill="#ef5b5b" opacity=".85" />
          <rect width="16" height="8" fill="#ef5b5b" opacity=".55" />
        </pattern>
        <pattern id="pDeck" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#c99a62" />
          <rect y="12.5" width="14" height="1.5" fill="#8f6838" />
        </pattern>
      </defs>
      <g transform={`translate(${ext.x},${ext.top})`}>
        {stroke(main, "m")}
        {stroke(branch, "b")}
        {stroke(spur, "s")}

        {/* café deck */}
        <rect x={6.8 * T} y={1.55 * T} width={3.3 * T} height={1.75 * T} rx="10" fill="url(#pDeck)" stroke="#7a5428" strokeWidth="2" opacity=".96" />
        <rect x={6.8 * T} y={3.3 * T - 6} width={3.3 * T} height="6" rx="3" fill="rgba(0,0,0,.2)" />

        {/* plaza + fountain */}
        <circle cx={5.4 * T} cy={1.9 * T} r={1.2 * T} fill="#e6d9b9" stroke="#c7b27c" strokeWidth="4" />
        <circle cx={5.4 * T} cy={1.9 * T} r={1.0 * T} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeDasharray="3 7" />
        <ellipse cx={5.4 * T} cy={1.9 * T + 10} rx={0.62 * T} ry={0.3 * T} fill="rgba(0,0,0,.22)" />
        <circle cx={5.4 * T} cy={1.9 * T} r={0.58 * T} fill="#d7deea" stroke="#9aa7bd" strokeWidth="3" />
        <circle cx={5.4 * T} cy={1.9 * T} r={0.46 * T} fill="url(#gWater)" />
        <circle className="ripple" cx={5.4 * T} cy={1.9 * T} r="10" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle className="ripple r2" cx={5.4 * T} cy={1.9 * T} r="10" fill="none" stroke="#fff" strokeWidth="1.5" />
        <rect x={5.4 * T - 3} y={1.9 * T - 16} width="6" height="16" rx="3" fill="#cfd8e6" stroke="#9aa7bd" />
        <g stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".9">
          <path className="spray" d={`M${5.4 * T} ${1.9 * T - 16} q-12 -18 -20 4`} />
          <path className="spray" d={`M${5.4 * T} ${1.9 * T - 16} q12 -18 20 4`} />
          <path className="spray" d={`M${5.4 * T} ${1.9 * T - 16} v-14`} />
        </g>

        {/* lake */}
        <ellipse cx={pondX} cy={pondY} rx={1.75 * T} ry={1.28 * T} fill="#d9c58f" />
        <ellipse cx={pondX} cy={pondY} rx={1.62 * T} ry={1.15 * T} fill="url(#gWater)" />
        <ellipse cx={pondX - 24} cy={pondY - 22} rx="34" ry="9" fill="#fff" opacity=".28" />
        <circle className="ripple" cx={pondX + 20} cy={pondY + 6} r="8" fill="none" stroke="#fff" strokeWidth="1.4" />
        <circle className="ripple r2" cx={pondX - 30} cy={pondY + 14} r="8" fill="none" stroke="#fff" strokeWidth="1.4" />
        {[[-48, 10], [38, -18], [52, 22]].map(([dx, dy], i) => (
          <g key={i}><ellipse cx={pondX + dx} cy={pondY + dy} rx="11" ry="6" fill="#3fa65a" /><path d={`M${pondX + dx} ${pondY + dy} l8 -3`} stroke="#3b95d6" strokeWidth="2" /><circle cx={pondX + dx - 2} cy={pondY + dy - 2} r="2.2" fill="#ffd6e7" /></g>
        ))}
        {/* reeds */}
        {[[-1.55, -0.55], [-1.6, -0.2], [1.55, 0.7], [1.45, 0.95]].map(([dx, dy], i) => (
          <g key={i} stroke="#4c8a3a" strokeWidth="2.4" strokeLinecap="round"><path d={`M${pondX + dx * T} ${pondY + dy * T} v-18`} /><path d={`M${pondX + dx * T + 5} ${pondY + dy * T} v-13`} /><circle cx={pondX + dx * T} cy={pondY + dy * T - 19} r="2.6" fill="#7a5230" stroke="none" /></g>
        ))}

        {/* picnic blanket + basket */}
        <g transform={`rotate(-6 ${5.4 * T} ${6.5 * T})`}>
          <rect x={4.4 * T} y={5.9 * T} width={2.1 * T} height={1.35 * T} rx="5" fill="rgba(0,0,0,.2)" transform="translate(3 5)" />
          <rect x={4.4 * T} y={5.9 * T} width={2.1 * T} height={1.35 * T} rx="5" fill="url(#pPicnic)" stroke="#d94a4a" strokeWidth="1.5" />
          <rect x={4.9 * T} y={6.2 * T} width="28" height="18" rx="3" fill="#b98748" stroke="#7a5428" />
          <path d={`M${4.9 * T + 4} ${6.2 * T} q10 -14 20 0`} stroke="#7a5428" strokeWidth="2.4" fill="none" />
          <circle cx={5.9 * T} cy={6.5 * T} r="5" fill="#ffd166" /><circle cx={6.15 * T} cy={6.7 * T} r="4" fill="#ef5b5b" />
        </g>

        {/* flower beds */}
        {[[2.2, 2.55, 1.3], [8.2, 4.55, 1.5], [0.2, 4.4, 1.0]].map(([bx, by, bw], i) => (
          <g key={i}>
            <rect x={bx * T} y={by * T} width={bw * T} height="22" rx="11" fill="#7a5a3c" />
            {Array.from({ length: Math.round(bw * 4) }, (_, k) => (
              <g key={k}><circle cx={bx * T + 10 + k * 14} cy={by * T + 8} r="4.6" fill={["#ff6b9d", "#ffd166", "#fff", "#c77dff"][(k + i) % 4]} /><circle cx={bx * T + 10 + k * 14} cy={by * T + 8} r="1.5" fill="#f59e0b" /></g>
            ))}
          </g>
        ))}

        {/* hedges along the bottom */}
        {Array.from({ length: Math.ceil((Wt + 160) / 38) }, (_, i) => (
          <g key={i}><circle cx={x0 + i * 38} cy={Ht - ext.top - 6} r="22" fill={i % 2 ? "#3d8f4c" : "#46a257"} /><circle cx={x0 + i * 38 + 6} cy={Ht - ext.top - 16} r="9" fill="#5cc072" opacity=".5" /></g>
        ))}
      </g>
    </svg>
  );
}

export function LampPost() {
  return (
    <svg width="26" height="72" viewBox="0 0 26 72" aria-hidden>
      <ellipse cx="13" cy="68" rx="9" ry="3" fill="rgba(0,0,0,.3)" />
      <rect x="11.5" y="14" width="3" height="54" fill="#2b3245" />
      <rect x="8" y="62" width="10" height="6" rx="2" fill="#2b3245" />
      <path d="M5 16 L8 4 H18 L21 16 Z" fill="#2b3245" />
      <rect x="8" y="6" width="10" height="10" rx="2" fill="#ffe9a8" />
      <circle cx="13" cy="11" r="14" fill="#ffe08a" opacity=".22" />
    </svg>
  );
}

export function CafeTable() {
  return (
    <svg width="62" height="74" viewBox="0 0 62 74" aria-hidden>
      <ellipse cx="31" cy="66" rx="24" ry="5" fill="rgba(0,0,0,.28)" />
      <rect x="29.5" y="14" width="3" height="48" fill="#8b93a3" />
      <path d="M2 24 Q31 -8 60 24 Z" fill="#3b82f6" />
      <path d="M2 24 Q16 6 31 4 Q26 14 24 24 Z M31 4 Q46 6 60 24 L38 24 Q36 14 31 4 Z" fill="#fff" opacity=".9" />
      <ellipse cx="31" cy="50" rx="17" ry="7" fill="#f4e6cf" stroke="#b98748" strokeWidth="1.5" />
      <circle cx="27" cy="48" r="3" fill="#fff" stroke="#c3cad6" /><circle cx="27" cy="48" r="1.8" fill="#6b4226" />
      <circle cx="12" cy="58" r="6" fill="#e8483c" /><circle cx="50" cy="58" r="6" fill="#e8483c" />
    </svg>
  );
}

export function Duck({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <ellipse cx="14" cy="19" rx="11" ry="2.6" fill="rgba(255,255,255,.35)" />
      <ellipse cx="13" cy="13" rx="10" ry="6.5" fill="#fff" />
      <circle cx="21" cy="7" r="5" fill="#fff" />
      <path d="M25 7 l5 1.5 l-5 2 Z" fill="#ff9f1c" />
      <circle cx="22" cy="5.6" r="1" fill="#1b2438" />
      <path d="M6 12 q6 4 12 0" stroke="#d8dee9" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

/** Butterflies and falling petals. Purely decorative. */
export function ParkAmbient({ W, H }: { W: number; H: number }) {
  const petals = Array.from({ length: 14 }, (_, i) => ({ x: ((i * 97) % 100) / 100, d: (i * 1.7) % 12, s: 9 + (i % 4) * 2, c: ["#ffd1e3", "#fff", "#ffe08a"][i % 3] }));
  return (
    <>
      {petals.map((p, i) => (
        <span key={i} className="petal" style={{ left: p.x * W, width: p.s, height: p.s * 0.6, background: p.c, animationDelay: `${-p.d}s`, animationDuration: `${9 + (i % 5) * 2}s`, ["--h" as string]: `${H}px` } as React.CSSProperties} />
      ))}
      {[[1.8, 2.4, 0], [6.8, 4.9, 2], [10.8, 3.0, 4]].map(([x, y, dl], i) => (
        <span key={i} className="bfly" style={{ left: x * T, top: y * T, animationDelay: `${-dl}s` }}>
          <svg width="18" height="14" viewBox="0 0 18 14"><g className="wing"><ellipse cx="5" cy="6" rx="5" ry="6" fill={["#ff8fab", "#8ecae6", "#ffd166"][i]} /><ellipse cx="13" cy="6" rx="5" ry="6" fill={["#ff8fab", "#8ecae6", "#ffd166"][i]} /></g><rect x="8.4" y="2" width="1.4" height="10" rx=".7" fill="#3b2a1a" /></svg>
        </span>
      ))}
      <span className="duck" style={{ left: 8.9 * T, top: 5.75 * T, animationDuration: "14s" }}><Duck /></span>
      <span className="duck" style={{ left: 11.0 * T, top: 6.6 * T, animationDuration: "18s", animationDelay: "-6s" }}><Duck flip /></span>
    </>
  );
}
