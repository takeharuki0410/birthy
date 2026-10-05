import type { IconName } from "@/types/birthy";

export const myPageSections = [
  { id: "profile", label: "プロフィール編集", icon: "user" },
  { id: "birthday", label: "誕生日", icon: "cake" },
  { id: "id", label: "Birthy ID", icon: "search" },
  { id: "privacy", label: "プライバシー", icon: "lock" },
  { id: "notifications", label: "通知", icon: "bell" },
  { id: "blocked", label: "ブロックしたユーザー", icon: "users" },
  { id: "account", label: "アカウント", icon: "shield" },
  { id: "terms", label: "利用規約", icon: "help" },
  { id: "policy", label: "プライバシーポリシー", icon: "lock" },
  { id: "contact", label: "お問い合わせ", icon: "mail" },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type MyPageSection = typeof myPageSections[number]["id"];

export function isMyPageSection(section: string | undefined): section is MyPageSection {
  return myPageSections.some((item) => item.id === section);
}
