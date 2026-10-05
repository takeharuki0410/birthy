"use client";

import { Avatar, Icon } from "@/components/birthy/ui";
import { MessageLikes } from "./message-likes";
import type { WallMessage } from "@/types/birthy";

const messageTime = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });

/** Render only after the caller has checked the card's reveal time. */
export function WallMessageCard({ message, onMenu }: { message: WallMessage; onMenu?: (message: WallMessage) => void }) {
  return (
    <article className="wall-message birthday-card-reveal">
      <Avatar src={message.avatar} name={message.authorName} size={39}/>
      <div className="wall-message-content">
        <div className="wall-author">
          <h3>{message.authorName}</h3>
          <time dateTime={message.createdAt}>{messageTime.format(new Date(message.createdAt))}</time>
          {onMenu && <button className="icon-button" aria-label={`${message.authorName}さんのメッセージメニュー`} onClick={() => onMenu(message)}><Icon name="more" size={17}/></button>}
        </div>
        <p>{message.text}</p>
        <div className="wall-message-footer">
          <span className="wall-reaction" aria-label={`リアクション ${message.reaction}`}>{message.reaction}</span>
          {message.visibility === "public" && <MessageLikes message={message}/>}
        </div>
        {message.visibility === "private" && <small className="received-private-label"><Icon name="lock" size={12}/>あなたにだけ表示</small>}
      </div>
    </article>
  );
}

/** Keep sealed cards anonymous: no sender, text, reaction, or timestamps. */
export function PendingCardsNotice({ count }: { count: number }) {
  if (count < 1) return null;
  return <div className="pending-cards-notice" role="status"><span aria-hidden="true">🎁</span><div><p>{count}件のお祝いが届いています</p><small>誕生日になったら開けます</small></div></div>;
}
