export type LineLoginResult = {
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
    liff.login({
      redirectUri: window.location.href,
    });

    // LINEログイン画面へ遷移するまで待機
    return new Promise<LineLoginResult>(() => {});
  }

  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("LINE ID token is unavailable");
  }

  const response = await fetch("/api/auth/line/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      idToken,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        profile?: {
          displayName?: string;
          pictureUrl?: string;
        };
      }
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error("LINE server verification failed");
  }

  return {
    displayName: data.profile?.displayName ?? "",
    pictureUrl: data.profile?.pictureUrl ?? "",
  };
}