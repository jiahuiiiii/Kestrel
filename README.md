# Kestrel — Frontend

The React web app for Kestrel, a thesis-driven watchlist monitor for US equities.
This repo is the **frontend only**. It currently runs on **mock data** (`src/data/mock.js`)
— no backend needed to develop or demo the UI. See `bot_plan.md` / `CLAUDE.md` for the
full project spec.

## Prerequisites

- **Node.js 18+** (Vite 5 requires it — check with `node -v`)
- **npm** (comes with Node)

## Quick start

```bash
git clone <repo-url>
cd Kestrel
npm install          # install dependencies
npm run dev          # start the dev server
```

Open the URL Vite prints (usually **http://localhost:5173**). Hot-reload is on —
save a file and the browser updates.

That's it. No `.env`, no database, no backend required yet.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── main.jsx                  app entry
├── App.jsx                   router + routes + background
├── index.css                 Tailwind + glassmorphism design tokens
├── api/client.js             typed fetch wrapper (stubbed — points at future FastAPI)
├── hooks/useWs.js            WebSocket hook w/ auto-reconnect (for live updates)
├── context/AuthContext.jsx   demo auth (localStorage-backed, no real backend)
├── data/mock.js              ← all placeholder data lives here
├── components/               NavBar, ThesisCard, Modal, notification UI, etc.
└── pages/
    ├── Dashboard.jsx         watchlist overview
    ├── ThesisDetail.jsx      conditions, catalysts, agent-reasoning panel
    ├── Proposals.jsx         approve/reject queue
    └── Account.jsx           profile + alert-channel settings
```

## Good to know

- **Design:** dark glassmorphism. Shared tokens + the `.glass` / `.glass-strong`
  helpers are in `src/index.css`. Tailwind v4 (config-less, via `@tailwindcss/vite`).
- **Auth is a prototype.** Sign-in/account state persists to `localStorage`
  (`kestrel_user`) — there's no real password check. Swap `AuthContext` for real
  API calls when the backend lands.
- **Data is mocked.** When the FastAPI backend exists, replace `mock.js` imports
  with `api.*` calls from `src/api/client.js`, and set `VITE_API_BASE_URL` /
  `VITE_WS_URL` in a `.env` file.
- **Account page previews with demo data.** `/account` shows a placeholder
  (John Doe) when you're signed out, so you can see the layout without signing in.
  Sign in to manage the real (localStorage) account.

## Troubleshooting

- **Port 5173 in use** → Vite auto-picks the next free port; check the terminal.
- **Blank page / "React is not defined"** → make sure `@vitejs/plugin-react` is in
  `vite.config.js` (it is) and restart `npm run dev`.
