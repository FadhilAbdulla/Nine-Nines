"use client";
import type { Look, Role } from "@/game/types";

// Robot avatars (EVE-style): glossy egg shell, floating head, dark visor with glowing eyes.
// `Look` fields keep their names for save compatibility: skin = shell, hair = eye shape,
// hairColor = eye glow, shirt = accent colour.
export const SKINS = ["#f4f7fb", "#fde7ee", "#dff5ea", "#dcecff", "#8b93a3"];
export const SKIN_NAMES = ["Pearl", "Rose", "Mint", "Sky", "Steel"];
export const HAIR_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"];
export const SHIRTS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];
export const HAIR_STYLES = ["Round", "Happy", "Wide", "Bar", "Dots"];

export const PARTNER_LOOK: Look = { skin: 1, hair: 1, hairColor: 3, shirt: 4 };

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

function Eyes({ style, color }: { style: number; color: string }) {
  const glow = { filter: `drop-shadow(0 0 1.6px ${color})` };
  switch (style) {
    case 1: // happy arcs
      return <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={glow}><path d="M14.5 20 Q17.5 15.5 20.5 20" /><path d="M23.5 20 Q26.5 15.5 29.5 20" /></g>;
    case 2: // wide ovals
      return <g fill={color} style={glow}><ellipse cx="17" cy="18.5" rx="3.6" ry="2.6" /><ellipse cx="27" cy="18.5" rx="3.6" ry="2.6" /></g>;
    case 3: // visor bar
      return <rect x="13" y="16.8" width="18" height="3.6" rx="1.8" fill={color} style={glow} />;
    case 4: // small dots
      return <g fill={color} style={glow}><circle cx="17.5" cy="18.5" r="1.8" /><circle cx="26.5" cy="18.5" r="1.8" /></g>;
    default: // round
      return <g fill={color} style={glow}><circle cx="17" cy="18.5" r="3" /><circle cx="27" cy="18.5" r="3" /></g>;
  }
}

export default function Avatar({ look, role, size = 44, bob = false, walking = false, flip = false, legs = false, typing = false }: { look: Look; role?: Role | "partner" | "you"; size?: number; bob?: boolean; walking?: boolean; flip?: boolean; legs?: boolean; typing?: boolean }) {
  const shell = SKINS[look.skin % SKINS.length];
  const eye = HAIR_COLORS[look.hairColor % HAIR_COLORS.length];
  const accent = SHIRTS[look.shirt % SHIRTS.length];
  const style = look.hair % HAIR_STYLES.length;
  const edge = "rgba(15,23,42,.22)";
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
        // hovering robot: soft thruster glow instead of legs
        <g>
          <ellipse className="leg leg-l" cx="22" cy="61" rx="11" ry="2.6" fill={eye} opacity=".22" />
          <ellipse className="leg leg-r" cx="22" cy="60" rx="6" ry="1.6" fill={eye} opacity=".45" />
        </g>
      )}
      {/* arms */}
      <rect className="arm arm-l" x="2" y="36" width="6.5" height="14" rx="3.2" fill={shell} stroke={edge} strokeWidth="0.8" />
      <rect className="arm arm-r" x="35.5" y="36" width="6.5" height="14" rx="3.2" fill={shell} stroke={edge} strokeWidth="0.8" />
      {/* egg body */}
      <path d="M22 28 C34 28 40 38 38 49 C37 55 7 55 6 49 C4 38 10 28 22 28 Z" fill={shell} stroke={edge} strokeWidth="0.8" />
      <path d="M12 40 C12 35 15 32 19 31" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="14" y="43" width="16" height="2.4" rx="1.2" fill={accent} />
      {role === "manager" && <rect x="19" y="46" width="6" height="3" rx="1.2" fill="#1e293b" />}
      {role === "marketer" && <circle cx="22" cy="49" r="1.8" fill="#fff" opacity=".9" />}
      {/* floating head */}
      <ellipse cx="22" cy="18" rx="15" ry="12.5" fill={shell} stroke={edge} strokeWidth="0.8" />
      <path d="M9 13 C11 7 17 5 22 5" stroke="#fff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* visor */}
      <ellipse cx="22" cy="18.5" rx="12" ry="8.4" fill="#0b1220" />
      <Eyes style={style} color={eye} />
      {/* accessories */}
      {role === "dev" && (
        <g stroke={accent} strokeWidth="1.3" fill="none">
          <circle cx="17" cy="18.5" r="4.4" />
          <circle cx="27" cy="18.5" r="4.4" />
          <path d="M21.4 18.5 H22.6" />
        </g>
      )}
      {role === "devops" && <path d="M10 10.5 C13 4 31 4 34 10.5 L31.5 11 C29 7.5 15 7.5 12.5 11 Z" fill="#0f766e" />}
      {role === "designer" && <ellipse cx="14" cy="6" rx="8" ry="3" fill="#dc2626" transform="rotate(-15 14 6)" />}
      {role === "support" && (
        <g stroke="#475569" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M8 19 C7 3 37 3 36 19" />
          <path d="M35 22 Q35 29 28 29" />
        </g>
      )}
      {(role === "manager" || role === "partner") && <g stroke={accent} strokeWidth="1.6" strokeLinecap="round"><path d="M22 6 V1.5" /><circle cx="22" cy="1.3" r="1.3" fill={accent} /></g>}
      {role === "partner" && <rect x="29.5" y="39" width="6" height="7" rx="1" fill="#fbbf24" />}
      {role === "you" && <circle cx="31" cy="44" r="1.6" fill={eye} />}
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
        <Row label="Shell" count={SKINS.length} field="skin" render={(i) => <i style={{ background: SKINS[i], boxShadow: "inset 0 0 0 1px rgba(0,0,0,.25)" }} />} />
        <Row label="Eyes" count={HAIR_STYLES.length} field="hair" render={(i) => <span className="txt">{HAIR_STYLES[i]}</span>} />
        <Row label="Glow" count={HAIR_COLORS.length} field="hairColor" render={(i) => <i style={{ background: HAIR_COLORS[i] }} />} />
        <Row label="Accent" count={SHIRTS.length} field="shirt" render={(i) => <i style={{ background: SHIRTS[i] }} />} />
      </div>
    </div>
  );
}
