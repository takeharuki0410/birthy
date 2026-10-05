import type { WallMessage, MessageLike } from "@/types/birthy";

const DAY_MS = 86_400_000;
const JAPAN_OFFSET_MS = 9 * 60 * 60 * 1000;
export interface BirthdayWindow {
  birthdayDate: string;
  opensAt: string;
  revealAt: string;
  year: number;
  phase: "upcoming" | "eve" | "birthday";
  canSend: boolean;
}
export function tokyoDateKey(now: Date = new Date()): string {
  return new Date(now.getTime() + JAPAN_OFFSET_MS).toISOString().slice(0, 10);
}
function dateInYear(birthday: string, year: number): string {
  const [, month, day] = birthday.split("-").map(Number);
  // Leap-day birthdays use February 28 in non-leap years, independently of device timezone.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2,"0")}-${String(Math.min(day,lastDay)).padStart(2,"0")}`;
}
/** Server-adapter boundary: replace the client clock/eligibility with authoritative server time. */
export function getBirthdayWindow(birthday: string, now: Date = new Date()): BirthdayWindow {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  const birthYear = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  const lastBirthDay = new Date(Date.UTC(birthYear, month, 0)).getUTCDate();
  if (!match || birthYear < 1 || month < 1 || month > 12 || day < 1 || day > lastBirthDay || !Number.isFinite(now.getTime())) {
    return { birthdayDate:"", opensAt:"", revealAt:"", year:0, phase:"upcoming", canSend:false };
  }
  let year = Number(tokyoDateKey(now).slice(0,4));
  let birthdayDate = dateInYear(birthday, year);
  let revealMs = Date.parse(`${birthdayDate}T00:00:00+09:00`);
  if (now.getTime() >= revealMs + DAY_MS) {
    year += 1;
    birthdayDate = dateInYear(birthday, year);
    revealMs = Date.parse(`${birthdayDate}T00:00:00+09:00`);
  }
  const opensMs = revealMs - DAY_MS;
  const canSend = now.getTime() >= opensMs && now.getTime() < revealMs + DAY_MS;
  return {
    birthdayDate,
    opensAt: `${tokyoDateKey(new Date(opensMs))}T00:00:00+09:00`,
    revealAt: `${birthdayDate}T00:00:00+09:00`,
    year,
    phase: !canSend ? "upcoming" : now.getTime() < revealMs ? "eve" : "birthday",
    canSend,
  };
}
/** Apply to public AND private cards before rendering sender, message, reaction or like controls. */
export function isCardRevealed(message: Pick<WallMessage,"revealAt">, now: Date = new Date()): boolean {
  const release = Date.parse(message.revealAt);
  return Number.isFinite(release) && release <= now.getTime();
}
export function isCardPending(message: Pick<WallMessage,"revealAt">, now: Date = new Date()): boolean {
  const release = Date.parse(message.revealAt);
  return Number.isFinite(release) && release > now.getTime();
}
export function summarizeMessageLikes(likes: MessageLike[], messageId: string, birthdayUserId: string, viewerId = "self") {
  const unique = new Set(likes.filter((like) => like.messageId === messageId).map((like) => like.userId));
  return { ownerLiked: unique.has(birthdayUserId), otherCount: [...unique].filter((id) => id !== birthdayUserId).length, viewerLiked: unique.has(viewerId) };
}
export function nextTokyoMidnight(now: Date = new Date()): number {
  return Date.parse(`${tokyoDateKey(now)}T00:00:00+09:00`) + DAY_MS;
}
