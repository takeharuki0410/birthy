import type { BirthyState, Person } from "@/types/birthy";
import { isoDate, todayInTokyo } from "./date";

const birthDate = (date: Date, year: number) => `${year}-${isoDate(date).slice(5)}`;
/** The UI's server and hydration snapshots must use the same serialized clock. */
export function createInitialState(now: Date): BirthyState {
  const today = todayInTokyo(now);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const next = new Date(today); next.setDate(today.getDate() + 4);
  const people: Person[] = [
  { id: "misaki", nickname: "みさき", avatar: "/birthy/avatar-misaki.webp", birthday: birthDate(today, 2004), birthyId: "misaki__", affiliation: "写真サークル", connected: true, showFullBirthday: true },
  { id: "takumi", nickname: "たくみ", avatar: "/birthy/avatar-takumi.webp", birthday: birthDate(tomorrow, 2003), birthyId: "takumi21", affiliation: "大学のつながり", connected: true, showFullBirthday: true },
  { id: "yu", nickname: "ゆう", avatar: "/birthy/avatar-yu.webp", birthday: birthDate(tomorrow, 2004), birthyId: "yu__24", affiliation: "写真サークル", connected: true, showFullBirthday: false },
  { id: "hina", nickname: "ひな", avatar: "/birthy/avatar-rin.webp", birthday: birthDate(next, 2004), birthyId: "hina_25", affiliation: "カフェめぐり", connected: false, showFullBirthday: false },
];
  return {
  registered: false,
  profile: { nickname: "はるき", avatar: "/birthy/profile-sky.webp", birthday: "2004-04-10", birthyId: "", showFullBirthday: true },
  preferences: { idSearch: true, connectionRequests: true, notifyTomorrow: true, notifyToday: true, notifyBirthy: true, email: "" },
  people,
  requests: ["hina"],
  circles: [
    { id: "photo", name: "写真サークル", description: "日常のちょっといい景色を、一緒に。", members: 12, joined: false },
    { id: "cafe", name: "カフェめぐり", description: "いつものメンバーと、のんびり。", members: 8, joined: false },
  ],
  messages: [
    { id: "wall-1", recipientId: "misaki", authorId: "takumi", authorName: "たくみ", avatar: "/birthy/avatar-takumi.webp", text: "お誕生日おめでとう！\n素敵な一年になりますように 🎂", reaction: "🎉", visibility: "public", createdAt: `${isoDate(today)}T09:12:00+09:00`, birthdayDate: isoDate(today), revealAt: `${isoDate(today)}T00:00:00+09:00` },
    { id: "wall-2", recipientId: "misaki", authorId: "yu", authorName: "ゆう", avatar: "/birthy/avatar-yu.webp", text: "おめでとう！\nまた一緒に写真撮りに行こうね ☺️", reaction: "💛", visibility: "public", createdAt: `${isoDate(today)}T09:05:00+09:00`, birthdayDate: isoDate(today), revealAt: `${isoDate(today)}T00:00:00+09:00` },
    { id: "own-1", recipientId: "self", authorId: "misaki", authorName: "みさき", avatar: "/birthy/avatar-misaki.webp", text: "はるき、おめでとう！いつもありがとう。", reaction: "🎂", visibility: "private", createdAt: `${today.getFullYear()}-04-10T09:00:00+09:00`, birthdayDate: `${today.getFullYear()}-04-10`, revealAt: `${today.getFullYear()}-04-10T00:00:00+09:00` },
    { id: "own-public", recipientId: "self", authorId: "yu", authorName: "ゆう", avatar: "/birthy/avatar-yu.webp", text: "おめでとう！いつもの何気ない時間も、いい思い出にしていこうね。", reaction: "💛", visibility: "public", createdAt: `${today.getFullYear()}-04-10T09:10:00+09:00`, birthdayDate: `${today.getFullYear()}-04-10`, revealAt: `${today.getFullYear()}-04-10T00:00:00+09:00` },
  ],
  balloons: [
    { recipientId: "self", senderId: "yu", senderName: "ゆう", avatar: "/birthy/avatar-yu.webp", count: 1, year: today.getFullYear(), createdAt: `${isoDate(today)}T09:05:00+09:00` },
    { recipientId: "self", senderId: "misaki", senderName: "みさき", avatar: "/birthy/avatar-misaki.webp", count: 30, year: today.getFullYear(), createdAt: `${isoDate(today)}T09:10:00+09:00` },
    { recipientId: "self", senderId: "takumi", senderName: "たくみ", avatar: "/birthy/avatar-takumi.webp", count: 10, year: today.getFullYear(), createdAt: `${isoDate(today)}T09:15:00+09:00` },
  ],
  notifications: [
    { id: "n1", kind: "birthday", text: "今日はみさきさんの誕生日です", date: `${isoDate(today)}T09:00:00+09:00`, read: false, personId: "misaki" },
    { id: "n2", kind: "request", text: "ひなさんからつながり申請", date: `${isoDate(today)}T08:30:00+09:00`, read: false, personId: "hina" },
    { id: "n3", kind: "message", text: "みさきさんから誕生日メッセージが届きました", date: `${isoDate(today)}T09:00:00+09:00`, read: false, personId: "self" },
    { id: "n4", kind: "balloon", text: "風船が届きました", date: `${isoDate(today)}T09:15:00+09:00`, read: true },
    { id: "n5", kind: "info", text: "Birthyへようこそ。あなたのペースで、お祝いを。", date: `${isoDate(today)}T08:00:00+09:00`, read: true },
  ],
  blocked: [], hiddenMessages: [],
  messageLikes: [
    { messageId: "wall-1", userId: "misaki", createdAt: `${isoDate(today)}T09:20:00+09:00` },
    { messageId: "wall-1", userId: "yu", createdAt: `${isoDate(today)}T09:25:00+09:00` },
    { messageId: "wall-1", userId: "hina", createdAt: `${isoDate(today)}T09:26:00+09:00` },
    { messageId: "wall-1", userId: "self", createdAt: `${isoDate(today)}T09:27:00+09:00` },
    { messageId: "own-public", userId: "misaki", createdAt: `${today.getFullYear()}-04-10T09:20:00+09:00` },
    { messageId: "own-public", userId: "takumi", createdAt: `${today.getFullYear()}-04-10T09:25:00+09:00` },
  ],
  };
}

// Compatibility exports for fixtures and isolated consumers. App rendering is
// seeded by BirthyStoreProvider instead of reading these module-time values.
export const INITIAL_STATE = createInitialState(new Date());
export const PEOPLE: Person[] = INITIAL_STATE.people;
