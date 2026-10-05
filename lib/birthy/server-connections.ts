import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export type ConnectionRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  accepted_at: string | null;
  updated_at: string;
};

export type SocialUserRow = {
  id: string;
  nickname: string;
  birthy_id: string | null;
  avatar_path: string | null;
  birth_date: string;
  status: "active" | "suspended" | "deleted";
};

export type SocialSettingsRow = {
  user_id: string;
  birthday_visibility: "connections_full" | "month_day_only";
  allow_id_search: boolean;
  allow_connection_requests: boolean;
};

export type ConnectionPerson = {
  id: string;
  nickname: string;
  avatar: string;
  birthday: string;
  birthyId: string;
  connected: boolean;
  showFullBirthday: boolean;
};

export function maskBirthDate(value: string): string {
  const monthDay = /^\d{4}-(\d{2}-\d{2})$/.exec(value)?.[1];
  return monthDay ? `2000-${monthDay}` : "2000-01-01";
}

export function toConnectionPerson(
  user: SocialUserRow,
  settings: SocialSettingsRow | undefined,
  connected: boolean,
): ConnectionPerson {
  const showFullBirthday =
    connected &&
    (settings?.birthday_visibility ?? "connections_full") ===
      "connections_full";

  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar_path || "/birthy/profile-sky.webp",
    birthday: showFullBirthday ? user.birth_date : maskBirthDate(user.birth_date),
    birthyId: user.birthy_id ?? "",
    connected,
    showFullBirthday,
  };
}

export async function getUsersAndSettings(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];

  if (ids.length === 0) {
    return {
      users: new Map<string, SocialUserRow>(),
      settings: new Map<string, SocialSettingsRow>(),
    };
  }

  const [usersResult, settingsResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id,nickname,birthy_id,avatar_path,birth_date,status")
      .in("id", ids)
      .eq("status", "active"),
    supabaseAdmin
      .from("user_settings")
      .select(
        "user_id,birthday_visibility,allow_id_search,allow_connection_requests",
      )
      .in("user_id", ids),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const users = new Map(
    ((usersResult.data ?? []) as SocialUserRow[]).map((user) => [user.id, user]),
  );
  const settings = new Map(
    ((settingsResult.data ?? []) as SocialSettingsRow[]).map((setting) => [
      setting.user_id,
      setting,
    ]),
  );

  return { users, settings };
}

export async function getPairConnection(
  firstUserId: string,
  secondUserId: string,
): Promise<ConnectionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("connections")
    .select(
      "id,requester_id,receiver_id,status,created_at,accepted_at,updated_at",
    )
    .in("requester_id", [firstUserId, secondUserId])
    .in("receiver_id", [firstUserId, secondUserId])
    .maybeSingle();

  if (error) throw error;
  return data as ConnectionRow | null;
}

export async function isBlockedPair(
  firstUserId: string,
  secondUserId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("blocks")
    .select("blocker_id,blocked_id")
    .in("blocker_id", [firstUserId, secondUserId])
    .in("blocked_id", [firstUserId, secondUserId])
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const [blockingResult, blockedByResult] = await Promise.all([
    supabaseAdmin
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId),
    supabaseAdmin
      .from("blocks")
      .select("blocker_id")
      .eq("blocked_id", userId),
  ]);

  if (blockingResult.error) throw blockingResult.error;
  if (blockedByResult.error) throw blockedByResult.error;

  const result = new Set<string>();

  for (const row of (blockingResult.data ?? []) as { blocked_id: string }[]) {
    result.add(row.blocked_id);
  }
  for (const row of (blockedByResult.data ?? []) as { blocker_id: string }[]) {
    result.add(row.blocker_id);
  }

  return result;
}
