"use client";
import { useRef, useState } from "react";
import { Avatar, Button, Icon, PageHeader } from "@/components/birthy/ui";
import { BalloonSelector } from "./balloon-selector";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel } from "@/lib/birthy/date";
import { getBirthdayWindow, isCardRevealed } from "@/lib/birthy/birthday-cards";
import { useBirthdayNow } from "@/lib/birthy/use-birthday-clock";
import type { Person, Visibility } from "@/types/birthy";
const reactions = ["🎉","🎂","🥳","💛","😊"];
export function MessageComposer({ person, onBack, onSent }: { person: Person; onBack: () => void; onSent: (result: { scheduled: boolean; balloons: number; visibility: Visibility }) => void }) {
  const { state, actions } = useBirthyStore();
  const [reaction,setReaction] = useState("🎉"); const [text,setText] = useState(""); const [visibility,setVisibility] = useState<Visibility>("public");
  const [withBalloons,setWithBalloons] = useState(false); const [count,setCount] = useState(1); const [error,setError] = useState(""); const [sent,setSent] = useState(false);
  const submitting = useRef(false);
  const now = useBirthdayNow();
  const birthday = getBirthdayWindow(person.birthday,now);
  const remaining = 100 - state.balloons.filter((b) => b.recipientId === person.id && b.senderId === "self" && b.year === birthday.year).reduce((total,b) => total+b.count,0);
  const validCount = !withBalloons || (Number.isInteger(count) && count >= 1 && count <= remaining);
  function submit() {
    if (submitting.current || sent || !validCount || !birthday.canSend) return;
    submitting.current = true;
    const card = actions.sendMessage({ recipientId: person.id, text: text.trim(), reaction, visibility },withBalloons ? count : 0);
    if (!card) { submitting.current = false; setError("送れる日付と風船の数をもう一度確認してください。"); return; }
    setSent(true);
    onSent({ scheduled: !isCardRevealed(card,new Date()), balloons: withBalloons ? count : 0, visibility });
  }
  if (!birthday.canSend) return <div className="screen-enter"><PageHeader title="誕生日カード" onBack={onBack}/><div className="content empty-state"><p>誕生日カードは、前日から当日まで送れます。</p><Button variant="subtle" onClick={onBack}>誕生日ページに戻る</Button></div></div>;
  return <div className="screen-enter"><PageHeader title="お祝いメッセージを送る" onBack={onBack}/><form className="content composer" onSubmit={(e) => { e.preventDefault(); submit(); }}><div className="recipient"><Avatar src={person.avatar} name={person.nickname} size={57}/><div><h2>{person.nickname}<span>さん</span></h2><p className="small muted">{birthdayLabel(person.birthday)}</p></div></div>{birthday.phase === "eve" && <div className="birthday-eve-note"><strong>明日は{person.nickname}さんの誕生日</strong><p>{visibility === "private" ? "誕生日になったら、本人だけが開けます" : "誕生日になったら公開されます"}</p></div>}<fieldset className="reaction-field"><legend>リアクション</legend><div className="reactions">{reactions.map((emoji) => <button type="button" key={emoji} className={reaction === emoji ? "selected" : ""} aria-label={`${emoji} のリアクション`} aria-pressed={reaction === emoji} onClick={() => setReaction(emoji)}>{emoji}</button>)}</div></fieldset><div className="message-input-wrap"><label htmlFor="celebration-message" className="small muted">メッセージ <span>（任意）</span></label><textarea className="input" id="celebration-message" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="お誕生日おめでとう！" rows={4}/><span className="message-counter">{text.length}/200</span></div><fieldset className="visibility-field"><legend>公開範囲</legend><label><input type="radio" name="visibility" checked={visibility === "public"} onChange={() => setVisibility("public")}/><span>みんなに表示<small>公開のBirthday Wallに表示されます</small></span></label><label><input type="radio" name="visibility" checked={visibility === "private"} onChange={() => setVisibility("private")}/><span>本人だけに送る</span></label>{visibility === "private" && <p className="private-note"><Icon name="lock" size={14}/>このメッセージは本人にだけ表示されます</p>}</fieldset><button type="button" className="attach-balloons" disabled={remaining === 0} onClick={() => setWithBalloons(!withBalloons)} aria-expanded={withBalloons}><span><Icon name="balloon" size={19}/>{remaining === 0 ? "この年度の風船は100個送信済みです" : "風船も添える"}</span><Icon name={withBalloons ? "check" : "chevron"} size={16}/></button>{withBalloons && <BalloonSelector value={count} onChange={setCount} remaining={remaining}/>}<div className="composer-footer">{error && <p className="form-error" role="alert">{error}</p>}<Button variant="pink" type="submit" disabled={!validCount || sent}>送信する</Button><p className="small muted">リアクションだけでも、気持ちは届きます。</p></div></form></div>;
}
