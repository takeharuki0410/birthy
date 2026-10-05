import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getBirthyProfile } from "@/lib/birthy/server-user";
import { AUTH_COOKIE, readAuthSession } from "@/lib/birthy/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(AUTH_COOKIE)?.value;
    const session = rawSession ? readAuthSession(rawSession) : null;

    if (!session) {
      const response = NextResponse.json({ authenticated: false });
      if (rawSession) response.cookies.delete(AUTH_COOKIE);
      return response;
    }

    const profile = await getBirthyProfile(session.userId);
    if (!profile) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }

    return NextResponse.json(
      { authenticated: true, profile },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Birthy session restore failed:", error);
    return NextResponse.json(
      { authenticated: false, error: "Session check failed" },
      { status: 500 },
    );
  }
}
