# BNH Portfolio Intelligence

A focused Next.js application for monthly portfolio reporting, CoS-level visibility, agentic compliance monitoring, and controlled governance document generation.

## Stack

- Next.js 16 App Router and Node.js 22+
- Tailwind CSS 4 and Lucide React
- Neon PostgreSQL through the serverless HTTP driver
- Password hashes with bcrypt and signed, HTTP-only JWT sessions
- OpenAI Responses API for governance drafts

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add the server-only values.
3. Create/seed the database: `npm run db:setup`
4. Start the app: `npm run dev`
5. Open `http://localhost:3000` (or the port printed by Next.js).

Required environment variables:

```text
DATABASE_URL=
SESSION_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
```

Never commit `.env.local`. The repository ignores it by default.

## Seeded logins

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `superadmin@bnh.group` | `BNH@Super2026!` |
| Admin | `admin@bnh.group` | `BNH@Admin2026!` |
| Portfolio manager | `pm@bnh.group` | `BNH@User2026!` |

Passwords are stored as bcrypt hashes in PostgreSQL. The visible quick-login credentials are assessment-only and must be removed before a real rollout.

## Seed data

`npm run db:setup` is idempotent and seeds five portfolios, the three accounts above, and four September 2026 monthly updates. The missing Vantage Retail submission is intentional so the compliance monitor demonstrates a missing-submission breach. Everything created after setup—new updates, compliance runs, and overrides—is live PostgreSQL data.

## Assessment scenarios

- Scenario A: persisted monthly submission form, aggregated dashboard, server validation, and role-based access.
- Scenario B: deterministic PostgreSQL-backed compliance loop, deadline/tolerance evaluation, prepared actions, persisted findings, and human override. The one-page design is in `docs/agent-design.md`.
- Scenario C: complete governance system prompt, Role Mandate and Board Note structures, design rationale, sample input/output, and a live OpenAI-backed generator. The written deliverable is in `docs/governance-system-prompt.md`.

## Deploy to Vercel

Import the repository, select Node.js 22 or newer, and add `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`, and `OPENAI_MODEL` as environment variables. The supplied Neon database is already initialized; a different database should be prepared once with `npm run db:setup` before deployment.

ChatGPT subscriptions and API billing are separate. Live governance generation requires available credit on the OpenAI API project associated with `OPENAI_API_KEY`.
