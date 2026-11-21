"use client";
import { useEffect, useMemo, useState } from "react";
import { CAMPAIGNS } from "@/game/data";
import { aiCodeHandsOn, codeHandsOn, deployMyself, designHandsOn, marketHandsOn, supportHandsOn } from "@/game/engine";
import { CODE_QUIZ, DEPLOY_HINTS, evaluatePrompt, PROMPT_TASKS, type PromptResult, DEPLOY_STEPS, DESIGN_QUIZ, marketSteps, pickN, shuffle, SUPPORT_TICKETS, type Quiz } from "@/game/tasks";
import { useUI } from "@/store/useUI";
import { useAct, useG } from "./ui";

type Result = { score: number; mistakes?: number; problems?: string[] };

function Frame({ title, subtitle, emoji, onCancel, children }: { title: string; subtitle: string; emoji: string; onCancel: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onCancel]);
  return (
    <div className="overlay hands" role="dialog" aria-modal="true" aria-label={title}>
      <div className="hands-box">
        <div className="hands-head">
          <div>
            <p className="eyebrow">Hands-on · you're doing this yourself</p>
            <h2>{emoji} {title}</h2>
            <p className="dim small">{subtitle}</p>
          </div>
          <button className="btn" onClick={onCancel}>Cancel (Esc)</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- multiple-choice (code, design, support) ---------- */
function Quiz({ questions: raw, onDone, ticket }: { questions: (Quiz & { from?: string })[]; onDone: (r: Result) => void; ticket?: boolean }) {
  // randomise option order so the answer isn't always in the same slot
  const questions = useMemo(
    () => raw.map((q) => {
      const order = shuffle(q.options.map((_, n) => n));
      return { ...q, options: order.map((n) => q.options[n]), answer: order.indexOf(q.answer) };
    }),
    [raw],
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const q = questions[i];
  const answered = picked !== null;

  const pick = (n: number) => {
    if (answered) return;
    setPicked(n);
    if (n === q.answer) setRight((r) => r + 1);
  };
  const next = () => {
    if (!answered) return;
    if (i + 1 >= questions.length) onDone({ score: (right + (picked === q.answer ? 0 : 0)) / questions.length });
    else { setI(i + 1); setPicked(null); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^[1-3]$/.test(e.key)) pick(Number(e.key) - 1);
      if (e.key === "Enter") next();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <div className="quiz">
      <div className="label">Question {i + 1} of {questions.length}</div>
      {ticket && q.from && <div className="ticket-from">📨 {q.from}</div>}
      <p className="q-prompt">{q.prompt}</p>
      {q.code && <pre className="codeblock">{q.code}</pre>}
      <div className="q-options">
        {q.options.map((o, n) => (
          <button key={n} className={`q-opt ${answered ? (n === q.answer ? "right" : n === picked ? "wrong" : "") : ""}`} disabled={answered} onClick={() => pick(n)}>
            <kbd>{n + 1}</kbd> {o || "(leave empty)"}
          </button>
        ))}
      </div>
      {answered && (
        <div className={`q-explain ${picked === q.answer ? "ok" : "bad"}`}>
          <b>{picked === q.answer ? "Correct." : "Not quite."}</b> {q.explain}
        </div>
      )}
      <div className="row end">
        <button className="btn primary" disabled={!answered} onClick={next}>{i + 1 >= questions.length ? "Finish" : "Next"} ▸ <kbd>Enter</kbd></button>
      </div>
    </div>
  );
}

/* ---------- coding with AI: write the prompt ---------- */
function AiPromptTask({ onDone }: { onDone: (r: Result) => void }) {
  const task = useMemo(() => PROMPT_TASKS[Math.floor(Math.random() * PROMPT_TASKS.length)], []);
  const [text, setText] = useState("");
  const [hint, setHint] = useState(false);
  const [out, setOut] = useState<PromptResult | null>(null);
  const [tries, setTries] = useState(0);
  const send = () => { setOut(evaluatePrompt(task, text)); setTries((n) => n + 1); };
  const final = out ? Math.max(0, out.score - 0.1 * (tries - 1)) : 0;
  return (
    <div className="quiz">
      <div className="ai-scenario">
        <b>{task.title}</b>
        <p>{task.scenario}</p>
        <button className="btn sm" onClick={() => setHint((h) => !h)}>{hint ? "Hide" : "Show"} what pros put in a prompt</button>
        {hint && <ul className="goals ai-hint">{task.checks.map((c) => <li key={c.id}>• {c.label}</li>)}</ul>}
      </div>
      <label className="label" htmlFor="ai-prompt">Your prompt to the AI</label>
      <textarea id="ai-prompt" className="ai-text" rows={out ? 3 : 7} value={text} disabled={!!out} onChange={(e) => setText(e.target.value)} placeholder="Describe the task the way you'd brief a new teammate who can't ask follow-up questions…" />
      {!out && <div className="row end"><span className="dim small">{text.trim().length} characters</span><button className="btn primary" disabled={!text.trim()} onClick={send}>Send to AI ▸</button></div>}
      {out && (
        <div className="ai-out">
          <pre className="terminal">{`🤖 AI: Done! Generated ${60 + Math.round(out.score * 40) + out.misses.length * 14} lines across ${2 + out.misses.length} files.${out.vague ? "\n   (Your prompt was so short the AI invented the entire spec.)" : ""}`}</pre>
          <ul className="ai-list">
            {out.hits.map((c) => <li key={c.id} className="ok">✔ Covered: {c.label}</li>)}
            {out.misses.map((c) => <li key={c.id} className="bad"><b>✖ {c.label}</b><span>{c.problem}</span></li>)}
          </ul>
          <div className="q-explain ok"><b>Prompt strength: {Math.round(out.score * 100)}%</b>{tries > 1 ? ` · ${tries - 1} re-roll${tries > 2 ? "s" : ""}, −${(tries - 1) * 10}% for the time you burned` : ""}. Good prompts name the context, the exact requirements, the risks and how to verify the result. AI is only as good as the brief you give it.</div>
          <div className="row end">
            <button className="btn" onClick={() => setOut(null)}>Revise my prompt (−10%)</button>
            <button className="btn primary" onClick={() => onDone({ score: final, problems: out.misses.map((c) => c.problem) })}>Ship this code ▸</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- deploy sequence ---------- */
function DeployTask({ onDone }: { onDone: (r: Result) => void }) {
  const order = useMemo(() => shuffle(DEPLOY_STEPS.map((s, i) => ({ s, i }))), []);
  const [next, setNext] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [logLines, setLog] = useState<string[]>(["$ ready to deploy. Run the steps in the right order."]);

  const click = (i: number, label: string) => {
    if (i < next) return;
    if (i === next) {
      setLog((l) => [...l, `✔ ${label}`]);
      setNext(next + 1);
      setWrong(null);
    } else {
      setMistakes((m) => m + 1);
      setWrong(i);
      setLog((l) => [...l, `✖ ${label} — too early. Hint: ${DEPLOY_HINTS[next]}`]);
    }
  };
  const finished = next >= DEPLOY_STEPS.length;
  return (
    <div className="quiz">
      <p className="q-prompt">Click the steps in the order a safe deployment should happen.</p>
      <div className="deploy-grid">
        <div className="q-options">
          {order.map(({ s, i }) => (
            <button key={i} className={`q-opt ${i < next ? "right" : wrong === i ? "wrong" : ""}`} disabled={i < next || finished} onClick={() => click(i, s)}>
              {i < next ? "✔ " : ""}{s}
            </button>
          ))}
        </div>
        <pre className="terminal">{logLines.join("\n")}{finished ? "\n$ deployment started 🚀" : ""}<span className="caret">▍</span></pre>
      </div>
      <div className="row end">
        <span className="dim small">Mistakes: {mistakes} (each one adds bugs to launch)</span>
        <button className="btn primary" disabled={!finished} onClick={() => onDone({ score: Math.max(0, 1 - mistakes / 6), mistakes })}>Start deployment ▸</button>
      </div>
    </div>
  );
}

/* ---------- campaign planning ---------- */
function MarketTask({ productName, onDone }: { productName: string; onDone: (r: Result) => void }) {
  const steps = useMemo(() => marketSteps(productName).map((s) => ({ ...s, options: shuffle(s.options) })), [productName]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const st = steps[i];
  const answered = picked !== null;
  const choose = (n: number) => { if (!answered) { setPicked(n); setScores([...scores, st.options[n].score]); } };
  const next = () => {
    if (!answered) return;
    if (i + 1 >= steps.length) onDone({ score: scores.reduce((a, b) => a + b, 0) / steps.length });
    else { setI(i + 1); setPicked(null); }
  };
  return (
    <div className="quiz">
      <div className="label">Step {i + 1} of {steps.length}</div>
      <p className="q-prompt">{st.title}</p>
      <div className="q-options">
        {st.options.map((o, n) => (
          <button key={n} className={`q-opt ${answered ? (o.score === 1 ? "right" : n === picked ? "wrong" : "") : ""}`} disabled={answered} onClick={() => choose(n)}>{o.text}</button>
        ))}
      </div>
      {answered && <div className={`q-explain ${st.options[picked!].score >= 0.9 ? "ok" : "bad"}`}><b>Marketing principle:</b> {st.principle}</div>}
      <div className="row end"><button className="btn primary" disabled={!answered} onClick={next}>{i + 1 >= steps.length ? "Launch plan" : "Next"} ▸</button></div>
    </div>
  );
}

/* ---------- result ---------- */
function ResultView({ score, lines, onClose }: { score: number; lines: string[]; onClose: () => void }) {
  const pct = Math.round(score * 100);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Enter") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="quiz result-view">
      <div className="big-score">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "😅"} {pct}%</div>
      <p>{pct >= 80 ? "Excellent work." : pct >= 50 ? "Decent. A specialist would do better, but it's done." : "Rough. This is why people hire specialists."}</p>
      <ul className="goals">{lines.map((l) => <li key={l} className="done">{l}</li>)}</ul>
      <div className="row end"><button className="btn primary" onClick={onClose}>Back to work <kbd>Enter</kbd></button></div>
    </div>
  );
}

/* ---------- root ---------- */
export default function HandsOn() {
  const h = useUI((u) => u.hands);
  const close = useUI((u) => u.closeHands);
  const g = useG();
  const act = useAct();
  const [res, setRes] = useState<(Result & { lines: string[] }) | null>(null);
  const key = h ? `${h.kind}:${h.defId ?? ""}:${h.productId ?? ""}` : "";
  useEffect(() => { setRes(null); }, [key]);

  const code = useMemo(() => pickN(CODE_QUIZ, 3), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const design = useMemo(() => pickN(DESIGN_QUIZ, 3), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const tickets = useMemo(() => pickN(SUPPORT_TICKETS, 3).map((t) => ({ prompt: `"${t.text}"`, from: t.from, options: t.replies, answer: t.best, explain: t.explain })), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!h) return null;
  const focus = g.products.find((p) => p.id === g.focusId);
  const target = g.products.find((p) => p.id === h.productId);

  const finish = (kind: string, r: Result) => {
    const lines: string[] = [];
    if (kind === "code") {
      act((s) => codeHandsOn(s, r.score));
      lines.push(`+${(6 + 14 * r.score).toFixed(0)} dev points on ${focus?.name ?? "your product"}`, "Next hands-on coding session in 2 days");
    } else if (kind === "aicode") {
      const n = r.problems?.length ?? 0;
      act((s) => aiCodeHandsOn(s, r.score, n));
      lines.push(`+${(4 + 16 * r.score).toFixed(0)} dev points on ${focus?.name ?? "your product"}`, n ? `${n} problem(s) slipped in: bugs added to ${focus?.name ?? "your product"}` : "Clean, reviewed code");
      for (const p of r.problems ?? []) lines.push(`⚠ ${p}`);
    } else if (kind === "design") {
      act((s) => designHandsOn(s, r.score));
      lines.push(`Design quality boosted on ${focus?.name ?? "your product"}`, "Next hands-on design session in 3 days");
    } else if (kind === "support") {
      act((s) => supportHandsOn(s, r.score));
      lines.push(`Support capacity ×${(1.4 + r.score * 1.2).toFixed(1)} for 8 days`, `Reputation +${(r.score * 1.5).toFixed(1)}`);
    } else if (kind === "deploy" && h.productId) {
      act((s) => deployMyself(s, h.productId!, r.mistakes ?? 0));
      lines.push("Deployment started: about 8 days without a DevOps team", r.mistakes ? `${r.mistakes} mistake(s) added bugs to the launch` : "No mistakes: clean launch");
    } else if (kind === "market" && h.defId && h.productId) {
      act((s) => marketHandsOn(s, h.defId!, h.productId!, r.score));
      lines.push(`Campaign effectiveness ×${(0.75 + r.score * 0.6).toFixed(2)}`);
    }
    setRes({ ...r, lines });
  };

  const titles: Record<string, [string, string, string]> = {
    code: ["Code a feature", `Fix the details yourself on ${focus?.name ?? "your product"}. Clean code means more progress.`, "⌨️"],
    aicode: ["Code with AI", `Brief the AI on ${focus?.name ?? "your product"}. Vague prompts ship bugs. You still run marketing, deploys and support yourself.`, "🤖"],
    design: ["Design the UX", `Make the usability calls for ${focus?.name ?? "your product"}.`, "🎨"],
    support: ["Answer customer tickets", "Write the replies yourself. Good replies calm customers and lift your reputation.", "🎧"],
    deploy: ["Deploy it yourself", `Take ${target?.name ?? "the app"} live with no DevOps team. Mistakes cause bugs.`, "☁️"],
    market: ["Plan the campaign", `${CAMPAIGNS.find((c) => c.id === h.defId)?.name ?? "Campaign"} for ${target?.name ?? "your product"}. Smart choices make it more effective.`, "📣"],
  };
  const [title, subtitle, emoji] = titles[h.kind];

  return (
    <Frame title={title} subtitle={subtitle} emoji={emoji} onCancel={close}>
      {res ? (
        <ResultView score={res.score} lines={res.lines} onClose={close} />
      ) : h.kind === "code" ? (
        <Quiz questions={code} onDone={(r) => finish("code", r)} />
      ) : h.kind === "aicode" ? (
        <AiPromptTask onDone={(r) => finish("aicode", r)} />
      ) : h.kind === "design" ? (
        <Quiz questions={design} onDone={(r) => finish("design", r)} />
      ) : h.kind === "support" ? (
        <Quiz questions={tickets} ticket onDone={(r) => finish("support", r)} />
      ) : h.kind === "deploy" ? (
        <DeployTask onDone={(r) => finish("deploy", r)} />
      ) : (
        <MarketTask productName={target?.name ?? "your app"} onDone={(r) => finish("market", r)} />
      )}
    </Frame>
  );
}
