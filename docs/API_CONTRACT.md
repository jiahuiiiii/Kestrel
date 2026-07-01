# Kestrel API Contract

**Status:** v1 draft — derived from what the frontend actually consumes today.
**Base URL:** `VITE_API_BASE_URL` (default `http://localhost:8000`)
**WebSocket URL:** `VITE_WS_URL` (default `ws://localhost:8000/ws`)

## Conventions

- **Transport:** JSON over HTTP. All requests/responses are `Content-Type: application/json`.
  ([client.js](../src/api/client.js) sets this header on every call.)
- **Field casing:** JSON object fields are **camelCase** (`lastEvaluated`, `quantConditions`,
  `currentValue`). The two exceptions, both already baked into the code, are:
  - **Query parameter** names use snake_case: `?thesis_id=…`.
  - **Enum identifier values** use snake_case: metric keys (`forward_pe`), proposal types
    (`adjust_threshold`).
- **IDs:** integers (`t.id === Number(id)` in [ThesisDetail.jsx:12](../src/pages/ThesisDetail.jsx#L12)).
- **Timestamps:** ISO 8601 UTC strings, e.g. `"2026-07-01T06:00:00Z"` (parsed with `new Date(...)`).
- **Nullable fields:** send explicit `null`, not omitted, where the UI checks `!= null` /
  `?? '—'` (e.g. `currentValue`, `quote`, `articleHeadline`, `resolvedAt`).
- **Auth:** none is wired yet (auth is localStorage-only, see [AuthContext.jsx](../src/context/AuthContext.jsx)).
  When added, expect `Authorization: Bearer <token>`; this contract assumes an authenticated
  user context server-side.
- **Pagination:** list endpoints (`GET /theses`, `GET /evaluations`) accept `?limit=` and
  `?offset=` query params and return a **paginated envelope** rather than a bare array:

  ```json
  {
    "data": [
      /* items */
    ],
    "total": 128,
    "limit": 50,
    "offset": 0
  }
  ```

  - `limit`: integer, default `50`, max `200`.
  - `offset`: integer, default `0`.
  - `total`: total count ignoring `limit`/`offset` (drives "has more" / page count).
  - Omitting both params returns the first page at the default limit.
    > The current client calls these without params and treats the result as an array
    > ([client.js](../src/api/client.js)); it must be updated to read `.data` when pagination ships.
    > Non-list endpoints return bare objects (no envelope).

---

## Core object shapes

### `Thesis`

Consumed by [ThesisCard.jsx](../src/components/ThesisCard.jsx),
[ThesisDetail.jsx](../src/pages/ThesisDetail.jsx),
[Dashboard.jsx](../src/pages/Dashboard.jsx).

| field             | type               | notes                                                                                                                           |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | integer            |                                                                                                                                 |
| `ticker`          | string             | e.g. `"NVDA"`                                                                                                                   |
| `name`            | string             | e.g. `"NVIDIA Corporation"`                                                                                                     |
| `sector`          | string             | e.g. `"Semiconductors"`                                                                                                         |
| `signal`          | boolean            | true when all conditions met                                                                                                    |
| `status`          | enum               | `"watching"` \| `"signal"` \| `"paused"` (see [StatusIndicator.jsx](../src/components/StatusIndicator.jsx))                     |
| `lastEvaluated`   | ISO 8601 string    | last sweep time                                                                                                                 |
| `notes`           | string             | free text, may be `""`                                                                                                          |
| `quantConditions` | `QuantCondition[]` |                                                                                                                                 |
| `catalysts`       | `Catalyst[]`       |                                                                                                                                 |
| `evaluations`     | `Evaluation[]`     | newest first. **List** (`GET /theses`) returns only the 3 most recent; **detail** (`GET /theses/{id}`) returns the full history |

### `QuantCondition`

| field          | type           | notes                                                                                                                                                            |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | integer        |                                                                                                                                                                  |
| `metric`       | enum           | `forward_pe` \| `pb_ratio` \| `ev_ebitda` \| `price_vs_ma200` \| `ps_ratio` \| `debt_to_equity` (see [ConditionBadge.jsx](../src/components/ConditionBadge.jsx)) |
| `operator`     | enum           | `"<"` \| `">"` \| `"<="` \| `">="` \| `"=="` (rendered verbatim)                                                                                                 |
| `value`        | number         | threshold                                                                                                                                                        |
| `currentValue` | number \| null | rendered `.toFixed(1)`; `null` → `"—"`                                                                                                                           |
| `met`          | boolean        |                                                                                                                                                                  |

### `Catalyst`

| field         | type                    | notes                                                  |
| ------------- | ----------------------- | ------------------------------------------------------ |
| `id`          | integer                 |                                                        |
| `description` | string                  |                                                        |
| `triggered`   | boolean                 |                                                        |
| `triggeredAt` | ISO 8601 string \| null | only meaningful when `triggered === true`; else `null` |

### `Evaluation`

Consumed by [AgentReasoningPanel.jsx](../src/components/AgentReasoningPanel.jsx).

| field             | type               | notes                                         |
| ----------------- | ------------------ | --------------------------------------------- |
| `id`              | integer            |                                               |
| `timestamp`       | ISO 8601 string    |                                               |
| `signal`          | boolean            |                                               |
| `quantResults`    | `QuantResult[]`    | snapshot of conditions at eval time (no `id`) |
| `catalystResults` | `CatalystResult[]` | may be `[]` (no articles found)               |
| `reason`          | string             | agent's natural-language summary              |

**`QuantResult`:** `{ metric, operator, value, currentValue, met }` — same as `QuantCondition`
minus `id`.

**`CatalystResult`:**

| field             | type           | notes                                                  |
| ----------------- | -------------- | ------------------------------------------------------ |
| `description`     | string         |                                                        |
| `verdict`         | boolean        | confirmed / not confirmed                              |
| `confidence`      | number \| null | 0.0–1.0; rendered as a bar + `%`. `null` hides the bar |
| `quote`           | string \| null | supporting excerpt; `null` when none                   |
| `articleHeadline` | string \| null | source headline; `null` when none                      |

### `Proposal`

Consumed by [Proposals.jsx](../src/pages/Proposals.jsx).

| field            | type                    | notes                                                     |
| ---------------- | ----------------------- | --------------------------------------------------------- |
| `id`             | integer                 |                                                           |
| `thesisId`       | integer                 | links to a `Thesis`                                       |
| `ticker`         | string                  | denormalized for display                                  |
| `type`           | enum                    | `adjust_threshold` \| `add_catalyst` \| `remove_catalyst` |
| `status`         | enum                    | `pending` \| `approved` \| `rejected`                     |
| `createdAt`      | ISO 8601 string         |                                                           |
| `resolvedAt`     | ISO 8601 string \| null | set when status leaves `pending`; else `null`             |
| `proposedChange` | object                  | shape varies by `type` (below); always has `rationale`    |

**`proposedChange` by type:**

- `adjust_threshold`: `{ metric, currentValue, suggestedValue, rationale }`
  (`metric` = same enum as conditions; `currentValue`/`suggestedValue` = numbers)
- `add_catalyst`: `{ description, rationale }`
- `remove_catalyst`: `{ catalystId, description, rationale }`
  (`catalystId` references an existing `Catalyst.id`; `description` denormalized for display)

---

## HTTP endpoints

All paths as defined in [client.js](../src/api/client.js).

### `GET /theses`

List all theses for the user. Returns the dashboard grid + counts. Each thesis is the full
`Thesis` object **except** that `evaluations` is capped to the **3 most recent** entries (newest
first) — enough to drive the dashboard without shipping unbounded history. Use `GET /theses/{id}`
for a thesis's complete evaluation history.

- **Query (optional):** `limit`, `offset` (see [Pagination](#conventions)).
- **Response `200`:** paginated envelope of `Thesis` objects (each with ≤3 `evaluations`).

```json
{
  "data": [
    {
      "id": 1,
      "ticker": "NVDA",
      "name": "NVIDIA Corporation",
      "sector": "Semiconductors",
      "signal": false,
      "status": "watching",
      "lastEvaluated": "2026-07-01T06:00:00Z",
      "notes": "Waiting for valuation to compress…",
      "quantConditions": [
        {
          "id": 1,
          "metric": "forward_pe",
          "operator": "<",
          "value": 28,
          "currentValue": 31.2,
          "met": false
        }
      ],
      "catalysts": [
        {
          "id": 1,
          "description": "Hyperscaler capex guidance cut",
          "triggered": false,
          "triggeredAt": null
        }
      ],
      "evaluations": [
        /* up to 3 most recent Evaluation objects, newest first */
      ]
    }
  ],
  "total": 4,
  "limit": 50,
  "offset": 0
}
```

### `GET /theses/{id}`

Single thesis with full evaluation history.

- **Response `200`:** `Thesis` including `evaluations` (**newest first** — the picker uses index 0
  as the default/active eval, [ThesisDetail.jsx:14](../src/pages/ThesisDetail.jsx#L14)).
- **Response `404`:** thesis not found (UI shows "Thesis not found").

### `POST /theses`

Create a thesis. Server assigns `id`s, computes `met`/`currentValue`/`signal`/`status`, and
performs the first evaluation.

- **Request body:**

```json
{
  "ticker": "NVDA",
  "name": "NVIDIA Corporation",
  "sector": "Semiconductors",
  "notes": "optional free text",
  "quantConditions": [{ "metric": "forward_pe", "operator": "<", "value": 28 }],
  "catalysts": [
    { "description": "Hyperscaler capex guidance cut in earnings call" }
  ]
}
```

- **Response `201`:** the created `Thesis` (full shape).
- **Errors:** `400` (validation — bad `metric`/`operator`, missing `ticker`), `422` (unknown ticker).

### `PATCH /theses/{id}`

Partial update (edit notes, thresholds, add/remove conditions or catalysts, pause). Any subset of
the create fields plus `status`.

- **Request body (example):** `{ "status": "paused" }` or
  `{ "quantConditions": [ { "id": 1, "value": 30 } ] }` (include `id` to update in place; omit to add).
- **Response `200`:** the updated `Thesis`.
- **Errors:** `400`, `404`.

### `DELETE /theses/{id}`

- **Response `204`:** no body.
- **Errors:** `404`.

### `GET /proposals`

- **Response `200`:** `Proposal[]` (unpaginated — proposal volume is small). The UI splits
  `status === "pending"` vs. the rest; the nav badge counts pending ([App.jsx](../src/App.jsx)).

### `POST /proposals/{id}/approve`

Approve a pending proposal; server applies the change to the underlying thesis.

- **Request:** none.
- **Response `200`:** both the updated `Proposal` **and** the mutated `Thesis`, so the client can
  repaint the proposal card and the affected thesis in one round-trip (no refetch, no stale UI).

```json
{
  "proposal": {
    "id": 1,
    "status": "approved",
    "resolvedAt": "2026-07-01T09:00:00Z",
    "...": "..."
  },
  "thesis": {
    "id": 1,
    "ticker": "NVDA",
    "...": "/* full Thesis with the change applied */"
  }
}
```

- **Errors:** `404`; `409` if already resolved.

### `POST /proposals/{id}/reject`

Rejecting discards the suggestion, so no thesis is mutated — the response is the proposal only.

- **Response `200`:** the updated `Proposal` (`status: "rejected"`, `resolvedAt` set).
- **Errors:** `404`; `409` if already resolved.

### `GET /evaluations?thesis_id={id}`

Evaluation history for a thesis (used where evals aren't inlined).

- **Query:** `thesis_id` (integer, snake_case — matches [client.js:23](../src/api/client.js#L23),
  **required**); optional `limit`, `offset` (see [Pagination](#conventions)).
- **Response `200`:** paginated envelope of `Evaluation` objects, newest first.

```json
{
  "data": [
    /* Evaluation[] */
  ],
  "total": 128,
  "limit": 50,
  "offset": 0
}
```

- **Errors:** `400` (missing/invalid `thesis_id`).

---

## WebSocket

**URL:** `ws://localhost:8000/ws` ([useWs.js](../src/hooks/useWs.js)). Client auto-reconnects 3s
after close. The client parses every frame as JSON and silently drops malformed frames, so the
server **must** send valid JSON text frames.

### Envelope

Every message is a typed envelope:

```json
{ "type": "<event>", "payload": { … } }
```

`type` is the discriminator; `payload` shape depends on it. Unknown `type`s must be safely
ignorable by the client.

### Events

#### `type: "alert"`

A thesis just fired a signal — drives in-app toast/notification ("In-app alerts stream live over
WebSocket", [NotificationChannels.jsx:130](../src/components/NotificationChannels.jsx#L130)).

```json
{
  "type": "alert",
  "payload": {
    "thesisId": 2,
    "ticker": "AAPL",
    "title": "Signal triggered: AAPL",
    "message": "All 2/2 quant conditions met. Catalyst confirmed (0.94).",
    "evaluationId": 201,
    "timestamp": "2026-07-01T06:00:00Z"
  }
}
```

#### `type: "thesis_updated"`

A thesis's evaluated state changed (new sweep, condition/catalyst flip). Client should refresh /
patch the corresponding `Thesis` in place.

```json
{
  "type": "thesis_updated",
  "payload": {
    "thesis": {
      /* full Thesis object, evaluations optional */
    }
  }
}
```

#### `type: "evaluation_completed"`

A new evaluation was appended for a thesis (for live-updating the reasoning panel / history).

```json
{
  "type": "evaluation_completed",
  "payload": {
    "thesisId": 1,
    "evaluation": {
      /* full Evaluation object */
    }
  }
}
```

#### `type: "proposal_created"`

The agent generated a new proposal — updates the nav pending badge and Proposals list.

```json
{
  "type": "proposal_created",
  "payload": {
    "proposal": {
      /* full Proposal object */
    }
  }
}
```

> `alert` is the only event the current UI copy explicitly promises. `thesis_updated`,
> `evaluation_completed`, and `proposal_created` are defined here so the backend and a future
> live-refresh layer agree; they can ship incrementally.

---

## Error responses

Any non-2xx makes the client `throw new Error("<status> <statusText>")`
([client.js:8](../src/api/client.js#L8)) — so the **HTTP status code is the contract**; the body
is for humans/logs. Use a consistent body:

```json
{
  "error": {
    "code": "validation_error",
    "message": "operator must be one of '<', '>'",
    "details": { "field": "quantConditions[0].operator" }
  }
}
```

| status                      | when                                                |
| --------------------------- | --------------------------------------------------- |
| `400 Bad Request`           | malformed body / invalid enum / missing query param |
| `401 Unauthorized`          | missing/invalid auth (once auth lands)              |
| `403 Forbidden`             | authenticated but not owner of the resource         |
| `404 Not Found`             | unknown `id` (thesis/proposal)                      |
| `409 Conflict`              | proposal already approved/rejected                  |
| `422 Unprocessable Entity`  | well-formed but unactionable (e.g. unknown ticker)  |
| `500 Internal Server Error` | unexpected failure                                  |

`code` values (stable, snake_case): `validation_error`, `not_found`, `already_resolved`,
`unknown_ticker`, `unauthorized`, `forbidden`, `internal_error`.

---

## Implementation notes (FastAPI)

If the backend is built with FastAPI, it auto-generates docs from the endpoint type hints:

- **`GET /openapi.json`** — the machine-readable OpenAPI (Swagger) spec: every REST endpoint, its
  method/path, and request/response schemas, generated from the code so it never drifts from what
  actually runs. This is the implementation-side counterpart to this hand-written contract: this
  doc is what we **design toward**; `/openapi.json` describes what was **built**. Diff them to
  catch drift.
- **`GET /docs`** — interactive Swagger UI rendering of that spec, with a "Try it out" button that
  fires real requests at the running server. Handy for exploring/testing endpoints without curl.

Caveats:

- OpenAPI covers **HTTP only** — it does **not** document the WebSocket events (`alert`,
  `thesis_updated`, …). The [WebSocket](#websocket) section of this doc stays the source of truth
  for those.
- Auto-generated schemas reflect the code's response _models_, not response-shaping done in
  handler bodies. The `evaluations` cap on `GET /theses` (3 most recent) must be enforced in code
  and won't necessarily show up in the schema — keep it documented here.

## Resolved decisions

- **`operator` set:** `<`, `>`, `<=`, `>=`, `==`.
- **List payload:** `GET /theses` returns full `Thesis` objects, but `evaluations` is capped to
  the **3 most recent** per thesis. `GET /theses/{id}` returns the complete evaluation history.
- **Pagination:** `GET /theses` and `GET /evaluations` are paginated via `limit`/`offset` and
  return a `{ data, total, limit, offset }` envelope. `GET /proposals` stays unpaginated.
- **Approve/reject return:** `approve` returns `{ proposal, thesis }` (both, one round-trip);
  `reject` returns the `Proposal` only (no thesis is mutated).

## Open questions to confirm before locking v1

1. **WebSocket auth & scoping** — how is the socket authenticated, and is it per-user scoped so a
   client only receives its own theses' events?
