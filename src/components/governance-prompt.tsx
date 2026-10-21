"use client";

import { useState } from "react";
import { Check, Clipboard, FileCheck2, ShieldAlert, WandSparkles } from "lucide-react";
import { governanceSystemPrompt } from "@/lib/governance";

export function GovernancePrompt() {
  const [copied, setCopied] = useState(false);
  const [documentType, setDocumentType] = useState("Board Note");
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(governanceSystemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setOutput("");
    const response = await fetch("/api/governance/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType, sourceMaterial }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "The document could not be generated.");
    else setOutput(result.output);
    setPending(false);
  }

  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Governance generator</p><h1>Controlled document writer</h1><p>Generate source-disciplined governance documents with visible gaps and no invented approvals.</p></div>
        <button className="secondary-button" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy system prompt"}</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
        <form onSubmit={generate} className="content-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="rounded-xl bg-[#172338] p-2.5 text-white"><FileCheck2 size={18} /></div>
            <div><h2 className="section-title">Document brief</h2><p className="mt-1 text-xs text-slate-400">Only supplied facts will be used.</p></div>
          </div>
          <div className="space-y-5 p-6">
            <label className="field-label">Document type
              <select className="field-input mt-2" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                <option>Board Note</option><option>Role Mandate</option>
              </select>
            </label>
            <label className="field-label">Source material
              <textarea className="field-input mt-2 min-h-72 resize-y py-3.5 leading-6" value={sourceMaterial} onChange={(event) => setSourceMaterial(event.target.value)} placeholder={"Paste labelled source facts here.\n\nExample:\n[Management update, 18 Oct 2026]\n- Decision requested: approve...\n- Budget: ..."} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button w-full" type="submit" disabled={pending || sourceMaterial.trim().length < 20}><WandSparkles size={16} />{pending ? "Generating..." : `Generate ${documentType}`}</button>
          </div>
        </form>

        <section className="content-card min-h-[560px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="section-title">Generated document</h2><p className="mt-1 text-xs text-slate-400">Live OpenAI response · review required</p></div>{output ? <span className="status-pill status-green"><span />Generated</span> : null}</div>
          {output ? <pre className="whitespace-pre-wrap p-6 font-sans text-sm leading-7 text-slate-700 sm:p-7">{output}</pre> : <div className="flex min-h-[470px] flex-col items-center justify-center px-8 text-center"><div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500"><WandSparkles size={25} strokeWidth={1.5} /></div><h3 className="font-semibold text-slate-900">Ready for source material</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">The final text is produced by the configured server-side model. Missing facts will remain explicit placeholders.</p></div>}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.65fr_1.35fr]">
        <section className="content-card p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-red-50 p-2.5 text-red-600"><ShieldAlert size={18} /></div><h2 className="section-title">Primary control</h2></div><p className="mt-4 text-sm leading-6 text-slate-600">The model exposes missing information instead of smoothing it over. Every result remains a draft for human review.</p></section>
        <details className="content-card group overflow-hidden"><summary className="cursor-pointer list-none px-6 py-5 text-sm font-semibold text-slate-800">View system instruction</summary><pre className="whitespace-pre-wrap border-t border-slate-200 p-6 font-sans text-xs leading-6 text-slate-600">{governanceSystemPrompt}</pre></details>
      </div>
    </>
  );
}
