"use client";

import { useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Clock3, Mail, Play, RotateCcw, ShieldCheck } from "lucide-react";
import type { ComplianceRun } from "@/lib/db";

const statusStyle = { Compliant: "status-green", "Within tolerance": "status-amber", Breach: "status-red" };

export function ComplianceClient({ initialRun }: { initialRun: ComplianceRun | null }) {
  const [run, setRun] = useState(initialRun);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const findings = run?.findings ?? [];
  const breaches = findings.filter((item) => item.state === "Breach" && !item.overridden).length;

  async function runMonitor() {
    setPending(true);
    setError("");
    const response = await fetch("/api/compliance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportingMonth: "2026-09" }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "The monitor could not run.");
    else setRun(result.run);
    setPending(false);
  }

  async function toggleOverride(id: string, overridden: boolean) {
    setError("");
    const response = await fetch(`/api/compliance/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overridden: !overridden }),
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "The override could not be saved.");
      return;
    }
    setRun((current) => current ? {
      ...current,
      findings: current.findings.map((finding) => finding.id === id ? { ...finding, overridden: !overridden } : finding),
    } : current);
  }

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Agentic compliance</p><h1>Reporting monitor</h1><p>Evaluate monthly submissions, apply policy, and prepare proportionate action.</p></div>
        <button className="primary-button" onClick={runMonitor} disabled={pending}><Play size={16} fill="currentColor" />{pending ? "Evaluating..." : "Run monitor"}</button>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { icon: Clock3, label: "Trigger", value: "Manual now", note: "08:00 WAT cron designed" },
          { icon: Bot, label: "Evaluate", value: "5 portfolios", note: "Deadline + tolerance policy" },
          { icon: Mail, label: "Action", value: run ? `${breaches} drafts` : "Not run", note: "No autonomous sending" },
          { icon: ShieldCheck, label: "Human control", value: "Required", note: "Override before dispatch" },
        ].map((item) => <article key={item.label} className="agent-step"><item.icon size={18} /><p>{item.label}</p><strong>{item.value}</strong><span>{item.note}</span></article>)}
      </section>

      {error ? <p className="form-error mt-5">{error}</p> : null}
      <section className="content-card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-7">
          <div><h2 className="section-title">Evaluation ledger</h2><p className="mt-1 text-sm text-slate-500">September 2026 · Deadline 05 Oct · Tolerance through 07 Oct</p></div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"><span className={`h-2 w-2 rounded-full ${run ? "bg-emerald-500" : "bg-slate-300"}`} />{run ? "Saved to Neon" : "Awaiting run"}</div>
        </div>
        {!run ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500"><Bot size={26} strokeWidth={1.5} /></div><h3 className="font-semibold text-slate-900">Ready to evaluate</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">The agent will read the PostgreSQL reporting ledger, evaluate deadline conditions, and prepare—not send—follow-up actions.</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {findings.map((finding) => <div key={finding.id} className="grid gap-4 px-6 py-5 sm:px-7 lg:grid-cols-[1fr_1.6fr_1.5fr_auto] lg:items-center">
              <div><p className="font-medium text-slate-900">{finding.portfolio}</p><span className={`status-pill mt-2 ${finding.overridden ? "status-neutral" : statusStyle[finding.state]}`}><span />{finding.overridden ? "Overridden" : finding.state}</span></div>
              <p className="text-sm leading-6 text-slate-600">{finding.reason}</p>
              <div className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">{finding.state === "Breach" ? <AlertTriangle className="mt-1 shrink-0 text-red-500" size={15} /> : <CheckCircle2 className="mt-1 shrink-0 text-emerald-500" size={15} />}<span>{finding.overridden ? "Action suppressed by human reviewer." : finding.action}</span></div>
              {finding.state === "Breach" ? <button className="secondary-button whitespace-nowrap" onClick={() => toggleOverride(finding.id, finding.overridden)}>{finding.overridden ? <RotateCcw size={14} /> : <ShieldCheck size={14} />}{finding.overridden ? "Restore" : "Override"}</button> : <span className="hidden lg:block" />}
            </div>)}
          </div>
        )}
      </section>
    </>
  );
}
