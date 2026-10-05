import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getBirthyProfile } from "@/lib/birthy/server-user";
import {
  AUTH_COOKIE,
  AUTH_TTL_SECONDS,
  createAuthSession,
  PENDING_LINE_COOKIE,
  readPendingLineSession,
} from "@/lib/birthy/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RegisterBody = {
  nickname?: unknown;
  avatar?: unknown;
  birthday?: unknown;
  birthyId?: unknown;
  showFullBirthday?: unknown;
};

function tokyoTodayKey(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidBirthday(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  return value <= tokyoTodayKey();
}

function normalizeAvatar(value: unknown, fallback?: string): string {
  if (typeof value === "string") {
    const avatar = value.trim();
    if (
      avatar.length <= 2048 &&
      (avatar.startsWith("https://") || avatar.startsWith("/birthy/"))
    ) {
      return avatar;
    }
  }

  if (fallback?.startsWith("https://") && fallback.length <= 2048) {
    return fallback;
  }

  return "/birthy/profile-sky.webp";
}

function createAuthenticatedResponse(
  profile: NonNullable<Awaited<ReturnType<typeof getBirthyProfile>>>,
  userId: string,
) {
  const response = NextResponse.json({ ok: true, profile });
  response.cookies.set({
    name: AUTH_COOKIE,
    value: createAuthSession(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TTL_SECONDS,
  });
  response.cookies.delete(PENDING_LINE_COOKIE);
  return response;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(PENDING_LINE_COOKIE)?.value;
  const pending = pendingToken ? readPendingLineSession(pendingToken) : null;

  if (!pending) {
    return NextResponse.json(
      {
        ok: false,
        error: "LINE認証の有効期限が切れました。もう一度LINEで始めてください。",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as RegisterBody | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "登録内容を確認してください。" },
        { status: 400 },
      );
    }

    const nickname =
      typeof body.nickname === "string" ? body.nickname.trim() : "";
    const birthday =
      typeof body.birthday === "string" ? body.birthday.trim() : "";
    const rawBirthyId =
      typeof body.birthyId === "string" ? body.birthyId.trim() : "";
    const birthyId = rawBirthyId ? rawBirthyId.toLowerCase() : null;
    const showFullBirthday = body.showFullBirthday !== false;

    if (!nickname || nickname.length > 20) {
      return NextResponse.json(
        { ok: false, error: "ニックネームは1〜20文字で入力してください。" },
        { status: 400 },
      );
    }

    if (!isValidBirthday(birthday)) {
      return NextResponse.json(
        { ok: false, error: "正しい生年月日を入力してください。" },
        { status: 400 },
      );
    }

    if (birthyId && !/^[a-z0-9_]{4,20}$/.test(birthyId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Birthy IDは4〜20文字の英数字と_で入力してください。",
        },
        { status: 400 },
      );
    }

    const { data: existingLink, error: existingLinkError } = await supabaseAdmin
      .from("line_accounts")
      .select("user_id")
      .eq("line_user_id", pending.sub)
      .maybeSingle();

    if (existingLinkError) throw existingLinkError;

    if (existingLink?.user_id) {
      const profile = await getBirthyProfile(existingLink.user_id);
      if (!profile) {
        return NextResponse.json(
          { ok: false, error: "このBirthyアカウントは現在利用できません。" },
          { status: 403 },
        );
      }

      return createAuthenticatedResponse(profile, existingLink.user_id);
    }

    if (birthyId) {
      const { data: available, error: availabilityError } =
        await supabaseAdmin.rpc("is_birthy_id_available", {
          p_birthy_id: birthyId,
        });

      if (availabilityError) throw availabilityError;
      if (!available) {
        return NextResponse.json(
          { ok: false, error: "このBirthy IDは使用できません。" },
          { status: 409 },
        );
      }
    }

    const avatar = normalizeAvatar(body.avatar, pending.picture);

    const { data: createdUser, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        nickname,
        birthy_id: birthyId,
        avatar_path: avatar,
        birth_date: birthday,
      })
      .select("id")
      .single();

    if (userError || !createdUser?.id) {
      if (userError?.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "このBirthy IDはすでに使用されています。" },
          { status: 409 },
        );
      }
      throw userError ?? new Error("Failed to create user");
    }

    const userId = createdUser.id as string;
    let keepUser = false;

    try {
      const { error: lineError } = await supabaseAdmin
        .from("line_accounts")
        .insert({
          user_id: userId,
          line_user_id: pending.sub,
          provider: "line",
        });

      if (lineError) {
        if (lineError.code === "23505") {
          const { data: racedLink, error: racedLinkError } = await supabaseAdmin
            .from("line_accounts")
            .select("user_id")
            .eq("line_user_id", pending.sub)
            .maybeSingle();

          if (racedLinkError) throw racedLinkError;
          if (racedLink?.user_id) {
            const profile = await getBirthyProfile(racedLink.user_id);
            if (profile) {
              return createAuthenticatedResponse(profile, racedLink.user_id);
            }
          }
        }
        throw lineError;
      }

      const { error: settingsError } = await supabaseAdmin
        .from("user_settings")
        .insert({
          user_id: userId,
          birthday_visibility: showFullBirthday
            ? "connections_full"
            : "month_day_only",
        });

      if (settingsError) throw settingsError;
      keepUser = true;
    } finally {
      if (!keepUser) {
        const { error: cleanupError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", userId);

        if (cleanupError) {
          console.error("Failed to clean up partial registration:", cleanupError);
        }
      }
    }

    const profile = await getBirthyProfile(userId);
    if (!profile) throw new Error("Failed to load registered profile");

    return createAuthenticatedResponse(profile, userId);
  } catch (error) {
    console.error("Birthy registration failed:", error);
    return NextResponse.json(
      { ok: false, error: "登録に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
