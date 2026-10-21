import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS portfolios (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('superadmin', 'admin', 'user')),
  portfolio_id text REFERENCES portfolios(id),
  created_at timestamptz NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS portfolio_updates (
  id text PRIMARY KEY,
  portfolio_id text NOT NULL REFERENCES portfolios(id),
  reporting_month date NOT NULL,
  cash_position numeric(18,2) NOT NULL CHECK (cash_position >= 0),
  rag_status text NOT NULL CHECK (rag_status IN ('Green', 'Amber', 'Red')),
  blocker text NOT NULL,
  owner_id text NOT NULL REFERENCES users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (portfolio_id, reporting_month)
)`;

await sql`CREATE TABLE IF NOT EXISTS compliance_runs (
  id text PRIMARY KEY,
  reporting_month date NOT NULL,
  deadline timestamptz NOT NULL,
  tolerance_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'complete',
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS compliance_findings (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES compliance_runs(id) ON DELETE CASCADE,
  portfolio_id text NOT NULL REFERENCES portfolios(id),
  state text NOT NULL CHECK (state IN ('Compliant', 'Within tolerance', 'Breach')),
  reason text NOT NULL,
  action text NOT NULL,
  overridden boolean NOT NULL DEFAULT false,
  override_reason text,
  overridden_by text REFERENCES users(id),
  overridden_at timestamptz
)`;

const portfolioRows = [
  ["pf_meridian", "Meridian Foods"],
  ["pf_northstar", "Northstar Logistics"],
  ["pf_kora", "Kora Health"],
  ["pf_atlas", "Atlas Energy"],
  ["pf_vantage", "Vantage Retail"],
];

for (const [id, name] of portfolioRows) {
  await sql`INSERT INTO portfolios (id, name) VALUES (${id}, ${name})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`;
}

const users = [
  ["usr_superadmin", "Amina Bello", "superadmin@bnh.group", "BNH@Super2026!", "superadmin", null],
  ["usr_admin", "Tobi Adeyemi", "admin@bnh.group", "BNH@Admin2026!", "admin", null],
  ["usr_pm", "Maya Okafor", "pm@bnh.group", "BNH@User2026!", "user", "pf_meridian"],
];

for (const [id, name, email, password, role, portfolioId] of users) {
  const passwordHash = await bcrypt.hash(password, 12);
  await sql`INSERT INTO users (id, name, email, password_hash, role, portfolio_id)
    VALUES (${id}, ${name}, ${email}, ${passwordHash}, ${role}, ${portfolioId})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, portfolio_id = EXCLUDED.portfolio_id`;
}

const updates = [
  ["upd_meridian_sep", "pf_meridian", "2026-09-01", 428500000, "Green", "No material execution blockers. Distributor onboarding remains on plan.", "usr_pm", "2026-10-02T09:15:00.000Z"],
  ["upd_northstar_sep", "pf_northstar", "2026-09-01", 181200000, "Amber", "Two fleet renewals await final credit committee approval.", "usr_admin", "2026-10-06T13:40:00.000Z"],
  ["upd_kora_sep", "pf_kora", "2026-09-01", 96750000, "Red", "Regulatory clearance for the Abuja facility remains outstanding.", "usr_admin", "2026-10-09T08:05:00.000Z"],
  ["upd_atlas_sep", "pf_atlas", "2026-09-01", 612000000, "Green", "Grid connection documentation is in final legal review.", "usr_admin", "2026-10-04T17:25:00.000Z"],
];

for (const [id, portfolioId, month, cash, rag, blocker, ownerId, submittedAt] of updates) {
  await sql`INSERT INTO portfolio_updates
    (id, portfolio_id, reporting_month, cash_position, rag_status, blocker, owner_id, submitted_at, updated_at)
    VALUES (${id}, ${portfolioId}, ${month}, ${cash}, ${rag}, ${blocker}, ${ownerId}, ${submittedAt}, ${submittedAt})
    ON CONFLICT (portfolio_id, reporting_month) DO UPDATE SET cash_position = EXCLUDED.cash_position,
      rag_status = EXCLUDED.rag_status, blocker = EXCLUDED.blocker, owner_id = EXCLUDED.owner_id,
      submitted_at = EXCLUDED.submitted_at, updated_at = EXCLUDED.updated_at`;
}

console.log("Neon schema ready: 5 portfolios, 3 users, 4 portfolio updates.");
