import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  isSameOriginRequest,
} from "@/lib/birthy/server-auth";
import {
  getPairConnection,
  getUsersAndSettings,
  isBlockedPair,
} from "@/lib/birthy/server-connections";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RequestBody = {
  userId?: unknown;
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

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    const targetId =
      typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!UUID_PATTERN.test(targetId) || targetId === userId) {
      return NextResponse.json(
        { ok: false, error: "Invalid connection target" },
        { status: 400 },
      );
    }

    const [{ users, settings }, blocked, existing] = await Promise.all([
      getUsersAndSettings([targetId]),
      isBlockedPair(userId, targetId),
      getPairConnection(userId, targetId),
    ]);

    const target = users.get(targetId);
    if (!target || blocked) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    if ((settings.get(targetId)?.allow_connection_requests ?? true) !== true) {
      return NextResponse.json(
        { ok: false, error: "This user is not accepting connection requests" },
        { status: 403 },
      );
    }

    if (existing?.status === "accepted") {
      return NextResponse.json(
        { ok: false, error: "Already connected" },
        { status: 409 },
      );
    }

    if (existing?.status === "pending") {
      if (existing.requester_id === userId) {
        return NextResponse.json({
          ok: true,
          status: "outgoing",
          connectionId: existing.id,
        });
      }

      return NextResponse.json(
        { ok: false, error: "This user already sent you a request" },
        { status: 409 },
      );
    }

    let connectionId: string;

    if (existing?.status === "rejected") {
      const { data, error } = await supabaseAdmin
        .from("connections")
        .update({
          requester_id: userId,
          receiver_id: targetId,
          status: "pending",
          accepted_at: null,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) throw error;
      connectionId = (data as { id: string }).id;
    } else {
      const { data, error } = await supabaseAdmin
        .from("connections")
        .insert({
          requester_id: userId,
          receiver_id: targetId,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { ok: false, error: "A connection already exists" },
            { status: 409 },
          );
        }
        throw error;
      }

      connectionId = (data as { id: string }).id;
    }

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: targetId,
        type: "connection_request",
        actor_user_id: userId,
        reference_id: connectionId,
      });

    if (notificationError) {
      console.error(
        "Connection request notification insert failed:",
        notificationError,
      );
    }

    return NextResponse.json(
      { ok: true, status: "outgoing", connectionId },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    console.error("Birthy connection request failed:", error);
    return NextResponse.json(
      { ok: false, error: "Connection request failed" },
      { status: 500 },
    );
  }
}
