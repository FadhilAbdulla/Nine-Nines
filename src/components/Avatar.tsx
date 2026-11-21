"use client";
import type { Look, Role } from "@/game/types";

export const SKINS = ["#f7d3b5", "#e8b48a", "#c58c5f", "#8d5a3b", "#5a3a26"];
export const HAIR_COLORS = ["#1c1a1a", "#5b3a21", "#c9772b", "#d9c79a", "#7a3cc9", "#2f6fd1"];
export const SHIRTS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];
export const HAIR_STYLES = ["Short", "Long", "Bun", "Curly", "Bald"];

export const PARTNER_LOOK: Look = { skin: 2, hair: 1, hairColor: 1, shirt: 4 };

export const ROLE_SHIRT: Record<Role, number> = { dev: 0, devops: 6, designer: 5, marketer: 3, support: 2, manager: 7 };

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function lookFor(seed: string, role: Role): Look {
  const h = hash(seed);
  return { skin: h % SKINS.length, hair: (h >> 3) % HAIR_STYLES.length, hairColor: (h >> 6) % HAIR_COLORS.length, shirt: ROLE_SHIRT[role] };
}

export default function Avatar({ look, role, size = 44, bob = false, walking = false, flip = false, legs = false, typing = false }: { look: Look; role?: Role | "partner" | "you"; size?: number; bob?: boolean; walking?: boolean; flip?: boolean; legs?: boolean; typing?: boolean }) {
  const skin = SKINS[look.skin % SKINS.length];
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  const shirt = SHIRTS[look.shirt % SHIRTS.length];
  const style = look.hair % HAIR_STYLES.length;
  return (
    <svg
      className={`avatar${bob || walking ? " bob" : ""}${walking ? " walking" : ""}${typing ? " typing" : ""}`}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      width={size}
      height={(size * (legs ? 64 : 52)) / 44}
      viewBox={`0 0 44 ${legs ? 64 : 52}`}
      aria-hidden
    >
      {legs && (
        <g>
          <rect className="leg leg-l" x="12" y="48" width="8" height="14" rx="3" fill="#2b3248" />
          <rect className="leg leg-r" x="24" y="48" width="8" height="14" rx="3" fill="#2b3248" />
          <rect className="leg leg-l" x="11" y="59" width="10" height="5" rx="2.5" fill="#e5e7eb" />
          <rect className="leg leg-r" x="23" y="59" width="10" height="5" rx="2.5" fill="#e5e7eb" />
        </g>
      )}
      <rect className="arm arm-l" x="2" y="36" width="7" height="15" rx="3.5" fill={shirt} />
      <rect className="arm arm-r" x="35" y="36" width="7" height="15" rx="3.5" fill={shirt} />
      {/* body */}
      <path d="M5 52 C5 38 12 33 22 33 C32 33 39 38 39 52 Z" fill={shirt} stroke="rgba(0,0,0,.18)" strokeWidth="0.8" />
      {role === "manager" && <path d="M22 34 L19 38 L22 48 L25 38 Z" fill="#1e293b" />}
      {role === "marketer" && <rect x="18" y="38" width="8" height="6" rx="1" fill="#fff" opacity="0.85" />}
      <rect x="18.5" y="27" width="7" height="8" rx="3" fill={skin} />
      {/* back hair */}
      {style === 1 && <path d="M8 20 C8 6 36 6 36 20 L37 36 L30 33 L14 33 L7 36 Z" fill={hair} />}
      {/* head */}
      <circle cx="22" cy="19" r="11" fill={skin} />
      {/* front hair */}
      {style === 0 && <path d="M10.5 17 C10 6 34 6 33.5 17 C30 12 15 12 10.5 17 Z" fill={hair} />}
      {style === 1 && <path d="M10.5 18 C10 7 34 7 33.5 18 C29 11 16 11 10.5 18 Z" fill={hair} />}
      {style === 2 && (
        <>
          <path d="M10.5 17 C10 6 34 6 33.5 17 C30 12 15 12 10.5 17 Z" fill={hair} />
          <circle cx="22" cy="6" r="4.5" fill={hair} />
        </>
      )}
      {style === 3 && (
        <>
          <circle cx="13" cy="11" r="5" fill={hair} />
          <circle cx="22" cy="8" r="5.5" fill={hair} />
          <circle cx="31" cy="11" r="5" fill={hair} />
          <circle cx="11" cy="17" r="3.5" fill={hair} />
          <circle cx="33" cy="17" r="3.5" fill={hair} />
        </>
      )}
      {/* face */}
      <circle cx="18" cy="20" r="1.4" fill="#1c1a1a" />
      <circle cx="26" cy="20" r="1.4" fill="#1c1a1a" />
      <path d="M18.5 25 Q22 28 25.5 25" stroke="#1c1a1a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* accessories */}
      {role === "dev" && (
        <g stroke="#1c1a1a" strokeWidth="1.2" fill="rgba(180,220,255,.25)">
          <circle cx="18" cy="20" r="3.6" />
          <circle cx="26" cy="20" r="3.6" />
          <path d="M21.6 20 H22.4" />
        </g>
      )}
      {role === "devops" && <path d="M10.5 16 C11 6 33 6 33.5 16 L31 16 C30 10 14 10 13 16 Z" fill="#0f766e" />}
      {role === "designer" && <ellipse cx="17" cy="8.5" rx="9" ry="3.6" fill="#dc2626" transform="rotate(-12 17 8.5)" />}
      {role === "support" && (
        <g stroke="#1c1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M10.5 20 C10 6 34 6 33.5 20" />
          <path d="M33 22 Q33 28 27 28" />
        </g>
      )}
      {(role === "partner") && <rect x="30" y="38" width="6" height="8" rx="1" fill="#fbbf24" />}
      {(role === "you") && <path d="M18 37 H26" stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

export function LookPicker({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  const Row = ({ label, count, field, render }: { label: string; count: number; field: keyof Look; render: (i: number) => React.ReactNode }) => (
    <div className="pick-row">
      <span className="label">{label}</span>
      <div className="swatches">
        {Array.from({ length: count }).map((_, i) => (
          <button type="button" key={i} aria-pressed={look[field] === i} aria-label={`${label} ${i + 1}`} onClick={() => onChange({ ...look, [field]: i })}>
            {render(i)}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="look-picker">
      <div className="preview"><Avatar look={look} role="you" size={96} /></div>
      <div className="picks">
        <Row label="Skin" count={SKINS.length} field="skin" render={(i) => <i style={{ background: SKINS[i] }} />} />
        <Row label="Hair style" count={HAIR_STYLES.length} field="hair" render={(i) => <span className="txt">{HAIR_STYLES[i]}</span>} />
        <Row label="Hair colour" count={HAIR_COLORS.length} field="hairColor" render={(i) => <i style={{ background: HAIR_COLORS[i] }} />} />
        <Row label="Shirt" count={SHIRTS.length} field="shirt" render={(i) => <i style={{ background: SHIRTS[i] }} />} />
      </div>
    </div>
  );
}
