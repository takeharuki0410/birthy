import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  isSameOriginRequest,
} from "@/lib/birthy/server-auth";
import { getUsersAndSettings, isBlockedPair } from "@/lib/birthy/server-connections";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RespondBody = {
  userId?: unknown;
  action?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request origin" },
        { status: 403 },
      );
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as RespondBody | null;
    const requesterId =
      typeof body?.userId === "string" ? body.userId.trim() : "";
    const action =
      body?.action === "accept" || body?.action === "reject"
        ? body.action
        : null;

    if (!UUID_PATTERN.test(requesterId) || !action || requesterId === userId) {
      return NextResponse.json(
        { ok: false, error: "Invalid request response" },
        { status: 400 },
      );
    }

    const [{ users }, blocked] = await Promise.all([
      getUsersAndSettings([requesterId]),
      isBlockedPair(userId, requesterId),
    ]);

    if (!users.has(requesterId) || (action === "accept" && blocked)) {
      return NextResponse.json(
        { ok: false, error: "Request is unavailable" },
        { status: 404 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("connections")
      .select("id")
      .eq("requester_id", requesterId)
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) throw error;

    const connection = data as { id: string } | null;
    if (!connection) {
      return NextResponse.json(
        { ok: false, error: "Pending request not found" },
        { status: 404 },
      );
    }

    const accepted = action === "accept";

    const { error: updateError } = await supabaseAdmin
      .from("connections")
      .update({
        status: accepted ? "accepted" : "rejected",
        accepted_at: accepted ? new Date().toISOString() : null,
      })
      .eq("id", connection.id)
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (updateError) throw updateError;

    if (accepted) {
      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: requesterId,
          type: "connection_accepted",
          actor_user_id: userId,
          reference_id: connection.id,
        });

      if (notificationError) {
        console.error(
          "Connection accepted notification insert failed:",
          notificationError,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      status: accepted ? "accepted" : "rejected",
    });
  } catch (error) {
    console.error("Birthy connection response failed:", error);
    return NextResponse.json(
      { ok: false, error: "Connection response failed" },
      { status: 500 },
    );
  }
}
