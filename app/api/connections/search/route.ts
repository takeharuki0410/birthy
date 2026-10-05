import { NextResponse } from "next/server";

import { getAuthenticatedUserId } from "@/lib/birthy/server-auth";
import {
  getPairConnection,
  getUsersAndSettings,
  isBlockedPair,
  type SocialUserRow,
  toConnectionPerson,
} from "@/lib/birthy/server-connections";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const normalized = new URL(request.url).searchParams
      .get("id")
      ?.trim()
      .replace(/^@/, "")
      .toLowerCase();

    if (!normalized || !/^[a-z0-9_]{4,20}$/.test(normalized)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Birthy ID" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id,nickname,birthy_id,avatar_path,birth_date,status")
      .eq("birthy_id", normalized)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;

    const target = data as SocialUserRow | null;
    if (!target) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (target.id === userId) {
      return NextResponse.json(
        { ok: false, error: "This is your own Birthy ID" },
        { status: 400 },
      );
    }

    const [{ settings }, blocked, connection] = await Promise.all([
      getUsersAndSettings([target.id]),
      isBlockedPair(userId, target.id),
      getPairConnection(userId, target.id),
    ]);

    const targetSettings = settings.get(target.id);

    if ((targetSettings?.allow_id_search ?? true) !== true || blocked) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    let relationship:
      | "none"
      | "connected"
      | "incoming"
      | "outgoing"
      | "rejected" = "none";

    if (connection?.status === "accepted") {
      relationship = "connected";
    } else if (connection?.status === "pending") {
      relationship =
        connection.receiver_id === userId ? "incoming" : "outgoing";
    } else if (connection?.status === "rejected") {
      relationship = "rejected";
    }

    const connected = relationship === "connected";
    const canRequest =
      (targetSettings?.allow_connection_requests ?? true) &&
      (relationship === "none" || relationship === "rejected");

    return NextResponse.json(
      {
        ok: true,
        person: toConnectionPerson(target, targetSettings, connected),
        relationship,
        canRequest,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Birthy ID search failed:", error);
    return NextResponse.json(
      { ok: false, error: "Search failed" },
      { status: 500 },
    );
  }
}
