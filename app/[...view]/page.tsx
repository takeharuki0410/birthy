import { BirthyApp } from "@/components/birthy/birthy-app";
import { redirect } from "next/navigation";
import { isMyPageSection } from "@/components/settings/settings-sections";

export default async function Page({ params }: { params: Promise<{ view: string[] }> }) {
  const { view } = await params;
  if (view[0] === "settings") {
    const section = view[1] === "legal" ? "terms" : view[1];
    redirect(isMyPageSection(section) ? `/mypage/${section}` : "/mypage");
  }
  return <BirthyApp initialNow={new Date().toISOString()} />;
}
