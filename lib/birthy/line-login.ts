import type { Profile } from "@/types/birthy";

export type LineLoginResult =
  | {
      registered: true;
      profile: Profile;
    }
  | {
      registered: false;
      displayName: string;
      pictureUrl: string;
    };

export async function beginLineLogin(): Promise<LineLoginResult> {
  if (typeof window === "undefined") {
    throw new Error("LINE Login must run in the browser");
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    throw new Error("NEXT_PUBLIC_LIFF_ID is not configured");
  }

  const { default: liff } = await import("@line/liff");

  await liff.init({
    liffId,
    withLoginOnExternalBrowser: true,
  });

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return new Promise<LineLoginResult>(() => {});
  }

  const idToken = liff.getIDToken();
  const accessToken = liff.getAccessToken();

  if (!idToken && !accessToken) {
    throw new Error("LINE authentication token is unavailable");
  }

  const response = await fetch("/api/auth/line/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ idToken, accessToken }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        registered?: boolean;
        profile?: Profile & {
          displayName?: string;
          pictureUrl?: string;
        };
      }
    | null;

  if (!response.ok || !data?.ok || typeof data.registered !== "boolean") {
    throw new Error("LINE server verification failed");
  }

  if (data.registered) {
    if (!data.profile?.nickname || !data.profile.birthday) {
      throw new Error("Birthy profile is unavailable");
    }
    return { registered: true, profile: data.profile };
  }

  return {
    registered: false,
    displayName: data.profile?.displayName ?? "",
    pictureUrl: data.profile?.pictureUrl ?? "",
  };
}