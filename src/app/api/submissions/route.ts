import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { portfolioUpdateSchema } from "@/lib/validation";
import { savePortfolioUpdate } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();
  const result = portfolioUpdateSchema.safeParse({
    ...payload,
    portfolioName: session.role === "user" ? session.portfolio : payload.portfolioName,
  });

  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const update = await savePortfolioUpdate(result.data, session);
    return NextResponse.json({ update });
  } catch (error) {
    console.error("Submission persistence failed", error);
    return NextResponse.json({ error: "The update could not be saved." }, { status: 500 });
  }
}
