import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="login-shell">
      <section className="login-intro">
        <div className="brand-mark">BNH</div>
        <div>
          <p className="eyebrow text-white/55">Portfolio intelligence</p>
          <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[1.08] tracking-[-0.045em] text-white md:text-6xl">
            Clarity across every portfolio.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/60">
            Monthly reporting, execution visibility, and accountable follow-through in one disciplined workspace.
          </p>
        </div>
        <p className="text-xs tracking-[0.18em] text-white/35">BRENDAN NICHOLAS HOLDINGS</p>
      </section>
      <section className="login-panel">
        <LoginForm />
      </section>
    </main>
  );
}
