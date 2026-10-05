"use client";
import { BalloonArt, Button, Icon } from "@/components/birthy/ui";
import { BalloonFlight } from "@/components/birthy/motion";
export function CelebrationSuccess({ onHome, pending = false, privateCard = false, balloonCount = 0 }: { onHome: () => void; pending?: boolean; privateCard?: boolean; balloonCount?: number }) {
  return <div className="celebration-success screen-enter"><BalloonFlight count={balloonCount}/><div className="success-balloon-scene"><BalloonArt happy/><i/><i/><i/><i/></div><span className="success-check"><Icon name="check" size={22}/></span><h1>{pending ? "お祝いを預かりました 🎈" : "お祝いを送りました！"}</h1><p>{pending ? privateCard ? "誕生日になったら、本人だけが開けます" : "誕生日になったら公開されます" : "あなたの気持ちが、届きますように。"}</p><Button onClick={onHome}>ホームに戻る</Button></div>;
}
