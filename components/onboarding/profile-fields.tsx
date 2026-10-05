"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Avatar, Icon } from "@/components/birthy/ui";

export async function resizeProfileImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選んでください");
  if (file.size > 2 * 1024 * 1024) throw new Error("2 MB以下の画像を選んでください");
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 384 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を読み込めませんでした");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.85);
  } catch (error) {
    if (error instanceof Error && error.message === "画像を読み込めませんでした") throw error;
    throw new Error("画像を読み込めませんでした。別の画像をお試しください");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileFields({ nickname, avatar, onNicknameChange, onAvatarChange }: {
  nickname: string;
  avatar: string;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (value: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError("");
    setLoading(true);
    try { onAvatarChange(await resizeProfileImage(file)); }
    catch (error) { setImageError(error instanceof Error ? error.message : "画像を読み込めませんでした"); }
    finally { setLoading(false); }
  }
  return <div className="onboarding-profile-fields">
    <div className="onboarding-avatar-wrap">
      <button type="button" className="onboarding-avatar-button" onClick={() => fileInput.current?.click()} disabled={loading} aria-label="プロフィール画像を選ぶ">
        <Avatar src={avatar} name={nickname || "あなた"} size={128}/>
        <span className="onboarding-camera"><Icon name="camera" size={18}/></span>
      </button>
      <input ref={fileInput} type="file" accept="image/*" className="visually-hidden" aria-label="プロフィール画像" onChange={upload}/>
      <p className="onboarding-image-hint">{loading ? "画像を読み込んでいます…" : "写真を変える"}</p>
      {imageError && <p className="onboarding-field-error" role="alert">{imageError}</p>}
    </div>
    <label className="onboarding-field-label" htmlFor="onboarding-nickname">ニックネーム</label>
    <div className="onboarding-text-field">
      <input id="onboarding-nickname" name="nickname" autoComplete="nickname" placeholder="例：はるき" value={nickname} onChange={(event) => onNicknameChange(event.target.value)} maxLength={20} required/>
      <span aria-hidden="true">{nickname.length}/20</span>
    </div>
    <p className="onboarding-field-hint">本名でなくても大丈夫です</p>
  </div>;
}
