"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, Button, Icon, Modal } from "@/components/birthy/ui";
import { Confetti } from "@/components/birthy/motion";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel } from "@/lib/birthy/date";
import { getBirthdayWindow, isCardRevealed } from "@/lib/birthy/birthday-cards";
import { useBirthdayNow } from "@/lib/birthy/use-birthday-clock";
import { PendingCardsNotice, WallMessageCard } from "./wall-message-card";
import type { Person, WallMessage } from "@/types/birthy";
import "./birthday.css";

interface BirthdayPageProps {
  person: Person;
  onBack: () => void;
  onMessage: () => void;
  onBalloons: () => void;
  onReceived: () => void;
}

export function BirthdayPage({ person, onBack, onMessage, onBalloons, onReceived }: BirthdayPageProps) {
  const { state, actions } = useBirthyStore();
  const now = useBirthdayNow();
  const birthday = getBirthdayWindow(person.birthday, now);
  const [menu, setMenu] = useState<WallMessage | null>(null);
  const [report, setReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reason, setReason] = useState("不適切な内容");
  const availableMessages = state.messages.filter((message) => message.recipientId === person.id && !state.hiddenMessages.includes(message.id) && !state.blocked.includes(message.authorId));
  // Filter before rendering. Sealed cards never put content or sender metadata in the DOM.
  const messages = availableMessages.filter((message) => isCardRevealed(message, now) && message.visibility === "public").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingCount = person.id === "self" ? availableMessages.filter((message) => !isCardRevealed(message, now)).length : 0;

  const openMessageMenu = (message: WallMessage) => {
    setMenu(message);
    setReport(false);
    setReportDone(false);
  };
  const saveReport = () => {
    if (!menu) return;
    try {
      const reports = JSON.parse(localStorage.getItem("birthy-reports") ?? "[]");
      localStorage.setItem("birthy-reports", JSON.stringify([...reports, { messageId: menu.id, reason, createdAt: new Date().toISOString() }]));
    } catch { /* Keep the UI usable when local storage is unavailable. */ }
    setReportDone(true);
  };

  return (
    <div className="birthday-screen screen-enter">
      {birthday.phase === "birthday" && <Confetti kind="wall"/>}
      <section className="birthday-hero">
        <Image src="/birthy/sky-balloons.webp" alt="" fill priority sizes="430px" className="birthday-sky"/>
        <div className="birthday-hero-top">
          <button className="icon-button" aria-label="戻る" onClick={onBack}><Icon name="back"/></button>
          <p>A DAY JUST FOR YOU</p><span/>
        </div>
        <div className="birthday-profile">
          <Avatar src={person.avatar} name={person.nickname} size={94}/>
          <p className="birthday-hero-label">{birthday.phase === "birthday" ? "Happy Birthday" : "もうすぐ、特別な日"}</p>
          <h1>{person.nickname}</h1>
          <p>{birthdayLabel(person.birthday, person.id === "self" || (person.connected && person.showFullBirthday))}</p>
          {person.affiliation && <small>{person.affiliation}</small>}
        </div>
      </section>
      <div className="birthday-wall-heading"><Icon name="heart" size={16}/><h2>Birthday Wall</h2><span>お祝いの言葉</span></div>
      <div className="content birthday-body">
        {person.id === "self" ? (
          <Button variant="subtle" onClick={onReceived}><Icon name="mail" size={18}/>届いたメッセージ・風船を見る</Button>
        ) : (
          <>
            {birthday.phase === "eve" && <div className="birthday-eve-note"><strong>明日は{person.nickname}さんの誕生日</strong><p>誕生日になったら公開されます</p></div>}
            <div className="birthday-actions">
              <Button variant="pink" disabled={!birthday.canSend} onClick={onMessage}><Icon name="heart" size={16}/>{birthday.phase === "eve" ? "誕生日カードを送る" : "お祝いを送る"}</Button>
              <Button variant="outline" onClick={onBalloons}><Icon name="balloon" size={16}/>風船を送る</Button>
            </div>
            {!birthday.canSend && <p className="birthday-send-note">誕生日カードは、前日から当日まで送れます</p>}
          </>
        )}
        <PendingCardsNotice count={pendingCount}/>
        <div className="wall-messages">
          {messages.length ? messages.map((message) => <WallMessageCard key={message.id} message={message} onMenu={openMessageMenu}/>) : (
            <div className="wall-empty"><span aria-hidden="true">{birthday.phase === "eve" ? "🎁" : "💌"}</span><p>{birthday.phase === "eve" ? "誕生日になったら、お祝いのカードが開きます" : "ここに、お祝いの言葉が届きます。"}</p></div>
          )}
        </div>
        <p className="wall-caption">ひとことのおめでとうが、特別な日に。</p>
      </div>
      {menu && <Modal title={report ? "問題を報告" : "メッセージについて"} onClose={() => setMenu(null)}>
        {!report ? (
          <div className="message-menu">
            <button onClick={() => { actions.hideMessage(menu.id); setMenu(null); }}>このメッセージを非表示</button>
            {menu.authorId !== "self" && <button onClick={() => { actions.blockUser(menu.authorId); setMenu(null); }}>この人をブロック</button>}
            <button onClick={() => setReport(true)}>問題を報告</button>
          </div>
        ) : reportDone ? (
          <div className="report-confirm"><Icon name="check" size={32}/><p>報告内容をこの端末に保存しました。</p><p className="small muted">運営への送信は、バックエンド接続後に利用できます。</p><Button onClick={() => setMenu(null)}>閉じる</Button></div>
        ) : (
          <><label className="small" htmlFor="report-reason">理由</label><select className="input" id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)}><option>不適切な内容</option><option>迷惑・嫌がらせ</option><option>個人情報</option><option>その他</option></select><p className="small muted report-note">現在はデモです。報告は端末内に保存されます。</p><Button onClick={saveReport}>報告内容を保存</Button></>
        )}
      </Modal>}
    </div>
  );
}
