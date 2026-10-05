"use client";

import Image from "next/image";
import { useEffect, useRef, useId } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IconName } from "@/types/birthy";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  users: <><circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v1"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>, back: <path d="m15 5-7 7 7 7"/>, close: <path d="m6 6 12 12M6 18 18 6"/>, check: <path d="m5 12 4 4L19 6"/>,
  heart: <path d="M20 5c-4-3-8 2-8 2S8 2 4 5c-4 3-1 7 8 15 9-8 12-12 8-15Z"/>,
  balloon: <><ellipse cx="12" cy="9" rx="7" ry="8"/><path d="m12 17-2 3h4l-2-3m0 3c4 3-3 3 0 5M8 5l1-1"/></>,
  cake: <><path d="M3 12h18v9H3ZM3 15c3 4 3-4 6 0s3-4 6 0 3-4 6 0M7 12V8m5 4V7m5 5V8M7 5V3m5 1V2m5 3V3"/></>,
  search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
  qr: <><path d="M3 3h6v6H3Zm12 0h6v6h-6ZM3 15h6v6H3Zm12 0h2v2h-2Zm4 0h2v6h-6v-2"/><path d="M6 6h0m12 0h0M6 18h0"/></>,
  link: <><path d="m10 14 4-4m-6 6-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1"/></>,
  settings: <><path d="m9 2-1 3-3 1-2 4 2 2v3l2 3 3-1 3 2 3-1 1-3 3-2v-4l-3-1-1-3-4-1Z"/><circle cx="12" cy="11" r="3"/></>,
  shield: <><path d="M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6Z"/><path d="m8 12 3 3 5-6"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 6 9 7 9-7"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/></>,
  more: <><circle cx="5" cy="12" r=".7"/><circle cx="12" cy="12" r=".7"/><circle cx="19" cy="12" r=".7"/></>,
  camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="14" r="4"/></>,
  logout: <><path d="M9 3H3v18h6m4-5 5-4-5-4m-6 4h14"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h2m4 0h2"/></>,
};
export function Icon({ name, size = 22, className = "" }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}
export function Avatar({ src, name, size = 48 }: { src: string; name: string; size?: number }) {
  return <Image className="avatar" src={src} alt={`${name}のプロフィール画像`} width={size} height={size} unoptimized style={{ width: size, height: size }} />;
}
export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "pink" | "outline" | "green" | "subtle"; children: ReactNode }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}
export function PageHeader({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  return <header className="page-header"><div>{onBack && <button className="icon-button" aria-label="戻る" onClick={onBack}><Icon name="back"/></button>}</div><h1>{title}</h1><div>{action}</div></header>;
}
export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return <div className="toggle-row"><div><label id={id}>{label}</label>{description && <p className="small muted">{description}</p>}</div><button type="button" className={`toggle ${checked ? "is-on" : ""}`} role="switch" aria-labelledby={id} aria-checked={checked} onClick={() => onChange(!checked)}><span/></button></div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={id} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-content"><div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="閉じる" onClick={onClose}><Icon name="close"/></button></div>{children}</div></dialog>;
}
export function Brand({ large = false }: { large?: boolean }) { return <span className={`brand ${large ? "brand-large" : ""}`}>Birthy</span>; }
export function BalloonArt({ happy = false }: { happy?: boolean }) { return <div className={`balloon-art ${happy ? "balloon-happy" : ""}`} aria-hidden="true"><div className="balloon-orb"><span className="balloon-shine"/>{happy && <span className="balloon-face">◡</span>}</div><div className="balloon-knot"/><svg viewBox="0 0 20 80" className="balloon-string"><path d="M10 0C30 20-10 35 10 55S15 70 10 80"/></svg></div>; }
