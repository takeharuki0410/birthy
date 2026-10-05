"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Onboarding } from "@/components/onboarding/onboarding";
import { Connections } from "@/components/connections/connections";
import { Notifications } from "@/components/notifications/notifications";
import { MyPage } from "@/components/settings/my-page";
import { Settings } from "@/components/settings/settings";
import { isMyPageSection } from "@/components/settings/settings-sections";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { BirthdayPage } from "@/components/birthday/birthday-page";
import { MessageComposer } from "@/components/birthday/message-composer";
import { SendBalloons } from "@/components/birthday/send-balloons";
import { CelebrationSuccess } from "@/components/birthday/celebration-success";
import { ReceivedGifts } from "@/components/birthday/received-gifts";
import { Home } from "./home";
import { Button } from "./ui";
import { BirthyStoreProvider, useBirthyStore } from "@/lib/birthy/store";
import { BirthdayClockProvider } from "@/lib/birthy/use-birthday-clock";
import type { Person, Tab } from "@/types/birthy";

let lastVisitedPath: string | undefined;
export function BirthyApp({ initialNow }: { initialNow: string }) {
  return <BirthyStoreProvider initialNow={initialNow}><BirthdayClockProvider initialNow={initialNow}><BirthyScreens/></BirthdayClockProvider></BirthyStoreProvider>;
}
function BirthyScreens() {
  const pathname = usePathname(); const router = useRouter(); const { state } = useBirthyStore();
  const [,view,id,subview] = pathname.split("/");
  const onboard = !view || view === "onboarding";
  const active: Tab = view === "connections" ? "connections" : view === "notifications" ? "notifications" : ["mypage","settings","received"].includes(view) ? "mypage" : "home";
  const noNav = onboard || ["success"].includes(view) || (view === "birthday" && Boolean(subview));
  const openBirthday = (personId: string) => router.push(`/birthday/${personId}`);
  useEffect(() => {
    if (lastVisitedPath === "/mypage" && pathname.startsWith("/mypage/")) {
      window.history.replaceState({ ...window.history.state, birthyParentPath: "/mypage" }, "", window.location.href);
    }
    lastVisitedPath = pathname;
    window.scrollTo(0,0);
  }, [pathname]);
  useEffect(() => { if (!view && state.registered) router.replace("/home"); }, [view,state.registered,router]);
  let screen;
  const backToMyPage = () => {
    if (window.history.state?.birthyParentPath === "/mypage" && window.history.length > 1) router.back();
    else router.replace("/mypage");
  };
  if (onboard) screen = <Onboarding onComplete={() => router.replace("/home")}/>;
  else if (view === "home") screen = <Home onOpenBirthday={openBirthday}/>;
  else if (view === "connections") screen = <Connections onOpenBirthday={openBirthday}/>;
  else if (view === "notifications") screen = <Notifications onOpenBirthday={openBirthday} onOpenConnections={() => router.push("/connections?tab=requests")} onOpenReceived={() => router.push("/received")}/>;
  else if (view === "mypage") screen = isMyPageSection(id) ? <Settings key={pathname} section={id} onBack={backToMyPage} onDelete={() => router.replace("/")}/> : <MyPage onOpenReceived={() => router.push("/received")}/>;
  else if (view === "received") screen = <ReceivedGifts onBack={() => router.push("/mypage")}/>;
  else if (view === "success") screen = <CelebrationSuccess pending={id === "queued" || id === "queued-private"} privateCard={id === "queued-private"} balloonCount={Math.min(100,Math.max(0,Number(subview) || 0))} onHome={() => router.replace("/home")}/>;
  else if (view === "birthday") {
    const person: Person | undefined = id === "self" ? { id:"self",...state.profile,connected:true,affiliation:undefined } : state.people.find((p) => p.id === id && !state.blocked.includes(p.id));
    if (!person) screen = <div className="content empty-state"><p>このプロフィールは表示できません。</p><Button onClick={() => router.replace("/home")}>ホームへ</Button></div>;
    else if (subview === "message") screen = <MessageComposer person={person} onBack={() => openBirthday(id)} onSent={({scheduled,balloons,visibility}) => router.replace(`/success/${scheduled ? visibility === "private" ? "queued-private" : "queued" : "sent"}/${balloons}`)}/>;
    else if (subview === "balloons") screen = <SendBalloons person={person} onBack={() => openBirthday(id)} onSent={(count) => router.replace(`/success/sent/${count}`)}/>;
    else screen = <BirthdayPage person={person} onBack={() => router.push("/home")} onMessage={() => router.push(`/birthday/${id}/message`)} onBalloons={() => router.push(`/birthday/${id}/balloons`)} onReceived={() => router.push("/received")}/>;
  } else screen = <div className="content empty-state"><p>ページが見つかりません。</p><Button onClick={() => router.replace("/home")}>ホームへ</Button></div>;
  return <div className="app-shell"><main className={`app-main ${noNav ? "no-nav" : ""}`} key={pathname}>{screen}</main>{!noNav && <BottomNav active={active} unread={state.notifications.some((n) => !n.read)}/>}</div>;
}
