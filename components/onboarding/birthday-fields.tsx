"use client";

import { todayInTokyo } from "@/lib/birthy/date";

export function BirthdayFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [year, month, day] = value.split("-");
  const currentYear = todayInTokyo().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  function change(part: "year" | "month" | "day", next: string) {
    const nextYear = part === "year" ? next : year;
    const nextMonth = part === "month" ? next : month;
    let nextDay = part === "day" ? next : day;
    if (nextYear && nextMonth && nextDay) {
      nextDay = String(Math.min(Number(nextDay), new Date(Number(nextYear), Number(nextMonth), 0).getDate())).padStart(2, "0");
    }
    onChange(`${nextYear || ""}-${nextMonth || ""}-${nextDay || ""}`);
  }
  return <div className="onboarding-birthday-fields">
    <div className="onboarding-cake" aria-hidden="true">🎂</div>
    <fieldset className="onboarding-date-picker">
      <legend className="onboarding-field-label">生年月日</legend>
      <div className="onboarding-date-selects">
        <label><span className="visually-hidden">生まれた年</span><select name="birth-year" aria-label="生まれた年" value={year || ""} onChange={(event) => change("year", event.target.value)} required><option value="">年</option>{years.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select><span>年</span></label>
        <label><span className="visually-hidden">生まれた月</span><select name="birth-month" aria-label="生まれた月" value={month || ""} onChange={(event) => change("month", event.target.value)} required><option value="">月</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}</select><span>月</span></label>
        <label><span className="visually-hidden">生まれた日</span><select name="birth-day" aria-label="生まれた日" value={day || ""} onChange={(event) => change("day", event.target.value)} required><option value="">日</option>{Array.from({ length: daysInMonth }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}</select><span>日</span></label>
      </div>
    </fieldset>
    <p className="onboarding-field-hint">公開プロフィールには月日だけが表示されます</p>
  </div>;
}
