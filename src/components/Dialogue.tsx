"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PARTNER } from "@/game/data";
import { getEvent } from "@/game/events";
import { useGame } from "@/store/useGame";
import Avatar, { PARTNER_LOOK } from "./Avatar";
import { useG } from "./ui";

type Line = { who: "maya" | "you" | "narr"; text: string };

function parse(text: string): Line[] {
  return text
    .split("\n\n")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(/^@(maya|you)\s+/);
      if (m) return { who: m[1] as "maya" | "you", text: raw.slice(m[0].length) };
      return { who: "narr", text: raw };
    });
}

export default function Dialogue() {
  const g = useG();
  const choose = useGame((s) => s.chooseEvent);
  const close = useGame((s) => s.closeEvent);
  const ev = g.event ? getEvent(g.event.id) : undefined;
  const result = g.event?.result;

  const lines = useMemo(() => (ev ? (result ? parse(result) : parse(ev.body(g))) : []), [ev, result]); // eslint-disable-line react-hooks/exhaustive-deps
  const phaseKey = `${g.event?.id}:${result ? "r" : "b"}`;
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIdx(0); setShown(0); }, [phaseKey]);

  const line = lines[Math.min(idx, lines.length - 1)];
  const typing = !!line && shown < line.text.length;
  useEffect(() => {
    if (!line) return;
    setShown(0);
    const id = setInterval(() => setShown((n) => (n >= line.text.length ? n : n + 2)), 22);
    return () => clearInterval(id);
  }, [idx, phaseKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const atEnd = idx >= lines.length - 1 && !typing;
  const choosing = !result && atEnd;
  const advance = () => {
    if (!line) return;
    if (typing) { setShown(line.text.length); return; }
    if (idx < lines.length - 1) { setIdx(idx + 1); return; }
    if (result) close();
    else if (ev && ev.choices.length === 1 && !ev.input) choose(0, text);
  };

  const advRef = useRef(advance);
  advRef.current = advance;
  useEffect(() => {
    if (!ev) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && t.tagName === "INPUT") return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); advRef.current(); }
      else if (/^[1-9]$/.test(e.key) && choosing && ev && !ev.input) {
        const c = ev.choices[Number(e.key) - 1];
        if (c && !c.disabled?.(g)) choose(Number(e.key) - 1, text);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [ev, choosing, g, choose, text]);

  useEffect(() => { if (choosing && ev?.input) inputRef.current?.focus(); }, [choosing, ev]);

  if (!ev || !line) return null;
  const speakerName = line.who === "maya" ? PARTNER.name : line.who === "you" ? "You" : "";
  const last = idx >= lines.length - 1;

  return (
    <div className="dialogue" role="dialog" aria-label={ev.title}>
      <div className={`dlg-box ${line.who}`} onClick={() => !choosing && advance()}>
        {line.who !== "narr" ? (
          <div className="dlg-portrait">
            <Avatar look={line.who === "maya" ? PARTNER_LOOK : g.look} role={line.who === "maya" ? "partner" : "you"} size={92} />
          </div>
        ) : (
          <div className="dlg-portrait narr">{ev.emoji}</div>
        )}
        <div className="dlg-main">
          <div className="dlg-name">{speakerName || ev.title}</div>
          <p className="dlg-text">
            {line.text.slice(0, shown)}
            {typing && <span className="caret">▍</span>}
          </p>

          {choosing && (
            <div className="dlg-choices">
              {ev.input && (
                <label className="inputrow">
                  <span className="label">{ev.input.label}</span>
                  <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={ev.input.placeholder} maxLength={28} autoComplete="off" />
                </label>
              )}
              {ev.choices.map((c, i) => {
                const why = c.disabled?.(g) ?? null;
                return (
                  <button key={i} className="choice" disabled={!!why} onClick={(e) => { e.stopPropagation(); choose(i, text); }}>
                    <b>{ev.input ? "" : `${i + 1}. `}{c.label}</b>
                    <span className="dim small">{why ?? c.hint ?? ""}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!choosing && (
            <button className="dlg-next" onClick={(e) => { e.stopPropagation(); advance(); }}>
              {last && result ? "Continue" : "Next"} ▸ <kbd>Enter</kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
