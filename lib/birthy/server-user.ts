import "server-only";

import type { Profile } from "@/types/birthy";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UserRow = {
  nickname: string;
  birthy_id: string | null;
  avatar_path: string | null;
  birth_date: string;
  status: "active" | "suspended" | "deleted";
};

type SettingsRow = {
  birthday_visibility: "connections_full" | "month_day_only";
};

export async function getBirthyProfile(userId: string): Promise<Profile | null> {
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("nickname,birthy_id,avatar_path,birth_date,status")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;
  const user = userData as UserRow | null;
  if (!user || user.status !== "active") return null;

  const { data: settingsData, error: settingsError } = await supabaseAdmin
    .from("user_settings")
    .select("birthday_visibility")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) throw settingsError;
  const settings = settingsData as SettingsRow | null;

  return {
    nickname: user.nickname,
    avatar: user.avatar_path || "/birthy/profile-sky.webp",
    birthday: user.birth_date,
    birthyId: user.birthy_id ?? "",
    showFullBirthday:
      (settings?.birthday_visibility ?? "connections_full") ===
      "connections_full",
  };
}
