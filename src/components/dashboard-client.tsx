"use client";

import Link from "next/link";
import { ArrowUpRight, Banknote, CircleAlert, FilePlus2, Layers3 } from "lucide-react";
import { formatNaira, type PortfolioUpdate } from "@/lib/demo-data";
import type { SessionUser } from "@/lib/auth";

const ragStyles = {
  Green: "status-green",
  Amber: "status-amber",
  Red: "status-red",
};

export function DashboardClient({ session, updates }: { session: SessionUser; updates: PortfolioUpdate[] }) {
  const visibleUpdates = updates;
  const totalCash = visibleUpdates.reduce((sum, item) => sum + item.cashPosition, 0);
  const attention = visibleUpdates.filter((item) => item.ragStatus !== "Green").length;
  const coverage = session.role === "user" ? 100 : Math.round((new Set(visibleUpdates.map((item) => item.portfolioName)).size / 5) * 100);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">October 2026 reporting cycle</p>
          <h1>{session.role === "user" ? "Portfolio overview" : "Executive overview"}</h1>
          <p>{session.role === "user" ? `Performance and reporting for ${session.portfolio}.` : "A concise view of liquidity, reporting health, and execution risk."}</p>
        </div>
        <Link href="/submissions/new" className="primary-button"><FilePlus2 size={17} />New update</Link>
      </div>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon"><Banknote size={19} /></div>
          <p>Reported cash</p>
          <strong>{formatNaira(totalCash, true)}</strong>
          <span>Across the latest submissions</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon"><Layers3 size={19} /></div>
          <p>Portfolio coverage</p>
          <strong>{coverage}%</strong>
          <span>{visibleUpdates.length} submissions recorded</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon"><CircleAlert size={19} /></div>
          <p>Needs attention</p>
          <strong>{attention}</strong>
          <span>Amber or red execution status</span>
        </article>
      </section>

      <section className="content-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-7">
          <div>
            <h2 className="section-title">Latest portfolio updates</h2>
            <p className="mt-1 text-sm text-slate-500">Most recent position submitted by each portfolio.</p>
          </div>
          {session.role !== "user" ? <Link className="quiet-link" href="/compliance">View compliance <ArrowUpRight size={14} /></Link> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Portfolio</th><th>Reporting month</th><th>Cash position</th><th>Status</th><th>Execution blocker</th></tr></thead>
            <tbody>
              {visibleUpdates.map((update) => (
                <tr key={update.id}>
                  <td><div className="font-medium text-slate-900">{update.portfolioName}</div><div className="mt-1 text-xs text-slate-400">Submitted {new Date(update.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div></td>
                  <td className="whitespace-nowrap">{new Date(`${update.reportingMonth}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</td>
                  <td className="whitespace-nowrap font-medium text-slate-900">{formatNaira(update.cashPosition)}</td>
                  <td><span className={`status-pill ${ragStyles[update.ragStatus]}`}><span />{update.ragStatus}</span></td>
                  <td><p className="max-w-xs truncate text-slate-600" title={update.blocker}>{update.blocker}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
