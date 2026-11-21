"use client";
import { PARTNER, ROLES } from "@/game/data";
import { stationUnlocked, STATION_INFO } from "@/game/layout";
import type { Role, StationId } from "@/game/types";
import { useUI } from "@/store/useUI";
import Avatar, { lookFor, PARTNER_LOOK } from "./Avatar";
import { useG } from "./ui";

const DEPTS: { id: StationId | "mgmt"; label: string; emoji: string; role: Role }[] = [
  { id: "mgmt", label: "Management", emoji: "📋", role: "manager" },
  { id: "eng", label: "Engineering", emoji: "⌨️", role: "dev" },
  { id: "ops", label: "DevOps", emoji: "☁️", role: "devops" },
  { id: "design", label: "Design", emoji: "🎨", role: "designer" },
  { id: "mkt", label: "Marketing", emoji: "📣", role: "marketer" },
  { id: "support", label: "Support", emoji: "🎧", role: "support" },
];

export default function TreeModal() {
  const g = useG();
  const { tree, setTree, setTalk } = useUI();
  if (!tree) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Company tree" onClick={() => setTree(false)}>
      <div className="modal tree-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h2>🌳 {g.company || "Company"} tree</h2>
          <button className="btn" onClick={() => setTree(false)}>Close</button>
        </div>
        <div className="tree-scroll">
          <ul className="tree">
            <li>
              <div className="tnode top">
                <div className="duo">
                  <div><Avatar look={g.look} role="you" size={46} /><b>{g.founder}</b><span className="dim small">Founder · Director</span></div>
                  {g.founded && <div><Avatar look={PARTNER_LOOK} role="partner" size={46} /><b>{PARTNER.name}</b><span className="dim small">Co-founder · People & Admin</span></div>}
                </div>
              </div>
              {g.founded && (
                <ul>
                  {DEPTS.map((d) => {
                    const staff = g.team.filter((e) => e.role === d.role);
                    const open = d.id === "mgmt" ? staff.length > 0 : stationUnlocked(g, d.id as StationId);
                    return (
                      <li key={d.id}>
                        <div className={`tnode dept ${open ? "" : "ghost"}`}>
                          <b>{d.emoji} {d.label}</b>
                          <span className="dim small">{open ? `${staff.length} ${staff.length === 1 ? "person" : "people"}` : "Not formed yet"}</span>
                        </div>
                        {staff.length > 0 && (
                          <ul className="leafs">
                            {staff.map((e) => (
                              <li key={e.id}>
                                <button className="tnode leaf" onClick={() => { setTree(false); setTalk(e.id); }}>
                                  <Avatar look={lookFor(e.id + e.name, e.role)} role={e.role} size={34} />
                                  <span><b>{e.name}</b><br /><span className="dim small">{e.remote ? "🏠 " : ""}{ROLES[e.role].label} · skill {e.skill}</span></span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          </ul>
        </div>
        <p className="dim small">Click a person to open their card. Unlock new departments as the company grows.{!g.founded && " (Found the company to start your tree.)"}</p>
        <span hidden>{STATION_INFO.you.label}</span>
      </div>
    </div>
  );
}
