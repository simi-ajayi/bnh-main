import { getSession } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";
import { listPortfolioUpdates } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getSession();
  const updates = await listPortfolioUpdates(session!);
  return <DashboardClient session={session!} updates={updates} />;
}
