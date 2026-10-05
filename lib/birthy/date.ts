export function todayInTokyo(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "01";
  return new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00`);
}
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function birthdayLabel(value: string, full = false): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${full ? `${year}年` : ""}${month}月${day}日`;
}
export function isValidBirthday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && isoDate(date) === value && value <= isoDate(todayInTokyo()) && Number(value.slice(0, 4)) >= 1900;
}
export function birthdayYear(): number { return todayInTokyo().getFullYear(); }
