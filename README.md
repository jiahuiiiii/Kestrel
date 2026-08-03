# Kestrel

**A thesis-driven watchlist monitor for US equities.** You write down _why_ you're
watching a stock — the numbers that have to hold and the events you're waiting for —
and Kestrel watches it for you, in plain language, with receipts.

> **Kestrel is split across two repositories.** This one is the web app.
> The API, database, orchestrator, and ML pipeline live in
> **➜ [github.com/brandontan2003/kestrel_backend](https://github.com/brandontan2003/kestrel_backend)**

> **[Writeup for the Launchpad Challenge](https://github.com/brandontan2003/kestrel_backend/blob/main/WRITEUP.md)**

---

## Why we built this

Every alerting tool on the market answers the wrong question.

Price alerts tell you **that** something moved. They can't tell you **whether the reason
you were watching actually happened.** So investors do the work by hand: re-reading
their own reasoning, skimming news, re-checking fundamentals — and still missing the
moment, or acting on a headline that turns out to be a rumor.

The real thesis looks like this:

> _"I'll buy NVDA if forward P/E stays under 40 **and** they announce a new
> data-center GPU."_

No tool takes that as input. Kestrel does. You give it the quantitative conditions
(`forward_pe < 40`) and the plain-language catalysts (_"NVIDIA announces a new
data-center GPU"_), and every sweep it pulls live fundamentals and live news, uses an
LLM to judge whether your catalysts have actually occurred, and fires a signal **only
when both sides are satisfied**.

The point isn't another alert. It's **explaining the "why not yet"** — the dashboard
shows exactly which conditions are unmet and walks each catalyst from `unconfirmed →
rumored → confirmed`, backed by the verbatim article text that moved it.

---

## How it works

One sweep per tracked thesis. Five stages, each one a pure function the backend
orchestrates:

```
  news.fetch          live articles (Finnhub, 24h window)
       ↓
  llm.classify_batch  two-pass LLM: relevance filter → confirmation judgment
       ↓
  catalysts.apply     state machine: unconfirmed → rumored → confirmed / invalidated
       ↓
  evaluator.evaluate  quant + catalysts under ANY/ALL → firing | not_met | incomplete
       ↓
  proposals.suggest   turns the sweep around and reviews the *thesis itself*
```

### What makes it trustworthy

An LLM that says "yes, that happened" is worthless if it might be making it up. Four
mechanisms keep this honest — **the prompt asks, the code enforces**:

| Mechanism                                                                                                                                                                                                                        | What it prevents                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Verbatim-quote guard** — a confirmation is rejected unless the model returns a quote that appears literally in the article ([`quote_in_article`](https://github.com/brandontan2003/kestrel_backend/blob/main/pipeline/llm.py)) | Hallucinated confirmations. The model cannot confirm a catalyst that the source text doesn't support.        |
| **Four-state catalyst machine** — a rumor is capped at `rumored`; the ladder never moves down except on a credible `invalidated`                                                                                                 | One speculative blog post flipping your thesis to "go". News contradicts itself; a boolean can't model that. |
| **Three-valued quant** — pass / fail / **couldn't evaluate**                                                                                                                                                                     | A data outage masquerading as a failed condition. `incomplete` is never silently reported as `not_met`.      |
| **Code-guarded proposals** — a suggestion naming an unfetchable metric, an invented row id, or a nonexistent article is dropped before you ever see it                                                                           | The agent quietly rewriting your reasoning. Nothing is ever applied automatically.                           |

### The part we're proudest of

After each sweep the agent reviews **your thesis**, not just the stock — raise a
threshold reality can't meet, drop a metric that never resolves, surface a catalyst the
news suggests you should have been watching. Each suggestion lands in a queue you
approve or reject. Two-way: you monitor the market, and the thesis you wrote three
weeks ago gets monitored too.

When a signal fires or a proposal lands, it's pushed to **Telegram** — you don't have
to be looking at the dashboard.

---

## What you can do

- **Auth** — register / login / logout, HttpOnly JWT cookies with silent refresh on expiry.
- **Theses** — create, view, edit, and soft-delete from the UI. Editing diffs the form
  against the loaded thesis and touches only changed rows, so re-wording one catalyst
  never disturbs another's evidence trail.
- **Dashboard** — live watchlist: signal status, readiness meter, real current values.
- **Thesis detail** — the reasoning panel: each catalyst's state, confidence, source,
  and the **verbatim supporting quote**, plus an explicit `blocked_by` for why it isn't firing.
- **Proposals** — approve/reject queue with the concrete diff each change would make.
- **Notifications** — Telegram delivery on signal fire and on new proposals.
- **Live updates** — WebSocket push, with a 30s poll fallback on every view.

---

## Tech stack

| Layer            | Stack                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Frontend**     | React 18 · Vite 5 · React Router 7 · Tailwind CSS v4 (config-less, via `@tailwindcss/vite`) · Iconify |
| **Backend**      | Python · FastAPI · SQLAlchemy 2 (async) · Pydantic v2 · asyncpg · python-jose (JWT) · WebSockets      |
| **Database**     | PostgreSQL 17, migrations via Flyway                                                                  |
| **Intelligence** | OpenAI (two-pass classifier + thesis reviewer), custom state machine + evaluator                      |
| **Market data**  | Finnhub (news + fundamentals, primary) · yfinance (keyless fallback)                                  |
| **Delivery**     | python-telegram-bot                                                                                   |
| **Deploy**       | Frontend on Vercel · Backend + Postgres on Railway · Docker Compose for local                         |

---

## Project structure

Kestrel is two repositories.

| Repo                                                                                  | Contents                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **This repo** — [`jiahuiiiii/Kestrel`](https://github.com/jiahuiiiii/Kestrel)         | React web app                                            |
| [`brandontan2003/kestrel_backend`](https://github.com/brandontan2003/kestrel_backend) | FastAPI API, database, orchestrator, and the ML pipeline |

### Frontend (this repo)

```
src/
├── main.jsx                   app entry
├── App.jsx                    router, WebSocket subscription, pending-proposal badge
├── index.css                  Tailwind v4 + glassmorphism design tokens
├── api/
│   ├── client.js              fetch wrapper — /api/v1 base, {status,result} unwrap,
│   │                          cookie auth, auto-refresh on 401
│   └── adapt.js               backend DTOs → component-shaped data (filters soft-deleted rows)
├── context/AuthContext.jsx    real register / login / logout / me
├── hooks/useWs.js             WebSocket with auto-reconnect
├── lib/
│   ├── thesisDiff.js          diffs an edited thesis → minimal POST/PUT/DELETE set
│   └── readiness.js           how close a thesis is to firing
├── components/                ThesisCard, AgentReasoningPanel, EditThesisModal,
│                              ReadinessMeter, TickerCombobox, NotificationChannels, …
└── pages/
    ├── Dashboard.jsx          watchlist overview
    ├── ThesisDetail.jsx       conditions, catalysts, agent-reasoning panel
    ├── Proposals.jsx          approve/reject queue
    ├── Notification.jsx       alert history
    └── Account.jsx            profile + Telegram connection
```

API request/response shapes are documented in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

### Backend (separate repo)

```
app/
├── api/v1/          REST controllers (theses, evaluations, proposals, auth, alerts)
├── service/         scheduler_service (the sweep loop) · ml_adapter · quant_service
│                    proposal_generator · telegram_service · …
├── repository/      async SQLAlchemy data access
├── dto/             Pydantic request/response models
└── websocket/       connection manager + server-initiated push
pipeline/            the ML package — news · llm · catalysts · evaluator · proposals
                     (pure functions, no DB or web deps, independently tested)
```

The pipeline is **vendored** into the backend and imported in-process: the backend owns
the loop, the pipeline owns the judgment.

---

## Running locally

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

Defaults to a backend at `http://localhost:8000`; override with `VITE_API_BASE_URL`
(and `VITE_WS_URL`). It must run on `:5173` — that's the backend's CORS allowlist. In
production the API is same-origin, proxied to Railway by [`vercel.json`](vercel.json).

| Command           | What it does               |
| ----------------- | -------------------------- |
| `npm run dev`     | Vite dev server with HMR   |
| `npm run build`   | Production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint`    | ESLint                     |

### Backend

```bash
git clone https://github.com/brandontan2003/kestrel_backend
cd kestrel_backend
cp .env.example .env.dev      # fill in JWT_SECRET_KEY, FINNHUB_API_KEY, OPENAI_API_KEY
docker compose up -d --build  # Postgres 17 + Flyway + API on :8000
```

Interactive API docs at http://localhost:8000/docs.

The scheduler is off by default (`SCHEDULER_ENABLED=false`) — trigger a sweep manually:

```bash
docker compose exec kestrel-backend-service python -m app.scripts.run_scheduler_once
```

### Try it

1. Sign up at http://localhost:5173.
2. **+ New thesis** — a ticker, some quant conditions, and/or catalysts.
3. Run a sweep, then refresh.

| Ticker  | Conditions                                                       | Expected                                                                                                        |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `AAPL`  | `forward_pe < 1000`, no catalysts                                | 🟢 **firing**                                                                                                   |
| `MSFT`  | `forward_pe < 3`                                                 | **not_met** — and a great proposals demo: a threshold reality can't meet is exactly what the reviewer looks for |
| `GOOGL` | `forward_pe < 40` **AND** `price_to_book < 2`                    | **not_met** (one fails)                                                                                         |
| `NVDA`  | `forward_pe < 1000` + _"NVIDIA announces a new data-center GPU"_ | full LLM pipeline — check the evidence trail                                                                    |

> Catalyst theses classify live news through the LLM each sweep (~a few cents, 1–2 min).
> Quant-only theses are fast and cheap.
