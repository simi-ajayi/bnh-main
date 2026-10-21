import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ComplianceClient } from "@/components/compliance-client";
import { getLatestComplianceRun } from "@/lib/db";

export default async function CompliancePage() {
  const session = await getSession();
  if (session?.role === "user") redirect("/dashboard");
  const initialRun = await getLatestComplianceRun("2026-09");
  return <ComplianceClient initialRun={initialRun} />;
}
