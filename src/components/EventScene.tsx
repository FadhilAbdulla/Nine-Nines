"use client";
// Startup meetup venue: stage banner, string lights, standing tables and a buffet.
const T = 52;

export function StandTable() {
  return (
    <svg width="46" height="58" viewBox="0 0 46 58" aria-hidden>
      <ellipse cx="23" cy="53" rx="16" ry="4" fill="rgba(0,0,0,.35)" />
      <rect x="21.5" y="22" width="3" height="30" fill="#8b93a3" />
      <ellipse cx="23" cy="52" rx="11" ry="3" fill="#2b3245" />
      <ellipse cx="23" cy="20" rx="20" ry="8" fill="#1d2536" stroke="#3b4d7d" strokeWidth="1.5" />
      <ellipse cx="23" cy="18" rx="20" ry="8" fill="#f4f6fa" />
      <circle cx="14" cy="17" r="3.2" fill="#fff" stroke="#c3cad6" /><circle cx="14" cy="17" r="1.9" fill="#6b4226" />
      <rect x="26" y="12" width="9" height="6" rx="1" fill="#ffd166" />
    </svg>
  );
}

export function Buffet() {
  return (
    <svg width="132" height="60" viewBox="0 0 132 60" aria-hidden>
      <ellipse cx="66" cy="54" rx="60" ry="5" fill="rgba(0,0,0,.35)" />
      <rect x="4" y="18" width="124" height="34" rx="4" fill="#f4f6fa" stroke="#aeb6c4" />
      <rect x="4" y="14" width="124" height="9" rx="4" fill="url(#gOak)" />
      <rect x="4" y="38" width="124" height="14" rx="3" fill="#2b4f9e" />
      {[[16, "#ef5b5b"], [40, "#ffd166"], [64, "#52d68a"], [88, "#c77dff"], [110, "#ff9f1c"]].map(([x, c], i) => (
        <g key={i}><ellipse cx={x as number} cy="14" rx="9" ry="4" fill="#fff" stroke="#c3cad6" /><circle cx={x as number} cy="10" r="5" fill={c as string} /></g>
      ))}
    </svg>
  );
}

export function StringLights({ width }: { width: number }) {
  const n = Math.ceil(width / 44);
  return (
    <svg className="string-lights" width={width} height="42" viewBox={`0 0 ${width} 42`} aria-hidden>
      <path d={`M0 6 ${Array.from({ length: n }, (_, i) => `Q${i * 44 + 22} 30 ${(i + 1) * 44} 6`).join(" ")}`} stroke="#2b3245" strokeWidth="2" fill="none" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}><circle className="bulb" style={{ animationDelay: `${(i % 5) * 0.4}s` }} cx={i * 44 + 22} cy="22" r="4.5" fill={["#ffd166", "#ff8fab", "#8ecae6", "#b8f2a0"][i % 4]} /><circle cx={i * 44 + 22} cy="22" r="11" fill={["#ffd166", "#ff8fab", "#8ecae6", "#b8f2a0"][i % 4]} opacity=".18" /></g>
      ))}
    </svg>
  );
}

export function EventBanner({ width }: { width: number }) {
  return (
    <div className="event-banner" style={{ left: width / 2 - 180 }}>
      <div className="eb-screen"><span>LIVE</span> Demo Day · Pitch Night</div>
      <b>STARTUP MEETUP</b>
      <small>Meet founders, press and investors</small>
    </div>
  );
}
