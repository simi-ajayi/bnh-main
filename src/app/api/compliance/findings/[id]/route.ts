import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setFindingOverride } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "user") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const payload = await request.json();
  if (typeof payload.overridden !== "boolean") {
    return NextResponse.json({ error: "A boolean override value is required." }, { status: 422 });
  }
  const saved = await setFindingOverride(id, session, payload.overridden);
  return saved
    ? NextResponse.json({ saved: true })
    : NextResponse.json({ error: "Finding not found." }, { status: 404 });
}
