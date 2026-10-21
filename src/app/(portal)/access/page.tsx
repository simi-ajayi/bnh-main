import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listUsers } from "@/lib/db";

const roleCopy = {
  superadmin: { icon: ShieldCheck, label: "Superadmin", scope: "Full platform and access governance" },
  admin: { icon: UsersRound, label: "Admin", scope: "All portfolios, compliance, governance" },
  user: { icon: UserRound, label: "Portfolio manager", scope: "Assigned portfolio and submissions" },
};

const demoPasswords = {
  superadmin: "BNH@Super2026!",
  admin: "BNH@Admin2026!",
  user: "BNH@User2026!",
};

export default async function AccessPage() {
  const session = await getSession();
  if (session?.role !== "superadmin") redirect("/dashboard");
  const users = await listUsers();
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Identity & access</p><h1>Access control</h1><p>Seeded assessment identities with explicit role boundaries.</p></div></div>
      <section className="grid gap-4 md:grid-cols-3">
        {users.map((user) => { const meta = roleCopy[user.role]; const Icon = meta.icon; return <article className="content-card p-6" key={user.id}><div className="flex items-start justify-between"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Icon size={19} /></div><span className="status-pill status-green"><span />Active</span></div><h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{user.name}</h2><p className="mt-1 text-sm font-medium text-slate-500">{meta.label}</p><p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{meta.scope}</p><div className="mt-5 space-y-2 border-t border-slate-200 pt-5"><div className="flex items-center gap-2 text-xs text-slate-500"><UserRound size={13} />{user.email}</div><div className="flex items-center gap-2 text-xs text-slate-500"><KeyRound size={13} /><code>{demoPasswords[user.role]}</code></div></div></article>; })}
      </section>
      <section className="content-card mt-6 overflow-hidden"><div className="border-b border-slate-200 px-6 py-5"><h2 className="section-title">Permission matrix</h2></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Capability</th><th>Portfolio manager</th><th>Admin</th><th>Superadmin</th></tr></thead><tbody>{[
        ["Submit monthly update", "Assigned portfolio", "All portfolios", "All portfolios"],
        ["View aggregated dashboard", "Own portfolio", "Allowed", "Allowed"],
        ["Run compliance monitor", "Restricted", "Allowed", "Allowed"],
        ["View governance prompt", "Restricted", "Allowed", "Allowed"],
        ["Manage role access", "Restricted", "Restricted", "Allowed"],
      ].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={index === 0 ? "font-medium text-slate-900" : ""}>{cell}</td>)}</tr>)}</tbody></table></div></section>
    </>
  );
}
