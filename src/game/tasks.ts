// Hands-on task content: the technical details you handle when you "do it yourself".

export interface Quiz {
  prompt: string;
  code?: string;
  options: string[];
  answer: number;
  explain: string;
}

export const CODE_QUIZ: Quiz[] = [
  { prompt: "Keep a counter in React component state.", code: "const [count, setCount] = ___(0);", options: ["useState", "useEffect", "useRef"], answer: 0, explain: "useState returns the current value and a setter. useEffect is for side effects." },
  { prompt: "Read the JSON body of a fetch response.", code: "const res = await fetch(url);\nconst data = await res.___();", options: ["text", "json", "parse"], answer: 1, explain: "res.json() parses the response body as JSON and returns a promise." },
  { prompt: "Which HTTP method should create a new todo on the server?", options: ["GET", "DELETE", "POST"], answer: 2, explain: "POST creates resources. GET only reads, and DELETE removes." },
  { prompt: "This loop crashes on the last iteration. What's the bug?", code: "for (let i = 0; i <= items.length; i++) {\n  print(items[i].name);\n}", options: ["Should be i < items.length", "items needs to be a string", "print is async"], answer: 0, explain: "Arrays are 0-indexed, so the last valid index is length - 1. `<=` is an off-by-one error." },
  { prompt: "Where should the payment provider's secret API key live?", options: ["Hard-coded in the frontend", "In an environment variable on the server", "In the git repository README"], answer: 1, explain: "Secrets belong in server-side environment variables, never in code that ships to browsers or git." },
  { prompt: "Run an effect only when userId changes.", code: "useEffect(() => {\n  loadProfile(userId);\n}, [___]);", options: ["userId", "", "loadProfile"], answer: 0, explain: "The dependency array lists values the effect reads. It re-runs only when they change." },
  { prompt: "Get all todos belonging to user 5.", code: "SELECT * FROM todos ___ user_id = 5;", options: ["GROUP BY", "WHERE", "ORDER BY"], answer: 1, explain: "WHERE filters rows. GROUP BY aggregates and ORDER BY sorts." },
  { prompt: "Undo your last commit but keep the changes in your working folder.", options: ["git reset --soft HEAD~1", "git push --force", "git clean -fd"], answer: 0, explain: "`reset --soft` moves the branch back one commit but leaves your changes staged." },
  { prompt: "Users can post comments that appear on other people's screens. What must you do?", options: ["Trust the input", "Escape or sanitize it before rendering", "Make the text smaller"], answer: 1, explain: "Unescaped user input can inject scripts (XSS). Always escape or sanitize before rendering." },
  { prompt: "Why add a database index on todos.user_id?", options: ["It makes lookups by user much faster", "It encrypts the column", "It deletes old rows"], answer: 0, explain: "An index lets the database jump straight to a user's rows instead of scanning the whole table." },
];

export const DESIGN_QUIZ: Quiz[] = [
  { prompt: "The sign-up form needs one clear primary action. Which button?", options: ["A big, high-contrast 'Create account' button", "A tiny grey 'Submit' link", "Five equally bright buttons"], answer: 0, explain: "One obvious primary action with strong contrast reduces hesitation." },
  { prompt: "Pick the most readable body text.", options: ["Light grey 11px on white", "Dark grey 16px on white", "Neon green on yellow"], answer: 1, explain: "Aim for strong contrast and at least 16px for body copy." },
  { prompt: "A user has no tasks yet. What should the screen show?", options: ["A blank page", "A friendly message and an 'Add your first task' button", "A loading spinner forever"], answer: 1, explain: "Empty states should explain what happens next and offer the first action." },
  { prompt: "Choose the best error message.", options: ["Error 0x7F", "Something went wrong.", "We couldn't save your task. Check your connection and tap Retry."], answer: 2, explain: "Good errors say what happened and how to fix it, in plain language." },
  { prompt: "How should the main navigation look?", options: ["12 unlabeled icons", "4 clearly labeled sections", "A hidden menu with no hint"], answer: 1, explain: "Fewer, labeled choices are faster to understand than many cryptic icons." },
  { prompt: "Best onboarding?", options: ["A 12-page tutorial before anything works", "3 quick steps, then let people start", "None: users will figure it out"], answer: 1, explain: "Short onboarding gets people to their first success quickly." },
];

export interface Ticket {
  from: string;
  text: string;
  replies: string[];
  best: number;
  explain: string;
}

export const SUPPORT_TICKETS: Ticket[] = [
  { from: "Sam", text: "All my tasks disappeared after the update!! This is unacceptable.", replies: ["Works fine for me.", "I'm really sorry, Sam. I've restored your tasks from backup and we'll ship a fix tonight.", "Please read our FAQ."], best: 1, explain: "Apologise, fix it, and say what happens next." },
  { from: "Priya", text: "I was charged twice this month.", replies: ["Payments are handled by another company.", "Sorry about that! I've refunded the duplicate charge. You'll see it in 3-5 days.", "Can you prove it with a screenshot?"], best: 1, explain: "Own the problem and fix it before asking for anything." },
  { from: "Marcus", text: "How do I export my data?", replies: ["Settings → Account → Export. Pick CSV or JSON and we'll email a link.", "Why would you want to leave?", "Not possible."], best: 0, explain: "Answer with clear, exact steps." },
  { from: "Lena", text: "Your app is garbage.", replies: ["Thanks for the feedback. What went wrong? I'd love to fix it.", "Then don't use it.", "No it isn't."], best: 0, explain: "Stay calm, thank them, and ask for specifics." },
  { from: "Diego", text: "Can you add dark mode?", replies: ["Great idea! It's on our roadmap. I'll email you when it ships.", "Definitely coming tomorrow.", "We don't take requests."], best: 0, explain: "Be honest and set expectations. Don't promise dates you can't keep." },
  { from: "Aisha", text: "The app is slow when I have lots of tasks.", replies: ["Buy a faster phone.", "Thanks for flagging this. Which device and about how many tasks? Our engineers will look right away.", "Slow is normal."], best: 1, explain: "Gather the details engineers need, then escalate." },
];

export const DEPLOY_STEPS = [
  "Run the test suite",
  "Build the production bundle",
  "Set environment variables & secrets",
  "Run database migrations",
  "Deploy the build to the server",
  "Verify the health-check endpoint",
];

export const DEPLOY_HINTS = [
  "Always test before shipping anything.",
  "Build the bundle only after tests pass.",
  "The server needs its config before it can start.",
  "The database schema must match the new code.",
  "Only now push the new version live.",
  "Finally, confirm the app is actually healthy.",
];

export interface MarketStep {
  title: string;
  principle: string;
  options: { text: string; score: number }[];
}

export function marketSteps(productName: string): MarketStep[] {
  return [
    {
      title: "Who is this campaign for?",
      principle: "Target the people who feel the pain most.",
      options: [
        { text: `People who struggle with exactly what ${productName} solves`, score: 1 },
        { text: "Everyone on the internet", score: 0.4 },
        { text: "People who don't use smartphones", score: 0 },
      ],
    },
    {
      title: "Where will you reach them?",
      principle: "Go where your audience already spends their time.",
      options: [
        { text: "Short social videos and community posts", score: 1 },
        { text: "A newspaper ad in a distant city", score: 0.2 },
        { text: "Email blast to a bought list", score: 0.5 },
      ],
    },
    {
      title: "Pick the headline.",
      principle: "Lead with a concrete benefit, not a vague claim.",
      options: [
        { text: `${productName}: get your day organised in 2 minutes`, score: 1 },
        { text: `${productName} is the best app ever`, score: 0.3 },
        { text: "Download now!!!", score: 0 },
      ],
    },
  ];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/* ---------- coding with AI: you write the prompt ---------- */

export interface PromptCheck {
  id: string;
  label: string; // what a strong prompt includes
  test: RegExp;
  problem: string; // what goes wrong when it's missing
}

export interface PromptTask {
  id: string;
  title: string;
  scenario: string;
  checks: PromptCheck[];
}

export const PROMPT_TASKS: PromptTask[] = [
  {
    id: "share",
    title: "Feature: share a todo list by link",
    scenario: "Users keep asking to share a todo list with a friend using a link. Your stack is Next.js, TypeScript and Postgres. Write the prompt that gets the AI to build this safely.",
    checks: [
      { id: "stack", label: "Your stack (framework, language, database)", test: /(next|react|typescript|postgres|node|stack|framework|database)/i, problem: "You never named your stack. The AI guessed Vue + Firebase and wrote code that doesn't fit your project: a day of rewrites." },
      { id: "reqs", label: "Clear requirements (what exactly it must do)", test: /(must|should|requirement|acceptance|user can|users can|\n\s*(-|\*|\d[.)]))/i, problem: "The goal was vague, so the AI also built accounts, teams and a comments system you never asked for (scope creep)." },
      { id: "security", label: "Security rules (unguessable links, read-only, permissions)", test: /(unguessable|random|uuid|token|expire|expiry|read[- ]only|permission|private|authori[sz]|secur)/i, problem: "Share links used sequential IDs (/share/1, /share/2). Anyone can read everyone's lists: a data leak." },
      { id: "edge", label: "Edge cases (expired, deleted or invalid links, errors)", test: /(edge case|empty|expired|invalid|not found|404|error|fail|revoke|delete)/i, problem: "Nobody mentioned edge cases, so an expired or deleted link crashes the page with a white screen." },
      { id: "tests", label: "Tests or a review step (verify, explain, add tests)", test: /(test|jest|vitest|unit|verify|explain|step[- ]by[- ]step|review)/i, problem: "No tests or explanation: the AI imported a package that doesn't exist (react-share-links-pro) and nothing caught it until deploy." },
    ],
  },
  {
    id: "crash",
    title: "Bug: the app crashes on an empty list",
    scenario: "Users report: \"The app crashes when my todo list is empty.\" Your logs say: TypeError: Cannot read properties of undefined (reading 'map') in TodoList.tsx. Write the prompt that gets a correct, minimal fix.",
    checks: [
      { id: "error", label: "The exact error and file", test: /(typeerror|cannot read|undefined|\.map|todolist|stack ?trace|error message)/i, problem: "You didn't paste the error. The AI rewrote the whole data layer instead of fixing the one failing line." },
      { id: "expected", label: "Expected behaviour (what should happen instead)", test: /(expect|should|instead|empty (list|state)|show (a|an) .*message)/i, problem: "No expected behaviour: the AI 'fixed' the crash by hiding the todo list entirely." },
      { id: "repro", label: "How to reproduce it", test: /(steps?|repro|happens when|when (i|a user|the user|there)|after|click|open)/i, problem: "No reproduction steps: the AI fixed a different bug that you don't actually have." },
      { id: "minimal", label: "Constraints (minimal change, don't refactor)", test: /(minimal|only (change|touch|edit)|don'?t (change|refactor|touch|rewrite)|small change|one file|without (changing|breaking))/i, problem: "No constraints: the AI refactored 14 files and broke the login screen." },
      { id: "tests", label: "A regression test", test: /(test|regression|verify|explain|diff)/i, problem: "No test was requested, so the same bug came back two weeks later." },
    ],
  },
  {
    id: "pay",
    title: "Feature: take payments for a Pro plan",
    scenario: "Add a $5/month Pro plan with Stripe. Your stack is Next.js API routes and Postgres. Write the prompt that gets the AI to build payments you can trust.",
    checks: [
      { id: "stack", label: "Your stack (framework, language, database)", test: /(next|react|typescript|postgres|node|stack|framework|database|api route)/i, problem: "No stack given: the AI wrote an Express server you don't run, so none of it plugs in." },
      { id: "reqs", label: "Clear requirements (plan, price, what Pro unlocks)", test: /(must|should|requirement|\$5|5 ?(usd|dollars)|monthly|pro plan|unlock|\n\s*(-|\*|\d[.)]))/i, problem: "Requirements were fuzzy, so it built one-time payments instead of a monthly subscription." },
      { id: "security", label: "Secrets handling (env vars, server-side only, webhook signature)", test: /(env|environment variable|secret|never (hard-?code|expose|commit)|webhook signature|server[- ]side)/i, problem: "The AI pasted your Stripe secret key into frontend code. Bots found it and drained the account." },
      { id: "edge", label: "Edge cases (declined card, refund, duplicate webhook)", test: /(declin|fail|refund|duplicate|idempotent|retry|cancel|webhook)/i, problem: "No failure cases: customers were charged twice, and declined payments still unlocked Pro." },
      { id: "tests", label: "Testing in sandbox / test mode", test: /(test|sandbox|test mode|verify|explain)/i, problem: "Nothing said to use test mode, so the first 'test' ran on a real credit card." },
    ],
  },
];

export interface PromptResult {
  score: number;
  hits: PromptCheck[];
  misses: PromptCheck[];
  vague: boolean;
}

export function evaluatePrompt(task: PromptTask, raw: string): PromptResult {
  const text = raw.trim();
  const hits = task.checks.filter((c) => c.test.test(text));
  const misses = task.checks.filter((c) => !c.test.test(text));
  const vague = text.length < 40;
  let score = hits.length / task.checks.length;
  if (text.length < 120) score = Math.min(score, 0.75); // a one-liner can't be a great prompt
  if (vague) score = Math.min(score, 0.15);
  return { score, hits, misses, vague };
}
