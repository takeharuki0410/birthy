import { NextResponse } from "next/server";

import { getAuthenticatedUserId } from "@/lib/birthy/server-auth";
import {
  type ConnectionRow,
  getBlockedUserIds,
  getUsersAndSettings,
  toConnectionPerson,
} from "@/lib/birthy/server-connections";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const [requestedResult, receivedResult, blockedIds] = await Promise.all([
      supabaseAdmin
        .from("connections")
        .select(
          "id,requester_id,receiver_id,status,created_at,accepted_at,updated_at",
        )
        .eq("requester_id", userId)
        .in("status", ["pending", "accepted"]),
      supabaseAdmin
        .from("connections")
        .select(
          "id,requester_id,receiver_id,status,created_at,accepted_at,updated_at",
        )
        .eq("receiver_id", userId)
        .in("status", ["pending", "accepted"]),
      getBlockedUserIds(userId),
    ]);

    if (requestedResult.error) throw requestedResult.error;
    if (receivedResult.error) throw receivedResult.error;

    const byId = new Map<string, ConnectionRow>();
    for (const row of [
      ...((requestedResult.data ?? []) as ConnectionRow[]),
      ...((receivedResult.data ?? []) as ConnectionRow[]),
    ]) {
      byId.set(row.id, row);
    }

    const rows = [...byId.values()].filter((row) => {
      const otherId =
        row.requester_id === userId ? row.receiver_id : row.requester_id;
      return !blockedIds.has(otherId);
    });

    const otherIds = rows.map((row) =>
      row.requester_id === userId ? row.receiver_id : row.requester_id,
    );
    const { users, settings } = await getUsersAndSettings(otherIds);

    const accepted: { person: ReturnType<typeof toConnectionPerson> }[] = [];
    const incoming: { person: ReturnType<typeof toConnectionPerson> }[] = [];
    const outgoing: { person: ReturnType<typeof toConnectionPerson> }[] = [];

    for (const row of rows) {
      const otherId =
        row.requester_id === userId ? row.receiver_id : row.requester_id;
      const user = users.get(otherId);
      if (!user) continue;

      if (row.status === "accepted") {
        accepted.push({
          person: toConnectionPerson(user, settings.get(otherId), true),
        });
      } else if (row.receiver_id === userId) {
        incoming.push({
          person: toConnectionPerson(user, settings.get(otherId), false),
        });
      } else {
        outgoing.push({
          person: toConnectionPerson(user, settings.get(otherId), false),
        });
      }
    }

    const sortByName = (
      first: { person: { nickname: string } },
      second: { person: { nickname: string } },
    ) => first.person.nickname.localeCompare(second.person.nickname, "ja");

    accepted.sort(sortByName);
    incoming.sort(sortByName);
    outgoing.sort(sortByName);

    return NextResponse.json(
      { ok: true, accepted, incoming, outgoing },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Birthy connections load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Connections could not be loaded" },
      { status: 500 },
    );
  }
}
