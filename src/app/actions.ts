"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, deleteSession } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const user = await authenticate(email, password);
  if (!user) return { error: "The email or password is incorrect." };

  await createSession(user);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
