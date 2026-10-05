"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Avatar, BalloonArt, Brand, Button, Icon, Toggle } from "@/components/birthy/ui";
import { beginLineLogin } from "@/lib/birthy/line-login";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel, isValidBirthday } from "@/lib/birthy/date";
import { useBirthyId } from "@/lib/birthy/use-birthy-id";
import type { Profile } from "@/types/birthy";
import { ProfileFields } from "./profile-fields";
import { BirthdayFields } from "./birthday-fields";
import { BirthyIdField } from "./birthy-id-field";
import "./onboarding.css";

const STEPS = ["ウェルカム", "プロフィール", "誕生日", "Birthy ID", "プライバシー", "登録確認", "登録完了"];
const TITLES = ["", "プロフィールを設定しましょう", "誕生日を設定しましょう", "Birthy IDを設定しましょう", "生年月日の公開設定", "登録内容を確認してください", ""];
const DESCRIPTIONS = ["", "この情報はあとから変更できます", "あなたの誕生日を教えてください", "IDを設定すると、友達が検索で見つけられます", "つながっている人に、生年月日を表示しますか？", "", ""];

function RegistrationReview({ profile }: { profile: Profile }) {
  return <div className="onboarding-review">
    <div className="onboarding-review-profile"><Avatar src={profile.avatar} name={profile.nickname} size={72}/><div><strong>{profile.nickname}</strong><p>{profile.birthyId ? `@${profile.birthyId}` : "Birthy IDは未設定"}</p></div></div>
    <dl>
      <div><span className="onboarding-review-icon pink"><Icon name="calendar" size={20}/></span><dt>誕生日</dt><dd>{birthdayLabel(profile.birthday, true)}</dd></div>
      <div><span className="onboarding-review-icon green"><Icon name="check" size={20}/></span><dt>Birthy ID</dt><dd>{profile.birthyId ? `@${profile.birthyId}` : "未設定（あとから設定できます）"}</dd></div>
      <div><span className="onboarding-review-icon blue"><Icon name="shield" size={20}/></span><dt>生年月日の公開設定</dt><dd>{profile.showFullBirthday ? "つながっている人に表示する" : "すべての人に月日だけを表示する"}</dd></div>
    </dl>
    <p className="onboarding-review-note">公開プロフィールとサークルでは、月日だけが表示されます</p>
  </div>;
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { actions } = useBirthyStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({ nickname: "", avatar: "/birthy/profile-sky.webp", birthday: "--", birthyId: "", showFullBirthday: true });
  const [busy, setBusy] = useState(false);
  const completionStarted = useRef(false);
  const [formError, setFormError] = useState("");
  const id = useBirthyId(profile.birthyId);
  function updateProfile(patch: Partial<Profile>) { setProfile((previous) => ({ ...previous, ...patch })); setFormError(""); }
  function move(next: number) { setFormError(""); setStep(next); }
 async function login() {
  setBusy(true);
  setFormError("");

  try {
    const line = await beginLineLogin();

      if (line.registered) {
        actions.register(line.profile);
        onComplete();
        return;
      }

    updateProfile({
      nickname: profile.nickname.trim() || line.displayName,
        avatar: line.pictureUrl || profile.avatar,
    });
    move(1);
  } catch (error) {
    console.error("LINE login failed:", error);
      setFormError("LINEで始められませんでした。もう一度お試しください");
  } finally {
    setBusy(false);
  }
}
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1 && !profile.nickname.trim()) { setFormError("ニックネームを入力してください"); return; }
    if (step === 2 && !isValidBirthday(profile.birthday)) { setFormError("正しい生年月日を選んでください。未来の日付は設定できません"); return; }
    if (step === 3 && id.normalizedId && id.status !== "available") { setFormError(id.message || "IDの確認が完了してから次へ進んでください"); return; }
    if (step === 5 && (!profile.nickname.trim() || !isValidBirthday(profile.birthday))) { setFormError("プロフィールと生年月日を確認してください"); return; }
    updateProfile({ nickname: profile.nickname.trim(), birthyId: id.normalizedId });
    move(step + 1);
  }
  async function complete() {
    if (completionStarted.current) return;
    completionStarted.current = true;
    setBusy(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nickname: profile.nickname.trim(),
          avatar: profile.avatar,
          birthday: profile.birthday,
          birthyId: id.normalizedId,
          showFullBirthday: profile.showFullBirthday,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; profile?: Profile }
        | null;

      if (!response.ok || !data?.ok || !data.profile) {
        throw new Error(data?.error || "登録に失敗しました");
      }

      actions.register(data.profile);
      onComplete();
    } catch (error) {
      completionStarted.current = false;
      setStep(5);
      setFormError(error instanceof Error ? error.message : "登録に失敗しました。もう一度お試しください");
    } finally {
      setBusy(false);
    }
  }

  if (step === 0) return <section className="onboarding onboarding-welcome" aria-label="Birthyへようこそ">
    <div className="onboarding-welcome-art">
      <div className="onboarding-welcome-copy"><Brand large/><p>誕生日でつながる、<br/>やさしい場所。</p></div>
    </div>
    <div className="onboarding-welcome-bottom">
      <p className="onboarding-welcome-intro">普段あまり話さない相手にも、<br/>誕生日なら、気軽に「おめでとう」。</p>
      <Button variant="green" className="onboarding-line-button" onClick={login} disabled={busy}><span className="onboarding-line-logo" aria-hidden="true">LINE</span>{busy ? "準備しています…" : "LINEでBirthyをはじめる"}</Button>
      <p className="onboarding-login-hint">LINEアカウントでかんたんに始められます</p>
      {formError && <p className="onboarding-field-error" role="alert">{formError}</p>}
    </div>
  </section>;

  if (step === 6) return <section className="onboarding onboarding-complete" aria-labelledby="onboarding-complete-title">
    <div className="onboarding-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i}/>)}</div>
    <div className="onboarding-success-art"><BalloonArt happy/><span className="onboarding-success-check"><Icon name="check" size={20}/></span></div>
    <h1 id="onboarding-complete-title"><Brand/>へようこそ！</h1>
    <p>これから素敵な誕生日を<br/>届け合いましょう</p>
    <div className="onboarding-bottom"><Button onClick={complete} disabled={busy}>ホームへ</Button></div>
  </section>;

  const canNext = step === 1 ? Boolean(profile.nickname.trim()) : step === 2 ? isValidBirthday(profile.birthday) : step === 3 ? !id.normalizedId || id.status === "available" : true;
  return <section className="onboarding onboarding-form-screen" aria-labelledby="onboarding-title">
    <header className="onboarding-header"><button type="button" className="icon-button" aria-label="ひとつ前のステップへ戻る" onClick={() => move(step - 1)}><Icon name="back" size={20}/></button><span>{STEPS[step]}</span><span className="onboarding-step-number">{step}/5</span></header>
    <div className="onboarding-progress" role="progressbar" aria-label="登録の進み具合" aria-valuemin={0} aria-valuemax={7} aria-valuenow={step + 1}>{STEPS.map((label, index) => <span key={label} className={index <= step ? "is-filled" : ""}/>)}</div>
    <form className="onboarding-step-form" onSubmit={next} noValidate>
      <div className="onboarding-step-content" key={step}>
        <div className="onboarding-heading"><h1 id="onboarding-title">{TITLES[step]}</h1>{DESCRIPTIONS[step] && <p>{DESCRIPTIONS[step]}</p>}</div>
        {step === 1 && <ProfileFields nickname={profile.nickname} avatar={profile.avatar} onNicknameChange={(nickname) => updateProfile({ nickname })} onAvatarChange={(avatar) => updateProfile({ avatar })}/>}
        {step === 2 && <><BirthdayFields value={profile.birthday} onChange={(birthday) => updateProfile({ birthday })}/>{/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday) && !isValidBirthday(profile.birthday) && <p className="onboarding-field-error" role="alert">未来の日付は設定できません</p>}</>}
        {step === 3 && <BirthyIdField value={profile.birthyId} onChange={(birthyId) => updateProfile({ birthyId })} status={id.status} message={id.message}/>}
        {step === 4 && <div className="onboarding-privacy"><div className="onboarding-privacy-card"><span className="onboarding-privacy-lock"><Icon name="lock" size={20}/></span><Toggle checked={profile.showFullBirthday} onChange={(showFullBirthday) => updateProfile({ showFullBirthday })} label="つながっている人には生年月日を表示する"/></div><p>オフにすると、つながっている人にも<br/>誕生日の月日だけが表示されます</p><div className="onboarding-privacy-note"><Icon name="shield" size={18}/><span>公開プロフィールと、同じサークルにいるだけの人には、いつでも月日だけを表示します。</span></div></div>}
        {step === 5 && <RegistrationReview profile={profile}/>}
      </div>
      <div className="onboarding-bottom">
        {formError && <p className="onboarding-field-error" role="alert">{formError}</p>}
        <Button type="submit" disabled={!canNext}>{step === 5 ? "登録する" : "次へ"}</Button>
        {step === 3 && <button type="button" className="onboarding-skip" onClick={() => { updateProfile({ birthyId: "" }); move(4); }}>今は設定しない</button>}
      </div>
    </form>
  </section>;
}
