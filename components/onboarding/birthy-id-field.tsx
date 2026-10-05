"use client";

import { Icon } from "@/components/birthy/ui";
import type { BirthyIdStatus } from "@/lib/birthy/use-birthy-id";

export function BirthyIdField({ value, onChange, status, message }: {
  value: string;
  onChange: (value: string) => void;
  status: BirthyIdStatus;
  message: string;
}) {
  const success = status === "available" || status === "unchanged";
  const error = status === "invalid" || status === "taken" || status === "error";
  return <div className="onboarding-id-fields">
    <label className="onboarding-field-label" htmlFor="onboarding-birthy-id">Birthy ID <span className="onboarding-optional">任意</span></label>
    <div className={`onboarding-id-input onboarding-text-field ${success ? "is-valid" : ""} ${error ? "is-invalid" : ""}`}>
      <span className="onboarding-at" aria-hidden="true">@</span>
      <input id="onboarding-birthy-id" name="birthyId" value={value} placeholder="haruki21" onChange={(event) => onChange(event.target.value)} maxLength={20} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="onboarding-id-status onboarding-id-help" aria-invalid={error}/>
      {success && <span className="onboarding-id-check"><Icon name="check" size={14}/></span>}
      {status === "checking" && <span className="onboarding-spinner" aria-hidden="true"/>}
    </div>
    <div id="onboarding-id-status" className={`onboarding-id-status ${success ? "is-valid" : ""} ${error ? "is-invalid" : ""}`} aria-live="polite" aria-atomic="true">
      {success && <Icon name="check" size={16}/>}<span>{message}</span>
    </div>
    <div id="onboarding-id-help" className="onboarding-id-help"><p><Icon name="check" size={14}/>4〜20文字の英数字と_が使用できます</p><p><Icon name="check" size={14}/>あとから設定・変更できます</p></div>
  </div>;
}
