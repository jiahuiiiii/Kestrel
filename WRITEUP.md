# Kestrel — Semi-autonomous monitoring of investment theses

## Problem

Retail participation in equities keeps rising, but decision quality lags. Franklin Templeton's 2021 Next-Gen survey of young Singaporeans found ~80% invest, yet a third find choosing investments difficult; a 2025 NBER study found the median retail investor spends six minutes researching a stock before trading. The bottleneck isn't data access — it's the time to continuously check whether the reasons you bought still hold.

Most retail tools focus on prices, indicators, or predefined events rather than continuously evaluating a *user-written qualitative catalyst* as a stateful condition in a broader thesis (Appendix C).

Why this needs an agent, not a single call: a thesis is a *conjunction* of quantitative conditions and qualitative catalysts, and the catalyst half is *stateful and temporal* — one catalyst evolves across many articles over days (rumored → confirmed → invalidated) from sources of varying credibility. Evaluating that continuously and unattended, alongside live fundamentals, is a multi-step loop, not a prompt. We fixed four *safety invariants* before building (below); success is also defined by outcome targets — ≥95% confirmation precision, ≥90% relevant-article recall, detection under 30 minutes — which remain future work (Appendix C).

## Approach

Each sweep is an autonomous multi-step loop: fetch news → two-pass classify → apply a catalyst state machine → evaluate → propose thesis refinements. It runs unattended — maintaining state and checking the thesis continuously rather than waiting for a user to ask.

We use an LLM for catalysts rather than keyword matching, which can't tell a signed contract from a rumored one. The classifier runs two passes — a cheap relevance filter, then an expensive confirmation judgment — instead of judging every article, since most news is irrelevant.

An LLM left to run unattended fails *silently*, so four checks are enforced in code, not merely requested in a prompt:

- **Quote-traceability guard:** a state-changing verdict is voided unless its cited quote appears verbatim in the stored headline or summary. It guarantees traceability to source text, not entailment.
- **Four-state catalyst machine** (unconfirmed → rumored → confirmed → invalidated): speculation is capped at *rumored*, and the ladder never descends except on a credible invalidation.
- **Three-valued quant** (pass / fail / couldn't-evaluate): a data outage surfaces as *incomplete*, never a silent *not_met*.
- **Guard on self-modification:** the agent proposes edits to the *thesis itself*, but code drops any that would flip a failing condition to passing on its current value — it can't weaken the thesis into always firing.

Every proposal lands in an approve/reject queue; we deliberately did **not** build trade execution or auto-applied edits. The autonomy boundary — agent monitors, human decides — is the central design choice.

## Evidence

The guard logic is covered by 55 unit tests over pure functions (no DB, no network): every transition is a named, passing test — speculation caps at rumored, a fabricated quote voids a verdict, missing data yields *incomplete*. These establish rule-correctness, not end-to-end monitoring quality (see Honesty).

Two comparisons vs. the naive baseline (`eval/`):

**State machine vs. a history-insensitive boolean** (deterministic, reproducible). Over 16 curated state-transition sequences — signed-then-blocked mergers, a denied rumor, reports never credibly confirmed — the state machine produced no false final confirmations; the boolean ("fire if any article ever confirmed") produced six. The sequences start from given classifications, isolating the value of *retaining state*, not end-to-end extraction.

**Guarded confirmation pass vs. a single-call baseline** (same model; benchmarks the guarded Pass 2, not the full two-pass pipeline). On an 18-case adversarial smoke-test set both models classified every case correctly (precision/recall 1.0). On a frontier model both hallucinated nothing; on `gpt-5.4-mini`, of six positive cases the single call fabricated a source-absent quote on one, which the guarded pass rejected (0 *by construction*). The guards don't improve the verdict; they guarantee its evidence is traceable — a gap absent on the frontier model that emerged on the cheaper one.

Per-case breakdowns in Appendix A.

## Constraints

The native limits are latency, cost, and data reliability.

- **Latency.** The guarded confirmation pass averaged ~2.2s vs. ~1.4s for the unguarded single call — one mean; percentiles and full-sweep timing not yet measured. An on-demand `evaluate` endpoint keeps evaluation controllable.
- **Cost (measured).** In one 20-article, 3-catalyst stream replay (60 pairs), Pass 1 kept every relevant pair (recall 1.0) while dropping ~88%, running ~6–7 Pass-2 calls instead of 60 — cutting this replay's cost ~87–89% and tokens ~86% (exact committed figures in `eval/results/tier_c.json`). The guarded pass is ~4.6× a single call per catalyst (Tier B), but Pass 1 keeps such calls rare. Dollars follow `PRICING`; token counts are exact.
- **Reliability.** Finnhub is primary; yfinance is a keyless fallback, so a provider outage degrades rather than halts monitoring. Disagreement and fallback rates aren't yet measured.

## Honesty & Trajectory

Known limitations — including ones a reviewer can find in the repo:

- **The guards are a reliability floor, not an accuracy win.** On a frontier model they changed nothing; on `gpt-5.4-mini` the single call fabricated a supporting quote where the guarded pass held at 0 by construction — same verdict accuracy, but only the guarded path guarantees the cited evidence is traceable to the stored source text. Whether the gap widens on weaker models is untested.
- **Evaluation scope.** Tier B benchmarks the guarded confirmation pass; Tier C measures the two-pass pipeline's *economics* end-to-end but not its *accuracy*; eval sets are small and synthetic; Tier A begins from hand-authored classifications; we report no repeated-run variance and no decision-quality evaluation yet. The 55 tests prove rule-correctness, not useful monitoring.
- **"Verbatim support" is traceability, not truth.** The guard checks substring presence in the stored headline/summary; it does not verify entailment, context, or source credibility.
- **Precision over recall, by design;** LLM dependency (quant unaffected); a 24-hour news window; per-condition values not yet persisted.

The cheap-model result is one run on 18 cases; next is repeated runs (≥3 seeds) with confidence intervals, plus a replayed end-to-end run over ~20 historical theses for decision-quality accuracy (Appendix B). We then persist per-condition evidence and add calibration. We set aside a self-trained RL model: without a labeled corpus at scale it loses to the LLM today.

---

## Appendix A — Evaluation harness (does not count toward word cap)

- **Unit tests:** 55 pipeline-logic tests (`tests/unit/`) covering every guard transition; runnable without DB/network via `pytest --noconftest`.
- **Tier A:** state machine vs. boolean over 16 sequences — state machine 1.0 precision / 0 false positives; boolean 0.6 / 6 false positives (three signed-then-blocked mergers, a discontinued drug program, a speculative-confirm-then-denied acquisition, an unconfirmed foundry customer). `python -m eval.run_eval`.
- **Tier B:** guarded confirmation pass vs. single call, 18-case adversarial set; both 1.0 precision/recall. Frontier: 0.0 hallucination both. `gpt-5.4-mini`: baseline 0.167 (1/6 confirmations cite an absent quote), guarded 0.0 by construction. `python -m eval.run_eval --classify [--model gpt-5.4-mini]`. Smoke test.
- **Tier C (end-to-end two-pass economics):** on a 20-article/3-catalyst stream, Pass-1 recall 1.0, filter rate 0.88, precision ~0.86; two-pass 7 Pass-2 calls / $0.048 vs. naive 60 / $0.366 (~87% cost, ~86% tokens saved). `python -m eval.run_eval --stream`.
- **Fixtures:** pre-declared outcomes (AAPL → firing, MSFT `forward_pe < 3` → not_met + proposal).

## Appendix B — Two-pass economics (Tier C) and remaining ablation 

Tier C (above) measures the two-pass pipeline's economics end-to-end: Pass-1 recall/precision, filter rate, calls, and measured token/cost saving vs. a naive Pass-2-on-everything baseline. The cheap-model arm is done (Tier B on `gpt-5.4-mini`: baseline 16.7% fabricated-quote rate vs. guarded 0). Remaining: (1) repeated-run variance and confidence intervals on that figure; (2) full configuration sweep (single-call → +guard → +two-pass → +state machine); (3) a replayed end-to-end run over ~20 historical theses checking the system reaches the right state at the right time.

## Appendix C — Positioning & success targets 

| Capability | Price alerts | News/catalyst tools | Kestrel |
| --- | --- | --- | --- |
| Quantitative conditions | Yes | Sometimes | Yes |
| User-written qualitative catalyst | Usually no | Varies | Yes |
| Temporal catalyst state | Usually no | Unclear | Yes |
| Mixed-condition thesis | Usually no | Varies | Yes |
| Approval-gated thesis edits | No | Unclear | Yes |

We defined success as accurately determining whether a thesis's conditions are satisfied, with ≥95% confirmation precision, ≥90% relevant-article recall, and detection within 30 minutes.
