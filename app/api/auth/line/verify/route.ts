import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBirthyProfile } from "@/lib/birthy/server-user";
import {
  AUTH_COOKIE,
  AUTH_TTL_SECONDS,
  createAuthSession,
  createPendingLineSession,
  PENDING_LINE_COOKIE,
  PENDING_LINE_TTL_SECONDS,
} from "@/lib/birthy/session";

export const runtime = "nodejs";

type LineVerifyResponse = {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
};

type LineAccessVerifyResponse = {
  scope?: string;
  client_id?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type LineProfileResponse = {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
};

type VerifiedLineIdentity = {
  sub: string;
  name?: string;
  picture?: string;
};

export async function POST(request: Request) {
  try {
    const channelId = process.env.LINE_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const idToken =
      body && typeof body.idToken === "string" ? body.idToken.trim() : "";
    const accessToken =
      body && typeof body.accessToken === "string"
        ? body.accessToken.trim()
        : "";

    if (
      (!idToken && !accessToken) ||
      idToken.length > 8192 ||
      accessToken.length > 8192
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid LINE authentication token" },
        { status: 400 },
      );
    }

    let identity: VerifiedLineIdentity | null = null;

    if (idToken) {
      const lineResponse = await fetch(
        "https://api.line.me/oauth2/v2.1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            id_token: idToken,
            client_id: channelId,
          }),
          cache: "no-store",
        },
      );

      const data = (await lineResponse.json().catch(() => null)) as
        | LineVerifyResponse
        | null;
      const now = Math.floor(Date.now() / 1000);

      if (
        lineResponse.ok &&
        data?.iss === "https://access.line.me" &&
        data.aud === channelId &&
        data.sub &&
        typeof data.exp === "number" &&
        data.exp > now
      ) {
        identity = {
          sub: data.sub,
          name: data.name,
          picture: data.picture,
        };
      } else {
        console.warn(
          "LINE ID token verification unavailable; trying access token:",
          data?.error_description ?? lineResponse.status,
        );
      }
    }

    if (!identity && accessToken) {
      const verifyResponse = await fetch(
        `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
        { method: "GET", cache: "no-store" },
      );

      const verifyData = (await verifyResponse.json().catch(() => null)) as
        | LineAccessVerifyResponse
        | null;

      if (
        verifyResponse.ok &&
        verifyData?.client_id === channelId &&
        typeof verifyData.expires_in === "number" &&
        verifyData.expires_in > 0
      ) {
        const profileResponse = await fetch("https://api.line.me/v2/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });

        const profile = (await profileResponse.json().catch(() => null)) as
          | LineProfileResponse
          | null;

        if (profileResponse.ok && profile?.userId) {
          identity = {
            sub: profile.userId,
            name: profile.displayName,
            picture: profile.pictureUrl,
          };
        }
      }
    }

    if (!identity) {
      return NextResponse.json(
        { ok: false, error: "LINE authentication failed" },
        { status: 401 },
      );
    }

    const { data: linked, error: linkedError } = await supabaseAdmin
      .from("line_accounts")
      .select("user_id")
      .eq("line_user_id", identity.sub)
      .maybeSingle();

    if (linkedError) throw linkedError;

    if (linked?.user_id) {
      const profile = await getBirthyProfile(linked.user_id);
      if (!profile) {
        return NextResponse.json(
          { ok: false, error: "Birthy account is unavailable" },
          { status: 403 },
        );
      }

      const response = NextResponse.json({
        ok: true,
        registered: true,
        profile,
      });
      response.cookies.set({
        name: AUTH_COOKIE,
        value: createAuthSession(linked.user_id),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_TTL_SECONDS,
      });
      response.cookies.delete(PENDING_LINE_COOKIE);
      return response;
    }

    const response = NextResponse.json({
      ok: true,
      registered: false,
      profile: {
        displayName: identity.name ?? "",
        pictureUrl: identity.picture ?? "",
      },
    });
    response.cookies.set({
      name: PENDING_LINE_COOKIE,
      value: createPendingLineSession({
        sub: identity.sub,
        name: identity.name,
        picture: identity.picture,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PENDING_LINE_TTL_SECONDS,
    });
    response.cookies.delete(AUTH_COOKIE);
    return response;
  } catch (error) {
    console.error("LINE auth error:", error);
    return NextResponse.json(
      { ok: false, error: "Authentication failed" },
      { status: 500 },
    );
  }
}