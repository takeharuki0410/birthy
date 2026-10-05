"use client";

import { useState } from "react";
import { Avatar, Icon, Modal, PageHeader } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import type { Notification } from "@/types/birthy";
import "../social.css";

function noticeDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hour12: false }).format(new Date(value));
}
export function Notifications({ onOpenBirthday, onOpenConnections, onOpenReceived }: { onOpenBirthday: (id: string) => void; onOpenConnections: () => void; onOpenReceived: () => void }) {
  const { state, actions } = useBirthyStore();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notice, setNotice] = useState<Notification | null>(null);
  const notices = state.notifications.filter((item) => (tab === "all" || !item.read) && (!item.personId || !state.blocked.includes(item.personId))).slice().sort((a, b) => b.date.localeCompare(a.date));
  const open = (item: Notification) => {
    actions.markRead(item.id);
    if (item.kind === "request" || item.kind === "connection") onOpenConnections();
    else if (item.kind === "message" || item.kind === "balloon") onOpenReceived();
    else if (item.kind === "birthday" && item.personId) onOpenBirthday(item.personId);
    else setNotice(item);
  };
  return <><PageHeader title="お知らせ" action={<button className="icon-button" aria-label="すべて既読にする" onClick={() => actions.markRead()}><Icon name="check" size={20}/></button>}/><div className="content social-content"><div className="social-tabs" data-active-index={tab === "unread" ? 1 : 0} role="tablist" aria-label="お知らせの表示"><button role="tab" aria-selected={tab === "all"} className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>すべて</button><button role="tab" aria-selected={tab === "unread"} className={tab === "unread" ? "active" : ""} onClick={() => setTab("unread")}>未読</button></div><div className="panel notice-list">{notices.length === 0 ? <div className="empty-state"><Icon name="bell" size={28}/><p>{tab === "unread" ? "未読のお知らせはありません" : "お知らせはまだありません"}</p></div> : notices.map((item) => { const person = state.people.find((person) => person.id === item.personId); return <button className={`notice-row ${item.read ? "" : "notice-unread"}`} key={item.id} onClick={() => open(item)}>{person ? <Avatar src={person.avatar} name={person.nickname} size={42}/> : <span className={`notice-symbol notice-symbol-${item.kind}`}><Icon name={item.kind === "balloon" ? "balloon" : item.kind === "message" ? "mail" : "bell"} size={23}/></span>}<span className="notice-text"><span>{item.text}</span><small>{noticeDate(item.date)}</small></span>{!item.read && <span className="unread-dot" aria-label="未読"/>}<Icon name="chevron" size={16}/></button>; })}</div><button className="text-link mark-all" onClick={() => actions.markRead()}>すべて既読にする</button><p className="small muted social-footnote">誕生日のお知らせは、前日・当日の朝9時に。</p></div>{notice && <Modal title="Birthyからのお知らせ" onClose={() => setNotice(null)}><p>{notice.text}</p><p className="small muted">{noticeDate(notice.date)}</p></Modal>}</>;
}
