"use client";
import Link from "next/link";
import { Icon } from "@/components/birthy/ui";
import type { Tab, IconName } from "@/types/birthy";
const items: { tab: Tab; label: string; icon: IconName }[] = [{ tab: "home", label: "ホーム", icon: "home" }, { tab: "connections", label: "つながり", icon: "users" },{ tab: "notifications", label: "お知らせ", icon: "bell" }, { tab: "mypage", label: "マイページ", icon: "user" }];
export function BottomNav({ active, unread }: { active: Tab; unread: boolean }) {
  return <nav className="bottom-nav" aria-label="メインナビゲーション">{items.map((item) => <Link key={item.tab} href={`/${item.tab}`} className={`nav-item ${active === item.tab ? "active" : ""}`} aria-current={active === item.tab ? "page" : undefined}><Icon name={item.icon}/>{item.tab === "notifications" && unread && <span className="nav-dot" aria-label="未読のお知らせがあります"/>}<span>{item.label}</span></Link>)}</nav>;
}
