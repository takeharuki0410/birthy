"use client";

import { useState } from "react";
import { Avatar, BalloonArt, PageHeader, Icon } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { isCardRevealed } from "@/lib/birthy/birthday-cards";
import { useBirthdayNow } from "@/lib/birthy/use-birthday-clock";
import { PendingCardsNotice, WallMessageCard } from "./wall-message-card";
import "./birthday.css";

export function ReceivedGifts({ onBack }: { onBack: () => void }) {
  const { state } = useBirthyStore();
  const now = useBirthdayNow();
  const [tab, setTab] = useState<"balloons" | "messages">("balloons");
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric" }).format(now));
  const balloons = state.balloons.filter((balloon) => balloon.recipientId === "self" && balloon.year === year && !state.blocked.includes(balloon.senderId) && (!balloon.revealAt || isCardRevealed({ revealAt: balloon.revealAt }, now)));
  const total = balloons.reduce((sum, balloon) => sum + balloon.count, 0);
  // Preserve sender arrival order, never sort by the number of balloons.
  const senders = [...new Set(balloons.map((balloon) => balloon.senderId))].map((id) => ({ ...balloons.find((balloon) => balloon.senderId === id)!, count: balloons.filter((balloon) => balloon.senderId === id).reduce((sum, balloon) => sum + balloon.count, 0) }));
  const availableMessages = state.messages.filter((message) => message.recipientId === "self" && !state.hiddenMessages.includes(message.id) && !state.blocked.includes(message.authorId));
  const messages = availableMessages.filter((message) => isCardRevealed(message, now)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingCount = availableMessages.filter((message) => !isCardRevealed(message, now)).length;

  return (
    <div className="screen-enter">
      <PageHeader title="届いたお祝い" onBack={onBack}/>
      <div className={`gifts-tabs ${tab === "messages" ? "messages-selected" : ""}`} data-active-index={tab === "messages" ? 1 : 0} role="tablist" aria-label="届いたお祝い">
        <button id="gifts-tab-balloons" role="tab" aria-controls="gifts-panel-balloons" aria-selected={tab === "balloons"} onClick={() => setTab("balloons")}>風船</button>
        <button id="gifts-tab-messages" role="tab" aria-controls="gifts-panel-messages" aria-selected={tab === "messages"} onClick={() => setTab("messages")}>メッセージ</button>
      </div>
      <div className="content">
        <PendingCardsNotice count={pendingCount}/>
        {tab === "balloons" ? (
          <div role="tabpanel" id="gifts-panel-balloons" aria-labelledby="gifts-tab-balloons" key="balloons" className="gifts-panel-enter">
            <div className="received-summary"><BalloonArt happy/><p className="small muted">{year}年のお誕生日</p><h1>届いた風船 <strong>{total}</strong><span>個</span></h1><p className="small muted"><Icon name="lock" size={12}/>この数と送信者は、あなたにだけ表示されます</p></div>
            <div className="panel">{senders.map((sender) => <div className="person-row" key={sender.senderId}><Avatar src={sender.avatar} name={sender.senderName} size={42}/><div><h3>{sender.senderName}</h3></div><span className="sender-count">{sender.count}<small>個</small></span></div>)}{senders.length === 0 && <p className="empty-state">届いた風船がここに表示されます。</p>}</div>
          </div>
        ) : (
          <div className="received-messages gifts-panel-enter" role="tabpanel" id="gifts-panel-messages" aria-labelledby="gifts-tab-messages" key="messages">
            {messages.map((message) => <div className="panel received-wall-card" key={message.id}><WallMessageCard message={message}/></div>)}
            {messages.length === 0 && <p className="empty-state">{pendingCount ? "届いたカードは、誕生日にここで開けます。" : "届いたお祝いのメッセージがここに表示されます。"}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
