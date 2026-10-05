"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { Avatar, Button, Icon, Modal, PageHeader, Toggle } from "@/components/birthy/ui";
import { useBirthyStore } from "@/lib/birthy/store";
import { ProfileEditor } from "./profile-editor";
import { myPageSections } from "./settings-sections";
import type { MyPageSection } from "./settings-sections";
import "../social.css";

/** Every editor is a child of MyPage; routing supplies a return to /mypage. */
export function Settings({ section, onBack, onDelete }: { section: MyPageSection; onBack: () => void; onDelete: () => void }) {
  const { state, actions } = useBirthyStore();
  const [feedback, setFeedback] = useState("");
  const [dialog, setDialog] = useState<"delete" | "line" | null>(null);
  const [email, setEmail] = useState(state.preferences.email);
  const current = myPageSections.find((item) => item.id === section);

  const saveEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.updatePreferences({ email: email.trim() });
    setFeedback("メールアドレスを保存しました。確認メールはまだ送信されません。");
  };

  return <>
    <PageHeader title={current?.label || "マイページ"} onBack={onBack}/>
    <div className="content social-content settings-content">
      {(section === "profile" || section === "birthday" || section === "id") && <ProfileEditor mode={section} profile={state.profile} onSave={actions.updateProfile}/>}
      {section === "privacy" && <>
        <div className="panel settings-toggles">
          <Toggle label="つながっている人には生年月日を表示する" description="オフにすると、つながっている人にも月日だけが表示されます。" checked={state.profile.showFullBirthday} onChange={(value) => actions.updateProfile({ showFullBirthday: value })}/>
          <Toggle label="Birthy IDで見つけてもらう" description="ID検索の結果にプロフィールを表示します。" checked={state.preferences.idSearch} onChange={(value) => actions.updatePreferences({ idSearch: value })}/>
          <Toggle label="つながり申請を受け取る" checked={state.preferences.connectionRequests} onChange={(value) => actions.updatePreferences({ connectionRequests: value })}/>
        </div>
        <div className="privacy-note"><Icon name="lock" size={18}/><p>公開プロフィールや、サークルで一緒なだけの人には、誕生日の月日だけが表示されます。</p></div>
        <p className="small muted">変更はこのブラウザに保存されます。公開範囲の本番サービスへの反映は準備中です。</p>
      </>}
      {section === "notifications" && <>
        <div className="panel settings-toggles">
          <Toggle label="前日の朝9時にお知らせ" description="つながっている人の誕生日を、前日に。" checked={state.preferences.notifyTomorrow} onChange={(value) => actions.updatePreferences({ notifyTomorrow: value })}/>
          <Toggle label="当日の朝9時にお知らせ" description="誕生日の朝に、そっとお知らせします。" checked={state.preferences.notifyToday} onChange={(value) => actions.updatePreferences({ notifyToday: value })}/>
          <Toggle label="Birthyからのお知らせ" checked={state.preferences.notifyBirthy} onChange={(value) => actions.updatePreferences({ notifyBirthy: value })}/>
        </div>
        <p className="small muted">通知時刻は日本時間です。通知の配信は準備中です。</p>
      </>}
      {section === "account" && <>
        <div className="panel account-line">
          <span className="line-mark">LINE</span><span><strong>LINE連携</strong><small>未接続（デモで登録中）</small></span>
          <button className="text-link" onClick={() => setDialog("line")}>連携について</button>
        </div>
        <form className="settings-form" onSubmit={saveEmail}>
          <label className="field-label" htmlFor="account-email">メールアドレス <span className="muted">（任意）</span></label>
          <input className="input" id="account-email" type="email" value={email} placeholder="メールアドレスを入力" onChange={(event) => { setEmail(event.target.value); setFeedback(""); }} maxLength={254}/>
          <p className="small muted">メール登録は任意です。現在はこのブラウザ内への保存のみです。</p>
          <Button type="submit">メールアドレスを保存</Button>
        </form>
        <Link className="settings-entry panel" href="/mypage/blocked"><Icon name="users" size={19}/><span>ブロックしたユーザー</span><Icon name="chevron" size={16}/></Link>
        <button className="delete-account" onClick={() => setDialog("delete")}>アカウントを削除</button>
      </>}
      {section === "blocked" && <>
        <p className="small muted">ブロックした相手は、お祝いとつながりの一覧に表示されません。</p>
        <div className="panel">
          {state.blocked.length === 0 ? <div className="empty-state"><Icon name="shield" size={28}/><p>ブロックしたユーザーはいません</p></div>
            : state.blocked.map((id) => {
              const person = state.people.find((person) => person.id === id);
              const message = state.messages.find((message) => message.authorId === id);
              const name = person?.nickname || message?.authorName || "ユーザー";
              return <div className="social-person" key={id}>
                <Avatar src={person?.avatar || message?.avatar || state.profile.avatar} name={name} size={42}/>
                <strong className="circle-member">{name}</strong>
                <button className="text-link" onClick={() => { actions.unblockUser(id); setFeedback("ブロックを解除しました"); }}>解除する</button>
              </div>;
            })}
        </div>
      </>}
      {(section === "terms" || section === "policy") && <div className="panel legal-placeholder">
        <Icon name={section === "terms" ? "shield" : "lock"} size={30}/>
        <h2>正式版は準備中です</h2>
        <p className="small muted">運営が承認した正式な{section === "terms" ? "利用規約" : "プライバシーポリシー"}は、本番公開前にここに掲載します。</p>
      </div>}
      {section === "contact" && <div className="panel contact-card">
        <span className="notice-symbol"><Icon name="mail" size={27}/></span>
        <h2>お問い合わせ</h2><p className="muted small">お問い合わせ窓口は準備中です。</p>
        <p className="muted small">本番公開前に、運営のお問い合わせ先をここに掲載します。</p>
      </div>}
      {feedback && <p className="social-feedback editor-feedback editor-feedback-success" role="status"><Icon name="check" size={17}/><span>{feedback}</span></p>}
    </div>
    {dialog === "delete" && <Modal title="アカウントを削除しますか？" onClose={() => setDialog(null)}>
      <p className="small">このブラウザに保存したプロフィール、お祝い、設定をリセットします。これはデモの削除操作です。</p>
      <p className="small muted">本番アカウント・Supabaseのデータ・LINEアカウントは削除されません。</p>
      <div className="stack-actions">
        <Button variant="pink" onClick={() => { actions.deleteAccount(); setDialog(null); onDelete(); }}>デモデータを削除する</Button>
        <Button variant="outline" onClick={() => setDialog(null)}>キャンセル</Button>
      </div>
    </Modal>}
    {dialog === "line" && <Modal title="LINE連携について" onClose={() => setDialog(null)}>
      <p className="small">現在はLINE Loginを接続していないため、デモのプロフィールで利用しています。</p>
      <p className="small muted">LINE連携後は、LINEアカウントでBirthyを始められます。</p>
    </Modal>}
  </>;
}
