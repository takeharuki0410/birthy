"use client";

import { useState } from "react";
import { Icon } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { summarizeMessageLikes } from "@/lib/birthy/birthday-cards";
import type { WallMessage } from "@/types/birthy";

/** Public-card feedback. Recipient likes stay separate from ordinary likes. */
export function MessageLikes({ message }: { message: WallMessage }) {
  const { state, actions } = useBirthyStore();
  const [pulse, setPulse] = useState(0);
  if (message.visibility !== "public") return null;

  const { viewerLiked: liked, ownerLiked, otherCount: ordinaryCount } = summarizeMessageLikes(state.messageLikes, message.id, message.recipientId);

  return (
    <div className="message-likes">
      <button
        type="button"
        className={`message-like-button ${liked ? "is-liked" : ""}`}
        aria-pressed={liked}
        aria-label={liked ? "いいねを取り消す" : "いいねする"}
        onClick={() => {
          if (actions.toggleMessageLike(message.id, "self") === false) return;
          setPulse((value) => value + 1);
        }}
      >
        <span key={pulse} className={pulse ? "message-like-pop" : ""}>
          <Icon name="heart" size={16}/>
        </span>
        <span>いいね</span>
        {ordinaryCount > 0 && <span className="message-like-count" aria-label={`本人以外のいいね ${ordinaryCount}件`}>{ordinaryCount}</span>}
      </button>
      {ownerLiked && <span className="birthday-owner-like" aria-label="誕生日の本人もいいねしています"><Icon name="heart" size={12}/><span>本人</span></span>}
    </div>
  );
}
