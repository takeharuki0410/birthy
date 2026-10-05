export type Tab = "home" | "connections" | "notifications" | "mypage";
export type Visibility = "public" | "private";
export type IconName = "home" | "users" | "bell" | "user" | "chevron" | "back" | "close" | "check" | "heart" | "balloon" | "cake" | "search" | "qr" | "link" | "settings" | "shield" | "lock" | "mail" | "help" | "more" | "camera" | "logout" | "calendar";
export interface Profile {
  nickname: string;
  avatar: string;
  birthday: string;
  birthyId: string;
  showFullBirthday: boolean;
}
export interface Person {
  id: string;
  nickname: string;
  avatar: string;
  birthday: string;
  birthyId: string;
  affiliation?: string;
  connected: boolean;
  showFullBirthday: boolean;
}
export interface WallMessage {
  id: string;
  recipientId: string;
  authorId: string;
  authorName: string;
  avatar: string;
  text: string;
  reaction: string;
  visibility: Visibility;
  createdAt: string;
  birthdayDate: string;
  revealAt: string;
}
export interface MessageLike {
  messageId: string;
  userId: string;
  createdAt: string;
}
export type BirthdayCardInput = Pick<WallMessage, "recipientId" | "text" | "reaction" | "visibility">;
export interface BalloonDelivery {
  recipientId: string;
  senderId: string;
  senderName: string;
  avatar: string;
  year: number;
  count: number;
  createdAt: string;
  revealAt?: string;
}
export interface Circle {
  id: string;
  name: string;
  description: string;
  members: number;
  joined: boolean;
}
export interface Notification {
  id: string;
  kind: "birthday" | "request" | "connection" | "message" | "balloon" | "info";
  text: string;
  date: string;
  read: boolean;
  personId?: string;
}
export interface Preferences {
  idSearch: boolean;
  connectionRequests: boolean;
  notifyTomorrow: boolean;
  notifyToday: boolean;
  notifyBirthy: boolean;
  email: string;
}
export interface BirthyState {
  registered: boolean;
  profile: Profile;
  preferences: Preferences;
  people: Person[];
  requests: string[];
  circles: Circle[];
  messages: WallMessage[];
  balloons: BalloonDelivery[];
  notifications: Notification[];
  blocked: string[];
  hiddenMessages: string[];
  messageLikes: MessageLike[];
}
