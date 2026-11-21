# Nine Nines

A browser story game about building a software company. Start in a garage with $5,000, ship an app, grow your traffic, hire and manage a team, buy tools, move into real offices, raise funding, and ring the IPO bell.

Built with Next.js (App Router), React, TypeScript and Zustand. Saves live in your browser's local storage.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## How the game works

It's a story told in a full-screen world you walk around in. The camera follows your avatar, your cash is always at the top, and story beats play out as conversations: press **Enter** (or click Next) to advance, and pick a reply when choices appear.

1. **The bedroom.** You create an avatar and start coding a prototype of *Pocket Todo* at your laptop.
2. **The partner.** Maya walks in on night one and chats with you. When the prototype is about 40% done she returns and asks: *"Can we create a company?"* Say yes, name the company, and she invests $20,000 for 25%. You move into the garage.
3. **The first hires.** Alone, you can only get a prototype to 60%. Walk to Maya's desk and hire an **Application Engineer** to finish it. Then hire a **DevOps Engineer**, go to the DevOps desk, and **host** it. Now you launch.
4. **Grow.** Marketing campaigns bring users. Servers have a capacity, so DevOps and infrastructure tools keep up with traffic. Support, design, managers, new products, funding rounds, bigger offices, and finally an IPO.

### Walking and dashboards

- Walk with the **arrow keys / WASD** (on-screen pad on touch). Your avatar animates, faces the way it walks, and collides with desks.
- Walk up to a desk and press **E** (or the pop-up button) to open that desk's dashboard. Walk away and it closes.
  - Director desk: overview, goals, focus, company tree, your laptop
  - Partner desk: hiring, office upgrades, perks, business tools
  - Engineering, DevOps, Design, Marketing, Support desks appear as the company needs them
- Press **E** near a teammate to talk (1:1, raise, move to or from remote, let go). Use ☕ 📝 🚪 the same way.
- **Company tree** (top bar): the org chart, with vacant departments shown as "not formed yet".

### Do it yourself, or hire

Every job has two options. At each department desk you can **do it yourself** or **hire an employee**:

| Job | Do it yourself (hands-on) | Hire |
| --- | --- | --- |
| Engineering | Answer real coding questions (React, HTTP, SQL, git, security). Your score sets progress. | Application engineers code automatically |
| DevOps | Run the deployment steps in the right order. Mistakes add launch bugs. Takes ~8 days. | A DevOps engineer deploys faster and adds server capacity |
| Design | Make usability decisions. Good calls raise quality. | Designers raise quality every day |
| Marketing | Plan each campaign: audience, channel, headline. Good plans boost its effectiveness. | Marketers boost every campaign |
| Support | Reply to customer tickets. Good replies boost capacity for 8 days. | Support staff clear tickets daily |

**Maya is your HR manager.** She sources and screens candidates (shown inline on every desk's dashboard), keeps everyone's morale +3, and runs check-ins when someone drops below 40.

### Office or remote

Each hire is either **in office** (needs a free desk, benefits from perks) or **remote** (no desk or rent, salary −15%, but output −12%, lower morale and a bit more management load). Remote people show up on a video wall in the scene. You can switch anyone from their card.

Other keys: `Space` pause, `1` / `2` / `3` set speed (1×, 3×, 8×).

## Project layout

```
src/game/     pure game logic (types, data, engine tick, story + random events, scene layout)
src/store/    Zustand store with localStorage persistence
src/components/  React UI (walkable scene, avatars, desk dashboards, company tree, overlays)
scripts/sim.ts   headless bot to sanity-check balance: npm run sim
legacy/       the original single-file "system design" prototype
```
