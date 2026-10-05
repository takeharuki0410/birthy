"use client";

import type { Person } from "@/types/birthy";

export type ConnectionRelationship =
  | "none"
  | "connected"
  | "incoming"
  | "outgoing"
  | "rejected";

export type ConnectionSnapshot = {
  accepted: { person: Person }[];
  incoming: { person: Person }[];
  outgoing: { person: Person }[];
};

export type ConnectionSearchResult = {
  person: Person;
  relationship: ConnectionRelationship;
  canRequest: boolean;
};

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
}

export async function fetchConnectionSnapshot(
  signal?: AbortSignal,
): Promise<ConnectionSnapshot> {
  const response = await fetch("/api/connections", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const data = await readJson(response);

  if (!response.ok || data?.ok !== true) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Connection load failed",
    );
  }

  return {
    accepted: (data.accepted ?? []) as { person: Person }[],
    incoming: (data.incoming ?? []) as { person: Person }[],
    outgoing: (data.outgoing ?? []) as { person: Person }[],
  };
}

export async function searchBirthyUser(
  birthyId: string,
  signal?: AbortSignal,
): Promise<ConnectionSearchResult | null> {
  const response = await fetch(
    `/api/connections/search?id=${encodeURIComponent(birthyId)}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    },
  );

  if (response.status === 404) return null;

  const data = await readJson(response);
  if (!response.ok || data?.ok !== true || !data.person) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Search failed",
    );
  }

  return {
    person: data.person as unknown as Person,
    relationship: data.relationship as ConnectionRelationship,
    canRequest: data.canRequest === true,
  };
}

export async function sendConnectionRequest(userId: string): Promise<void> {
  const response = await fetch("/api/connections/request", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await readJson(response);

  if (!response.ok || data?.ok !== true) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Request failed",
    );
  }
}

export async function respondConnectionRequest(
  userId: string,
  action: "accept" | "reject",
): Promise<void> {
  const response = await fetch("/api/connections/respond", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action }),
  });
  const data = await readJson(response);

  if (!response.ok || data?.ok !== true) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Response failed",
    );
  }
}
