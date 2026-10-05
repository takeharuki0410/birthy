"use client";
import { useState } from "react";
import { Avatar, BalloonArt, Button, PageHeader } from "@/components/birthy/ui";
import { BalloonSelector } from "./balloon-selector";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel, birthdayYear } from "@/lib/birthy/date";
import type { Person } from "@/types/birthy";
export function SendBalloons({ person, onBack, onSent }: { person: Person; onBack: () => void; onSent: (count: number) => void }) {
  const { state,actions } = useBirthyStore(); const [count,setCount] = useState(1); const [error,setError] = useState(""); const [sent,setSent] = useState(false);
  const remaining = 100 - state.balloons.filter((b) => b.recipientId === person.id && b.senderId === "self" && b.year === birthdayYear()).reduce((sum,b) => sum+b.count,0);
  const valid = Number.isInteger(count) && count >= 1 && count <= remaining;
  return <div className="screen-enter"><PageHeader title="風船を送る" onBack={onBack}/><div className="content balloon-send"><div className="recipient"><Avatar src={person.avatar} name={person.nickname} size={57}/><div><h2>{person.nickname}<span>さん</span></h2><p className="small muted">{birthdayLabel(person.birthday)}</p></div></div><div className="balloon-send-art"><BalloonArt/><p>おめでとうを、ふわり。</p></div><BalloonSelector value={count} onChange={setCount} remaining={remaining}/>{remaining === 0 && <p className="small muted balloon-limit-done">この誕生日年度に送れる風船をすべて送りました。<br/>メッセージは引き続き送れます。</p>}{error && <p className="form-error" role="alert">{error}</p>}<Button variant="pink" disabled={!valid || sent} onClick={() => { if (!actions.sendBalloons(person.id,count)) { setError("送れる風船の数を確認してください。"); return; } setSent(true); onSent(count); }}>風船を送る</Button></div></div>;
}
