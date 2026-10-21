import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { governanceSystemPrompt } from "@/lib/governance";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "user") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await request.json();
  const documentType = String(payload.documentType ?? "");
  const sourceMaterial = String(payload.sourceMaterial ?? "").trim();
  if (!["Board Note", "Role Mandate"].includes(documentType) || sourceMaterial.length < 20) {
    return NextResponse.json({ error: "Choose a document type and provide at least 20 characters of source material." }, { status: 422 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
      instructions: governanceSystemPrompt,
      input: `Create a ${documentType} using only the source material below.\n\n${sourceMaterial}`,
      max_output_tokens: 1600,
    });
    return NextResponse.json({ output: response.output_text, model: process.env.OPENAI_MODEL ?? "gpt-6-luna" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown OpenAI error";
    console.error("Governance generation failed", detail);
    const billingIssue = /quota|billing|credit|429/i.test(detail);
    return NextResponse.json({
      error: billingIssue
        ? "The OpenAI project has no available API credit or has reached its limit. Add API billing, then retry."
        : "OpenAI could not generate the document. Check the server configuration and retry.",
    }, { status: 502 });
  }
}
