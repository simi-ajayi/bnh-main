import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runComplianceMonitor } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "user") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json();
  const reportingMonth = String(payload.reportingMonth ?? "");
  if (!/^\d{4}-\d{2}$/.test(reportingMonth)) {
    return NextResponse.json({ error: "A valid reporting month is required." }, { status: 422 });
  }

  try {
    const run = await runComplianceMonitor(reportingMonth, session);
    return NextResponse.json({ run });
  } catch (error) {
    console.error("Compliance monitor failed", error);
    return NextResponse.json({ error: "The compliance monitor could not complete." }, { status: 500 });
  }
}
