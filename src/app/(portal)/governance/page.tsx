import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { GovernancePrompt } from "@/components/governance-prompt";

export default async function GovernancePage() {
  const session = await getSession();
  if (session?.role === "user") redirect("/dashboard");
  return <GovernancePrompt />;
}
