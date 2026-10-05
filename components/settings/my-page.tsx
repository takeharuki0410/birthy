"use client";

import Link from "next/link";
import { Avatar, Button, Icon, PageHeader } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel } from "@/lib/birthy/date";
import { myPageSections } from "./settings-sections";
import "../social.css";

export function MyPage({ onOpenReceived }: { onOpenReceived: () => void }) {
  const { state } = useBirthyStore();
  const circles = state.circles.filter((circle) => circle.joined);
  const connected = state.people.filter((person) => person.connected && !state.blocked.includes(person.id)).length;
  return <>
    <PageHeader title="マイページ"/>
    <div className="content social-content">
      <section className="my-profile">
        <Avatar src={state.profile.avatar} name={state.profile.nickname} size={88}/>
        <h2>{state.profile.nickname}</h2>
        {state.profile.birthyId && <p className="small muted">@{state.profile.birthyId}</p>}
        <p className="my-birthday"><Icon name="cake" size={16}/>{birthdayLabel(state.profile.birthday, true)}</p>
        <div className="profile-stats">
          <Link href="/connections"><strong>{connected}</strong><span>つながり</span></Link>
          <Link href="/connections"><strong>{circles.length}</strong><span>サークル</span></Link>
        </div>
      </section>
      <Button className="received-button" variant="outline" onClick={onOpenReceived}>
        <Icon name="balloon" size={19}/>届いたお祝いを見る<Icon name="chevron" size={17}/>
      </Button>
      <nav className="panel settings-menu" aria-label="プロフィールと設定">
        {myPageSections.map((item) => <Link className="settings-entry" key={item.id} href={`/mypage/${item.id}`}>
          <Icon name={item.icon} size={19}/><span>{item.label}</span><Icon name="chevron" size={16}/>
        </Link>)}
      </nav>
      <section className="my-circles">
        <h3 className="section-title">所属サークル</h3>
        {circles.length ? <div className="circle-chips">{circles.map((circle) => <Link href="/connections" key={circle.id}><Icon name="users" size={15}/>{circle.name}</Link>)}</div>
          : <p className="small muted">参加中のサークルはありません。招待を受けて、あとから参加できます。</p>}
      </section>
    </div>
  </>;
}
