"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Avatar, Brand, Button, Icon } from "./ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { fetchConnectionSnapshot } from "@/lib/birthy/connections-client";
import { birthdayLabel, isoDate, todayInTokyo } from "@/lib/birthy/date";
import { useBirthdayNow } from "@/lib/birthy/use-birthday-clock";
import "./home.css";
export function Home({ onOpenBirthday }: { onOpenBirthday: (id: string) => void }) {
  const { state, actions } = useBirthyStore();
  const now = useBirthdayNow();
  useEffect(() => {
    const controller = new AbortController();
    void fetchConnectionSnapshot(controller.signal)
      .then((snapshot) => {
        const people = [...snapshot.accepted, ...snapshot.incoming, ...snapshot.outgoing].map((item) => item.person);
        actions.replaceConnectionData(people, snapshot.incoming.map((item) => item.person.id));
      })
      .catch(() => { /* Keep the current UI if the network is temporarily unavailable. */ });
    return () => controller.abort();
  }, [actions]);
  const today = todayInTokyo(now); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const people = state.people.filter((p) => p.connected && !state.blocked.includes(p.id));
  const current = people.filter((p) => p.birthday.slice(5) === isoDate(today).slice(5));
  const next = people.filter((p) => p.birthday.slice(5) === isoDate(tomorrow).slice(5));
  const unread = state.notifications.some((n) => !n.read);
  return <div className="screen-enter"><header className="home-header"><span className="home-header-spacer"/><Link href="/home" aria-label="Birthy ホーム"><Brand/></Link><Link href="/notifications" className="icon-button home-notice" aria-label="お知らせ"><Icon name="bell" size={21}/>{unread && <i/>}</Link></header><div className="content home-content"><div className="home-intro"><p className="eyebrow">A LITTLE DAY, A SPECIAL FEELING</p><div><h1>おめでとうを、<br/>いつもより気軽に。</h1><span className="home-date">{today.getMonth()+1}<span>/</span>{today.getDate()}<small>{["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"][today.getDay()]}</small></span></div></div><h2 className="section-title"><span className="section-icon"><Icon name="heart" size={16}/></span>今日の誕生日</h2><div className="today-list">{current.length ? current.map((person) => <article className="today-card" key={person.id}><div className="today-card-decoration" aria-hidden="true"><span/><span/><span/></div><p className="today-tag"><Icon name="cake" size={13}/> HAPPY BIRTHDAY</p><button className="today-person" onClick={() => onOpenBirthday(person.id)} aria-label={`${person.nickname}さんの誕生日ページ`}><Avatar src={person.avatar} name={person.nickname} size={69}/><div><h3>{person.nickname}<span>さん</span></h3><p>{birthdayLabel(person.birthday)}</p><p className="small muted">{person.affiliation}</p></div></button><Button variant="pink" onClick={() => onOpenBirthday(person.id)}><Icon name="heart" size={16}/>お祝いする</Button></article>) : <div className="panel empty-state">今日はつながっている人の誕生日はありません。<br/>また、特別な日に。</div>}</div><h2 className="section-title"><span className="section-icon blue"><Icon name="calendar" size={16}/></span>明日の誕生日</h2><section className="panel tomorrow-list" aria-label="明日の誕生日">{next.length ? next.map((person) => <button className="person-row" key={person.id} onClick={() => onOpenBirthday(person.id)}><Avatar src={person.avatar} name={person.nickname} size={47}/><div><h3>{person.nickname}<span className="person-suffix">さん</span></h3><p className="small muted">{birthdayLabel(person.birthday)}<span className="row-divider">·</span>{person.affiliation}</p></div><Icon name="chevron" size={15} className="chevron"/></button>) : <p className="empty-state">明日の誕生日はありません。</p>}</section><div className="home-footnote"><span>☁</span><p>ちょっと久しぶりのあの人にも。<br/>あなたのペースで、気持ちを届けよう。</p></div></div></div>;
}
