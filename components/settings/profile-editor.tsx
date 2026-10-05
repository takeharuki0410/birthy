"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Avatar, Button, Icon } from "@/components/birthy/ui";
import { useBirthyId } from "@/lib/birthy/use-birthy-id";
import { isValidBirthday, isoDate, todayInTokyo } from "@/lib/birthy/date";
import type { Profile } from "@/types/birthy";

type ProfileEditorMode = "profile" | "birthday" | "id";

async function resizeAvatar(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("JPEG・PNG・WebPの画像を選んでください");
  if (file.size > 2 * 1024 * 1024) throw new Error("2MB以下の画像を選んでください");
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("画像を読み込めませんでした"));
      element.src = source;
    });
    const canvas = document.createElement("canvas");
    const edge = Math.min(384, image.naturalWidth, image.naturalHeight);
    canvas.width = edge;
    canvas.height = edge;
    const context = canvas.getContext("2d");
    if (!context || !edge) throw new Error("画像を読み込めませんでした");
    const crop = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, edge, edge);
    return canvas.toDataURL("image/webp", 0.85);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function ProfileEditor({ profile, onSave, mode }: {
  profile: Profile;
  onSave: (profile: Partial<Profile>) => void;
  mode: ProfileEditorMode;
}) {
  const [form, setForm] = useState(profile);
  const [sourceProfile, setSourceProfile] = useState(profile);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const id = useBirthyId(mode === "id" ? form.birthyId : "", mode === "id" ? profile.birthyId : undefined);
  const permitted = mode !== "id" || !form.birthyId.trim() || id.status === "available" || id.status === "unchanged";

  // The external store hydrates from this browser after the first render. Sync
  // the editor before painting when that saved profile replaces the SSR value.
  if (sourceProfile !== profile) {
    setSourceProfile(profile);
    setForm(profile);
  }

  const changeAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    try {
      const avatar = await resizeAvatar(file);
      setForm((value) => ({ ...value, avatar }));
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : "画像を読み込めませんでした", success: false });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!permitted || uploading) return;
    if (mode === "profile") {
      const nickname = form.nickname.trim();
      if (!nickname || nickname.length > 20) {
        setFeedback({ message: "ニックネームは1〜20文字で入力してください", success: false });
        return;
      }
      onSave({ nickname, avatar: form.avatar });
      setForm((value) => ({ ...value, nickname }));
    } else if (mode === "birthday") {
      if (!isValidBirthday(form.birthday)) {
        setFeedback({ message: "正しい生年月日を入力してください", success: false });
        return;
      }
      onSave({ birthday: form.birthday });
    } else {
      onSave({ birthyId: id.normalizedId });
      setForm((value) => ({ ...value, birthyId: id.normalizedId }));
    }
    const savedLabel = mode === "profile" ? "プロフィール" : mode === "birthday" ? "誕生日" : "Birthy ID";
    setFeedback({ message: `${savedLabel}を保存しました`, success: true });
  };

  return <form onSubmit={save} className="settings-form">
    {mode === "profile" && <>
      <div className="profile-upload">
        <Avatar src={form.avatar} name={form.nickname || "プロフィール"} size={88}/>
        <label className="upload-button">
          <Icon name="camera" size={18}/><span className="sr-only">プロフィール画像を変更</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={changeAvatar} disabled={uploading}/>
        </label>
      </div>
      <p className="small muted upload-help">カメラアイコンから変更 · 2MBまで</p>
      <label className="field-label" htmlFor="profile-nickname">ニックネーム</label>
      <input id="profile-nickname" className="input" value={form.nickname} maxLength={20} required onChange={(event) => { setForm({ ...form, nickname: event.target.value }); setFeedback(null); }}/>
      <p className="small muted editor-hint">Birthyでは、好きなニックネームで過ごせます。</p>
    </>}
    {mode === "birthday" && <>
      <span className="editor-symbol" aria-hidden="true"><Icon name="cake" size={25}/></span>
      <label className="field-label" htmlFor="profile-birthday">生年月日</label>
      <input id="profile-birthday" className="input date-input" type="date" min="1900-01-01" max={isoDate(todayInTokyo())} required value={form.birthday} onChange={(event) => { setForm({ ...form, birthday: event.target.value }); setFeedback(null); }}/>
      <p className="small muted editor-hint">公開プロフィールには、誕生日の月日だけが表示されます。つながっている人への表示は、プライバシーで変更できます。</p>
    </>}
    {mode === "id" && <>
      <span className="editor-symbol editor-symbol-blue" aria-hidden="true"><Icon name="search" size={25}/></span>
      <label className="field-label" htmlFor="profile-id">Birthy ID <span className="muted">（任意）</span></label>
      <div className="id-input-wrap">
        <span>@</span>
        <input id="profile-id" className="input" value={form.birthyId} autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={21} aria-describedby="profile-id-status profile-id-hint" onChange={(event) => { setForm({ ...form, birthyId: event.target.value }); setFeedback(null); }}/>
      </div>
      <p className={`small id-status id-status-${id.status}`} id="profile-id-status" role="status">
        {(id.status === "available" || id.status === "unchanged") && <Icon name="check" size={15}/>}{id.message}
      </p>
      <p className="small muted editor-hint" id="profile-id-hint">IDを設定すると、友達が検索で見つけられます。未設定でもBirthyを使えます。</p>
    </>}
    <Button type="submit" disabled={!permitted || uploading}>{uploading ? "画像を読み込み中…" : "保存する"}</Button>
    {feedback && <p className={`social-feedback editor-feedback ${feedback.success ? "editor-feedback-success" : ""}`} role="status">
      {feedback.success && <Icon name="check" size={17}/>}<span>{feedback.message}</span>
    </p>}
    <p className="small muted editor-storage">変更は、このブラウザに保存されます。</p>
  </form>;
}
