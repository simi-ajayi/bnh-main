import { getSession } from "@/lib/auth";
import { UpdateForm } from "@/components/update-form";
import { listPortfolioNames } from "@/lib/db";

export default async function NewSubmissionPage() {
  const session = await getSession();
  const portfolios = await listPortfolioNames();
  return <UpdateForm session={session!} portfolios={portfolios} />;
}
