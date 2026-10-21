"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

type Errors = Partial<Record<"portfolioName" | "reportingMonth" | "cashPosition" | "ragStatus" | "blocker", string[]>>;

export function UpdateForm({ session, portfolios }: { session: SessionUser; portfolios: string[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [portfolioName, setPortfolioName] = useState(session.portfolio ?? portfolios[0]);
  const [ragStatus, setRagStatus] = useState("Green");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolioName,
        reportingMonth: form.get("reportingMonth"),
        cashPosition: form.get("cashPosition"),
        ragStatus,
        blocker: form.get("blocker"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setErrors(result.errors ?? {});
      setFormError(result.error ?? "The update could not be saved.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <button className="quiet-link mb-6" onClick={() => router.back()}><ArrowLeft size={15} />Back to overview</button>
      <div className="mx-auto max-w-3xl">
        <div className="page-heading">
          <div><p className="eyebrow">Portfolio reporting</p><h1>Submit monthly update</h1><p>Capture the essential position. Keep the blocker specific and actionable.</p></div>
        </div>
        <form onSubmit={submit} className="content-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8"><h2 className="section-title">Reporting details</h2><p className="mt-1 text-sm text-slate-500">All fields are required.</p></div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <label className="field-label">Portfolio
              <select className="field-input mt-2" value={portfolioName} onChange={(event) => setPortfolioName(event.target.value)} disabled={session.role === "user"}>
                {portfolios.map((portfolio) => <option key={portfolio}>{portfolio}</option>)}
              </select>
              {errors.portfolioName ? <span className="field-error">{errors.portfolioName[0]}</span> : null}
            </label>
            <label className="field-label">Reporting month
              <input className="field-input mt-2" type="month" name="reportingMonth" defaultValue="2026-10" />
              {errors.reportingMonth ? <span className="field-error">{errors.reportingMonth[0]}</span> : null}
            </label>
            <label className="field-label sm:col-span-2">Cash position (NGN)
              <div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₦</span><input className="field-input pl-9" type="number" name="cashPosition" placeholder="0" min="0" step="1000" /></div>
              {errors.cashPosition ? <span className="field-error">{errors.cashPosition[0]}</span> : null}
            </label>
            <fieldset className="sm:col-span-2"><legend className="field-label">RAG status</legend>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {(["Green", "Amber", "Red"] as const).map((status) => (
                  <button key={status} type="button" onClick={() => setRagStatus(status)} className={`rag-choice rag-${status.toLowerCase()} ${ragStatus === status ? "rag-choice-active" : ""}`}><span />{status}{ragStatus === status ? <Check size={15} /> : null}</button>
                ))}
              </div>
            </fieldset>
            <label className="field-label sm:col-span-2">Primary execution blocker
              <textarea className="field-input mt-2 min-h-32 resize-none py-3.5" name="blocker" maxLength={280} placeholder="State the blocker, its impact, and the decision or support required." />
              <div className="mt-2 flex items-start justify-between gap-3">{errors.blocker ? <span className="field-error mt-0">{errors.blocker[0]}</span> : <span className="text-xs text-slate-400">Be concise. One material blocker only.</span>}<span className="text-xs text-slate-400">280 max</span></div>
            </label>
            {formError ? <p className="form-error sm:col-span-2">{formError}</p> : null}
          </div>
          <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:px-8">
            <button className="primary-button min-w-44" type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit update"}<ArrowRight size={17} /></button>
          </div>
        </form>
      </div>
    </>
  );
}
