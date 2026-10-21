"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/actions";

const accounts = [
  { label: "Superadmin", email: "superadmin@bnh.group", password: "BNH@Super2026!" },
  { label: "Admin", email: "admin@bnh.group", password: "BNH@Admin2026!" },
  { label: "Portfolio manager", email: "pm@bnh.group", password: "BNH@User2026!" },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [email, setEmail] = useState(accounts[0].email);
  const [password, setPassword] = useState(accounts[0].password);

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#172338] text-white shadow-lg shadow-slate-900/10">
        <LockKeyhole size={20} strokeWidth={1.7} />
      </div>
      <p className="eyebrow text-slate-400">Secure workspace</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Welcome back</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with an assessment account to continue.</p>

      <form action={action} className="mt-8 space-y-5">
        <label className="field-label">
          Email address
          <input
            className="field-input mt-2"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field-label">
          Password
          <input
            className="field-input mt-2"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {state?.error ? <p className="form-error">{state.error}</p> : null}
        <button className="primary-button w-full" type="submit" disabled={pending}>
          <span>{pending ? "Signing in..." : "Sign in"}</span>
          <ArrowRight size={17} />
        </button>
      </form>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Demo access</p>
        <div className="grid gap-2">
          {accounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-medium text-slate-800">{account.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{account.email}</span>
              </span>
              <ArrowRight className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" size={15} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
