"use client";

import { useEffect, useState } from "react";

export type BirthyIdStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error" | "unchanged";
interface IdResult {
  inputKey: string;
  generation: number;
  status: BirthyIdStatus;
  message: string;
}
const ID_PATTERN = /^[a-z0-9_]{4,20}$/;
const FORMAT_MESSAGE = "IDは4〜20文字の英数字と_が使用できます";

/** The existing server route is the sole source of ID availability. */
export function useBirthyId(input: string, originalId?: string): {
  status: BirthyIdStatus;
  message: string;
  normalizedId: string;
} {
  const normalizedId = input.trim().toLowerCase();
  const original = originalId?.trim().toLowerCase();
  const inputKey = `${normalizedId}\0${original ?? ""}`;
  const [result, setResult] = useState<IdResult>({ inputKey, generation: 0, status: "checking", message: "確認中…" });

  // Adjust this hook's state during render when its input changes. React immediately
  // retries the render, so a previous ID's cached availability is never actionable.
  if (result.inputKey !== inputKey) {
    setResult({ inputKey, generation: result.generation + 1, status: "checking", message: "確認中…" });
  }
  const generation = result.generation;

  useEffect(() => {
    if (!normalizedId || !ID_PATTERN.test(normalizedId) || normalizedId === original) return;
    const controller = new AbortController();
    let cancelled = false;
    function settle(status: BirthyIdStatus, message: string) {
      if (cancelled) return;
      setResult((current) => current.inputKey === inputKey && current.generation === generation
        ? { ...current, status, message }
        : current);
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/birthy-id/check?id=${encodeURIComponent(normalizedId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Availability request failed");
        const data: unknown = await response.json();
        if (cancelled) return;
        if (!data || typeof data !== "object" || !("valid" in data) || !("available" in data)) {
          throw new Error("Unexpected availability response");
        }
        if (data.valid === false) {
          settle("invalid", FORMAT_MESSAGE);
        } else if (data.valid === true && typeof data.available === "boolean") {
          settle(data.available ? "available" : "taken", data.available ? "このIDは使用できます" : "このIDはすでに使用されています");
        } else {
          throw new Error("Unexpected availability response");
        }
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          settle("error", "IDを確認できませんでした。時間をおいてお試しください");
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedId, original, inputKey, generation]);

  if (!normalizedId) return { status: "idle", message: "", normalizedId };
  if (!ID_PATTERN.test(normalizedId)) return { status: "invalid", message: FORMAT_MESSAGE, normalizedId };
  if (normalizedId === original) return { status: "unchanged", message: "現在のBirthy IDです", normalizedId };
  if (result.inputKey !== inputKey) return { status: "checking", message: "確認中…", normalizedId };
  return { status: result.status, message: result.message, normalizedId };
}
