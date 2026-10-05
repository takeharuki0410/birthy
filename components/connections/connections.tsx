"use client";

import { useState, useSyncExternalStore } from "react";
import { Avatar, Button, Icon, Modal, PageHeader } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { birthdayLabel } from "@/lib/birthy/date";
import type { Circle, Person } from "@/types/birthy";
import { InvitationQR } from "./invitation-qr";
import "../social.css";

type Dialog = "qr" | "invite" | "circles" | null;
function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}
const clientSearch = () => window.location.search;
const serverSearch = () => "";
export function Connections({ onOpenBirthday }: { onOpenBirthday: (id: string) => void }) {
  const { state, actions } = useBirthyStore();
  const [tab, setTab] = useState<"connected" | "requests" | null>(null);
  const query = new URLSearchParams(useSyncExternalStore(subscribeToLocation, clientSearch, serverSearch));
  const activeTab = tab ?? (query.get("tab") === "requests" ? "requests" : "connected");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const normalized = search.trim().replace(/^@/, "").toLowerCase();
  const people = state.people.filter((person) => !state.blocked.includes(person.id));
  const shown = normalized ? people.filter((person) => person.birthyId.toLowerCase() === normalized) : people.filter((person) => activeTab === "connected" ? person.connected : state.requests.includes(person.id));
  const invitedId = query.get("invite");
  const invitedPerson = invitedId && people.find((person) => person.birthyId === invitedId);
  const invitedCircle = state.circles.find((item) => item.id === query.get("circle"));
  const openInvite = (kind: "qr" | "invite") => {
    setInviteUrl(`${window.location.origin}/connections?invite=${encodeURIComponent(state.profile.birthyId || "self")}`);
    setFeedback(""); setDialog(kind);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setFeedback("招待リンクをコピーしました"); }
    catch { setFeedback("リンクを長押ししてコピーできます"); }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Birthyでつながりませんか？", text: `${state.profile.nickname}からBirthyへの招待です。`, url: inviteUrl });
      else await copy();
    } catch { setFeedback("共有をキャンセルしました。リンクのコピーもできます。"); }
  };
  const requested = (person: Person) => sent.includes(person.id) || state.notifications.some((notice) => notice.kind === "info" && notice.personId === person.id && notice.text.includes("申請を送りました"));
  const selectedCircle = circle && state.circles.find((item) => item.id === circle.id);
  return <><PageHeader title="つながり" action={<button className="icon-button" aria-label="つながりについて" onClick={() => { setFeedback("Birthy ID、招待リンク、QRからつながれます。相互につながると、誕生日がホームに表示されます。"); setDialog("invite"); setInviteUrl(""); }}><Icon name="help" size={20}/></button>}/>
    <div className="content social-content">
      {invitedId && <div className="incoming-invite"><strong>招待リンクを開きました</strong><p className="small muted">{invitedPerson ? `${invitedPerson.nickname}さんのプロフィールから、つながりを申請できます。` : "招待の送受信はデモです。本番の招待プロフィールはLINE連携後に表示されます。"}</p>{invitedPerson && <button className="text-link" onClick={() => setSearch(invitedPerson.birthyId)}>招待した人を表示</button>}</div>}
      {invitedCircle && <div className="incoming-invite"><strong>{invitedCircle.name}への招待</strong><p className="small muted">参加前に、サークルの内容を確認できます。</p><button className="text-link" onClick={() => { setCircle(invitedCircle); setDialog("circles"); setFeedback(""); }}>サークルを確認する</button></div>}
      <div className="social-tabs" data-active-index={activeTab === "requests" ? 1 : 0} role="tablist" aria-label="つながりの一覧"><button role="tab" aria-selected={activeTab === "connected"} className={activeTab === "connected" ? "active" : ""} onClick={() => { setTab("connected"); setSearch(""); }}>つながっている人</button><button role="tab" aria-selected={activeTab === "requests"} className={activeTab === "requests" ? "active" : ""} onClick={() => { setTab("requests"); setSearch(""); }}>申請{state.requests.length > 0 && <span className="quiet-count">{state.requests.length}</span>}</button></div>
      <label className="social-search"><Icon name="search" size={19}/><input aria-label="Birthy IDで検索" placeholder="Birthy IDで検索" value={search} onChange={(event) => setSearch(event.target.value)} autoCapitalize="none" autoCorrect="off"/></label>
      <div className="social-actions"><button className="quick-action quick-blue" onClick={() => openInvite("qr")}><Icon name="qr" size={27}/><span>QRで招待</span></button><button className="quick-action quick-green" onClick={() => openInvite("invite")}><span className="line-mark" aria-hidden="true">LINE</span><span>LINEで招待</span></button><button className="quick-action quick-purple" onClick={() => { setDialog("circles"); setFeedback(""); }}><Icon name="users" size={27}/><span>サークル</span></button></div>
      {normalized && <p className="small muted">IDが一致する人を表示しています。検索はサンプルデータです。</p>}
      <div className="panel social-people">{shown.length === 0 ? <div className="empty-state"><Icon name={normalized ? "search" : "users"} size={28}/><p>{normalized ? "このIDの人は見つかりませんでした" : activeTab === "requests" ? "新しい申請はありません" : "まだつながりがありません"}</p><span className="small muted">{normalized ? "例：@hina_25" : "QRや招待リンクで、気軽につながれます。"}</span></div> : shown.map((person) => <div className="social-person" key={person.id}><button className="person-main" onClick={() => onOpenBirthday(person.id)}><Avatar src={person.avatar} name={person.nickname}/><span><strong>{person.nickname}</strong><small>{person.affiliation || birthdayLabel(person.birthday)}</small></span></button>{person.connected ? <button className="icon-button" aria-label={`${person.nickname}さんの誕生日ページ`} onClick={() => onOpenBirthday(person.id)}><Icon name="chevron" size={18}/></button> : state.requests.includes(person.id) ? <div className="request-actions"><button className="compact-accept" onClick={() => { actions.acceptRequest(person.id); setFeedback(`${person.nickname}さんとつながりました`); }}>承認</button><button className="icon-button" aria-label={`${person.nickname}さんの申請を辞退`} onClick={() => { actions.declineRequest(person.id); setFeedback("申請を辞退しました"); }}><Icon name="close" size={17}/></button></div> : <button className="compact-accept" disabled={requested(person)} onClick={() => { actions.requestConnection(person.id); setSent((value) => [...value, person.id]); setFeedback(`${person.nickname}さんに申請を送りました`); }}>{requested(person) ? "申請済み" : "申請する"}</button>}</div>)}</div>
      {feedback && !dialog && <p className="social-feedback" role="status">{feedback}</p>}
      <p className="small muted social-footnote">いつもの人と、あなたのペースで。</p>
    </div>
    {(dialog === "qr" || dialog === "invite") && <Modal title={inviteUrl ? dialog === "qr" ? "QRでつながる" : "LINEで招待" : "つながりについて"} onClose={() => setDialog(null)}>{inviteUrl && <><div className="invite-profile"><Avatar src={state.profile.avatar} name={state.profile.nickname} size={62}/><strong>{state.profile.nickname}</strong>{state.profile.birthyId && <span className="small muted">@{state.profile.birthyId}</span>}</div>{dialog === "qr" && <InvitationQR value={inviteUrl}/>}<p className="small muted">招待リンクを開いて、つながりを申請できます。</p><label className="field-label" htmlFor="invite-link">招待リンク</label><input id="invite-link" className="input invite-url" value={inviteUrl} readOnly onFocus={(event) => event.currentTarget.select()}/><div className="stack-actions">{dialog === "invite" && <Button variant="green" onClick={share}>招待リンクを共有する</Button>}<Button variant="outline" onClick={copy}>リンクをコピー</Button></div><p className="small muted social-footnote">招待の送受信はデモです。LINE連携はまだ接続されていません。</p></>}{feedback && <p role="status" className="social-feedback">{feedback}</p>}</Modal>}
    {dialog === "circles" && <Modal title="サークル" onClose={() => { setDialog(null); setCircle(null); }}>{!selectedCircle ? <><p className="small muted">招待リンクやQRから、あとで参加できます。</p><div className="circle-list">{state.circles.map((item) => <button key={item.id} className="circle-card" onClick={() => setCircle(item)}><span className="circle-icon"><Icon name="users"/></span><span><strong>{item.name}</strong><small>{item.members + (item.joined ? 1 : 0)}人 · {item.joined ? "参加中" : "招待されたサークル"}</small></span><Icon name="chevron" size={17}/></button>)}</div></> : <><button className="text-link" onClick={() => setCircle(null)}>← サークル一覧</button><h3 className="circle-title">{selectedCircle.name}</h3><p className="muted small">{selectedCircle.description}</p><p className="small muted">同じサークルにいる人には、誕生日の月日だけ表示されます。</p><h4 className="field-label">メンバー（サンプル）</h4>{people.filter((person) => person.affiliation === selectedCircle.name).map((person) => <div className="social-person" key={person.id}><Avatar src={person.avatar} name={person.nickname} size={40}/><span className="circle-member"><strong>{person.nickname}</strong><small>{birthdayLabel(person.birthday)}</small></span></div>)}<div className="stack-actions"><Button variant={selectedCircle.joined ? "outline" : "primary"} onClick={() => { if (selectedCircle.joined) actions.leaveCircle(selectedCircle.id); else actions.joinCircle(selectedCircle.id); }}>{selectedCircle.joined ? "サークルを退出する" : "このサークルに参加する"}</Button><Button variant="subtle" onClick={async () => { const link = `${window.location.origin}/connections?circle=${selectedCircle.id}`; try { await navigator.clipboard.writeText(link); setFeedback("サークルの招待リンクをコピーしました"); } catch { setFeedback(`招待リンク：${link}`); } }}>招待リンクをコピー</Button></div></>}{feedback && <p role="status" className="social-feedback">{feedback}</p>}<p className="small muted social-footnote">サークルの参加・招待はサンプルデータで動作します。</p></Modal>}
  </>;
}
