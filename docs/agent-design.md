# PM Compliance Monitoring Agent — Design

## Purpose

The agent monitors whether portfolio managers have submitted complete monthly updates within BNH's reporting policy. It distinguishes on-time submissions, late submissions still inside a defined tolerance window, and actual breaches. It prepares proportionate follow-up action for human approval; it does not autonomously send consequential communications.

## Architecture and stack

The prototype uses Next.js/Node.js, Neon PostgreSQL, a deterministic policy evaluator, and persisted compliance run/finding records. A production deployment would invoke the evaluator through a scheduled Vercel Cron job and submission-created event, add an append-only audit event table, and draft messages through an email provider API. Rules remain deterministic code; an LLM may summarize evidence or draft language but cannot decide compliance.

## Core loop

1. **Read:** load the active portfolio register, reporting period, submissions, and policy version.
2. **Evaluate:** compare each submission timestamp with the due date and tolerance end. Missing by tolerance end, or submitted after it, is a breach. A submission after the due date but before tolerance expiry is logged as late-within-tolerance.
3. **Act:** record the result; do nothing for compliant reports, log a notice within tolerance, or prepare an escalation draft for a breach.
4. **Review:** surface evidence, applied rule, and proposed action to an authorized human.
5. **Record:** preserve the original decision and any override as separate audit events.

This is agentic because it observes changing state, selects among policy-bounded actions, and incorporates human feedback. The deadline calculation itself is intentionally deterministic rather than delegated to a model.

## Tools and triggers

- Data tools: portfolio register, submission ledger, reporting calendar, policy/version store.
- Action tools: audit log writer, notification draft creator, reviewer queue.
- Triggers: daily 08:00 WAT schedule, submission-created event, manual rerun.

## Failure modes and controls

- **Incorrect deadline or holiday calendar:** versioned policy and calendar; show the exact dates used.
- **Duplicate or delayed events:** idempotency key per portfolio/period/policy version.
- **Stale or unavailable data:** fail closed, label the run incomplete, and alert operations; never infer compliance.
- **Wrong portfolio ownership:** resolve recipients from the authoritative portfolio register at action time.
- **LLM hallucination:** keep classification deterministic and ground any generated draft in attached evidence.
- **Notification fatigue:** deduplicate open breaches and apply escalation cooldowns.

## Human override

Every proposed escalation enters a review queue. Admins can approve, suppress, or correct it with a mandatory reason. Overrides do not erase the original evaluation; both records remain visible with actor and timestamp. Repeated overrides are a signal to revise policy, not silent training data.
