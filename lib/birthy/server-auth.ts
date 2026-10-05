import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE, readAuthSession } from "@/lib/birthy/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UserStatusRow = {
  id: string;
  status: "active" | "suspended" | "deleted";
};

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(AUTH_COOKIE)?.value;
  const session = rawSession ? readAuthSession(rawSession) : null;

  if (!session) return null;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,status")
    .eq("id", session.userId)
    .maybeSingle();

  if (error) throw error;

  const user = data as UserStatusRow | null;
  return user?.status === "active" ? user.id : null;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
