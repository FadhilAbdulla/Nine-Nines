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

- **Products**: pick an idea (Pocket Todo → Streaks → Snapfilter → Huddle → Ledgerly → Orbit AI). Dev points build it, design points set launch quality. Only your *focus* product gets work.
- **Market**: run campaigns to pull in traffic. Quality, reputation and marketers decide how well they convert. Bugs and unanswered support tickets make users churn.
- **Team**: hire devs, designers, marketers, support and managers. Each manager supports 6 people; overload cuts output. Keep morale up with 1:1s, raises and perks, or people quit.
- **Tools**: laptops, CI, analytics, helpdesk, cloud hosting, security and more. One-time cost plus a monthly subscription.
- **Office**: Garage → Co-working → Small office → Tower floor → Glass HQ. Walk your founder around, talk to teammates, use the coffee machine, whiteboard and the door (networking).
- **Story**: narrative beats and random events pause the game and ask you to choose. Investors offer Seed, Series A and Series B (you give up equity). Reach a $500M valuation with a 40+ team, Glass HQ and a solid reputation to go public.
- Running out of cash for 10 days closes the company.

Keys: `Space` pause, `1` / `2` / `3` set speed (1×, 3×, 8×).

## Project layout

```
src/game/     pure game logic (types, data, engine tick, story + random events)
src/store/    Zustand store with localStorage persistence
src/components/  React UI (office scene, panels, overlays)
scripts/sim.ts   headless bot to sanity-check balance: npm run sim
legacy/       the original single-file "system design" prototype
```
