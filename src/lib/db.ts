import "server-only";

import { neon } from "@neondatabase/serverless";
import type { SessionUser, Role } from "@/lib/auth";
import type { PortfolioUpdate, RagStatus } from "@/lib/demo-data";
import type { PortfolioUpdateInput } from "@/lib/validation";

type DbUser = SessionUser & { passwordHash: string };

export type ComplianceFinding = {
  id: string;
  portfolio: string;
  state: "Compliant" | "Within tolerance" | "Breach";
  reason: string;
  action: string;
  overridden: boolean;
};

export type ComplianceRun = {
  id: string;
  reportingMonth: string;
  deadline: string;
  toleranceEnd: string;
  createdAt: string;
  findings: ComplianceFinding[];
};

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function toMonth(value: unknown) {
  return String(value).slice(0, 7);
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const sql = db();
  const rows = await sql`SELECT u.id, u.name, u.email, u.password_hash, u.role, p.name AS portfolio
    FROM users u LEFT JOIN portfolios p ON p.id = u.portfolio_id
    WHERE lower(u.email) = lower(${email}) LIMIT 1`;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: String(row.role) as Role,
    portfolio: row.portfolio ? String(row.portfolio) : undefined,
  };
}

export async function listUsers(): Promise<SessionUser[]> {
  const sql = db();
  const rows = await sql`SELECT u.id, u.name, u.email, u.role, p.name AS portfolio
    FROM users u LEFT JOIN portfolios p ON p.id = u.portfolio_id
    ORDER BY CASE u.role WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END`;
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name), email: String(row.email),
    role: String(row.role) as Role, portfolio: row.portfolio ? String(row.portfolio) : undefined,
  }));
}

export async function listPortfolioNames(): Promise<string[]> {
  const rows = await db()`SELECT name FROM portfolios ORDER BY name`;
  return rows.map((row) => String(row.name));
}

function mapUpdate(row: Record<string, unknown>): PortfolioUpdate {
  return {
    id: String(row.id),
    portfolioName: String(row.portfolio_name),
    reportingMonth: toMonth(row.reporting_month),
    cashPosition: Number(row.cash_position),
    ragStatus: String(row.rag_status) as RagStatus,
    blocker: String(row.blocker),
    ownerEmail: String(row.owner_email),
    submittedAt: toIso(row.submitted_at),
  };
}

export async function listPortfolioUpdates(session: SessionUser): Promise<PortfolioUpdate[]> {
  const sql = db();
  const rows = session.role === "user"
    ? await sql`SELECT pu.id, p.name AS portfolio_name, pu.reporting_month, pu.cash_position,
        pu.rag_status, pu.blocker, u.email AS owner_email, pu.submitted_at
      FROM portfolio_updates pu JOIN portfolios p ON p.id = pu.portfolio_id
      JOIN users u ON u.id = pu.owner_id WHERE p.name = ${session.portfolio ?? ""}
      ORDER BY pu.reporting_month DESC, pu.submitted_at DESC`
    : await sql`SELECT pu.id, p.name AS portfolio_name, pu.reporting_month, pu.cash_position,
        pu.rag_status, pu.blocker, u.email AS owner_email, pu.submitted_at
      FROM portfolio_updates pu JOIN portfolios p ON p.id = pu.portfolio_id
      JOIN users u ON u.id = pu.owner_id ORDER BY pu.reporting_month DESC, pu.submitted_at DESC`;
  return rows.map((row) => mapUpdate(row));
}

export async function savePortfolioUpdate(input: PortfolioUpdateInput, owner: SessionUser) {
  const sql = db();
  const portfolios = await sql`SELECT id FROM portfolios WHERE name = ${input.portfolioName} LIMIT 1`;
  if (!portfolios[0]) throw new Error("Portfolio not found.");
  const id = crypto.randomUUID();
  const month = `${input.reportingMonth}-01`;
  const portfolioId = String(portfolios[0].id);
  const rows = await sql`INSERT INTO portfolio_updates
    (id, portfolio_id, reporting_month, cash_position, rag_status, blocker, owner_id)
    VALUES (${id}, ${portfolioId}, ${month}, ${input.cashPosition}, ${input.ragStatus}, ${input.blocker}, ${owner.id})
    ON CONFLICT (portfolio_id, reporting_month) DO UPDATE SET
      cash_position = EXCLUDED.cash_position, rag_status = EXCLUDED.rag_status,
      blocker = EXCLUDED.blocker, owner_id = EXCLUDED.owner_id,
      submitted_at = now(), updated_at = now()
    RETURNING id, reporting_month, cash_position, rag_status, blocker, submitted_at`;
  return mapUpdate({ ...rows[0], portfolio_name: input.portfolioName, owner_email: owner.email });
}

function policyDates(reportingMonth: string) {
  const [year, month] = reportingMonth.split("-").map(Number);
  const deadline = new Date(Date.UTC(year, month, 5, 23, 59, 59));
  const toleranceEnd = new Date(Date.UTC(year, month, 7, 23, 59, 59));
  return { deadline, toleranceEnd };
}

export async function runComplianceMonitor(reportingMonth: string, actor: SessionUser): Promise<ComplianceRun> {
  const sql = db();
  const monthDate = `${reportingMonth}-01`;
  const { deadline, toleranceEnd } = policyDates(reportingMonth);
  const runId = crypto.randomUUID();
  await sql`INSERT INTO compliance_runs (id, reporting_month, deadline, tolerance_end, created_by)
    VALUES (${runId}, ${monthDate}, ${deadline.toISOString()}, ${toleranceEnd.toISOString()}, ${actor.id})`;

  const portfolios = await sql`SELECT p.id, p.name, pu.submitted_at
    FROM portfolios p LEFT JOIN portfolio_updates pu
      ON pu.portfolio_id = p.id AND pu.reporting_month = ${monthDate}
    ORDER BY p.name`;

  for (const row of portfolios) {
    const submitted = row.submitted_at ? new Date(String(row.submitted_at)) : null;
    let state: ComplianceFinding["state"];
    let reason: string;
    let action: string;
    if (!submitted) {
      state = "Breach";
      reason = `No submission received by ${toleranceEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })}.`;
      action = "Escalation email prepared for PM and CoS.";
    } else if (submitted <= deadline) {
      state = "Compliant";
      reason = `Submitted ${submitted.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}, before the deadline.`;
      action = "No action required.";
    } else if (submitted <= toleranceEnd) {
      state = "Within tolerance";
      reason = `Submitted ${submitted.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}, inside the two-day tolerance window.`;
      action = "Late notice logged; no escalation sent.";
    } else {
      state = "Breach";
      reason = `Submitted ${submitted.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}, after tolerance expired.`;
      action = "Escalation email prepared for PM and CoS.";
    }
    await sql`INSERT INTO compliance_findings (id, run_id, portfolio_id, state, reason, action)
      VALUES (${crypto.randomUUID()}, ${runId}, ${String(row.id)}, ${state}, ${reason}, ${action})`;
  }
  return (await getComplianceRun(runId))!;
}

async function getComplianceRun(runId: string): Promise<ComplianceRun | null> {
  const sql = db();
  const runs = await sql`SELECT id, reporting_month, deadline, tolerance_end, created_at
    FROM compliance_runs WHERE id = ${runId} LIMIT 1`;
  if (!runs[0]) return null;
  const findings = await sql`SELECT f.id, p.name AS portfolio, f.state, f.reason, f.action, f.overridden
    FROM compliance_findings f JOIN portfolios p ON p.id = f.portfolio_id
    WHERE f.run_id = ${runId} ORDER BY p.name`;
  return {
    id: String(runs[0].id), reportingMonth: toMonth(runs[0].reporting_month),
    deadline: toIso(runs[0].deadline), toleranceEnd: toIso(runs[0].tolerance_end),
    createdAt: toIso(runs[0].created_at),
    findings: findings.map((row) => ({
      id: String(row.id), portfolio: String(row.portfolio), state: String(row.state) as ComplianceFinding["state"],
      reason: String(row.reason), action: String(row.action), overridden: Boolean(row.overridden),
    })),
  };
}

export async function getLatestComplianceRun(reportingMonth: string) {
  const rows = await db()`SELECT id FROM compliance_runs WHERE reporting_month = ${`${reportingMonth}-01`}
    ORDER BY created_at DESC LIMIT 1`;
  return rows[0] ? getComplianceRun(String(rows[0].id)) : null;
}

export async function setFindingOverride(findingId: string, actor: SessionUser, overridden: boolean) {
  const rows = await db()`UPDATE compliance_findings SET overridden = ${overridden},
    override_reason = ${overridden ? "Suppressed by human reviewer." : null},
    overridden_by = ${overridden ? actor.id : null}, overridden_at = ${overridden ? new Date().toISOString() : null}
    WHERE id = ${findingId} RETURNING id`;
  return Boolean(rows[0]);
}
