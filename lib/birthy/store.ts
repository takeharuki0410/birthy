"use client";

import { createContext, createElement, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { BirthdayCardInput, BirthyState, Profile, Preferences, WallMessage, MessageLike } from "@/types/birthy";
import { createInitialState, INITIAL_STATE } from "./mock-data";
import { birthdayYear } from "./date";
import { getBirthdayWindow, isCardRevealed, tokyoDateKey } from "./birthday-cards";

const STORAGE_KEY = "birthy-ui-v2";
let snapshot: BirthyState = INITIAL_STATE;
let loaded = false;
const listeners = new Set<() => void>();
const InitialStateContext = createContext(INITIAL_STATE);

export function BirthyStoreProvider({ initialNow, children }: { initialNow: string; children: ReactNode }) {
  const initialState = useMemo(() => createInitialState(new Date(initialNow)), [initialNow]);
  return createElement(InitialStateContext.Provider, { value: initialState }, children);
}

function subscribe(listener: () => void, initialState: BirthyState) {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    snapshot = initialState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const value = JSON.parse(raw) as BirthyState;
        if (typeof value.registered === "boolean" && typeof value.profile?.nickname === "string" && Array.isArray(value.messages) && Array.isArray(value.balloons)) {
          snapshot = {
            ...initialState, ...value,
            preferences: { ...initialState.preferences, ...value.preferences },
            messages: value.messages.map((message) => ({ ...message, birthdayDate: message.birthdayDate || tokyoDateKey(new Date(message.createdAt)), revealAt: message.revealAt || message.createdAt })),
            messageLikes: Array.isArray(value.messageLikes) ? value.messageLikes.filter((like: MessageLike) => typeof like.messageId === "string" && typeof like.userId === "string") : initialState.messageLikes,
          };
        }
      }
    } catch { /* A restricted or unavailable store keeps the UI usable in memory. */ }
  }
  return () => { listeners.delete(listener); };
}
function update(transform: (previous: BirthyState) => BirthyState) {
  snapshot = transform(snapshot);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* Private browsing / quota: in-memory state remains available. */ }
  listeners.forEach((listener) => listener());
}
export function useBirthyStore() {
  const initialState = useContext(InitialStateContext);
  const subscribeToStore = useCallback((listener: () => void) => subscribe(listener, initialState), [initialState]);
  const state = useSyncExternalStore(subscribeToStore, () => loaded ? snapshot : initialState, () => initialState);
  return { state, actions };
}
export const actions = {
  register(profile: Profile) { update((s) => ({ ...s, profile, registered: true })); },
  clearAuthentication() { update(() => createInitialState(new Date())); },
  updateProfile(profile: Partial<Profile>) { update((s) => ({ ...s, profile: { ...s.profile, ...profile } })); },
  updatePreferences(preferences: Partial<Preferences>) { update((s) => ({ ...s, preferences: { ...s.preferences, ...preferences } })); },
  sendMessage(input: BirthdayCardInput, balloonCount = 0): WallMessage | null {
    const recipient = input.recipientId === "self" ? snapshot.profile : snapshot.people.find((person) => person.id === input.recipientId);
    const now = new Date();
    if (!recipient || snapshot.blocked.includes(input.recipientId)) return null;
    const window = getBirthdayWindow(recipient.birthday,now);
    if (!window.canSend || input.text.length > 200 || !["public","private"].includes(input.visibility)) return null;
    const used = snapshot.balloons.filter((b) => b.recipientId === input.recipientId && b.senderId === "self" && b.year === window.year).reduce((sum,b) => sum+b.count,0);
    if (!Number.isInteger(balloonCount) || balloonCount < 0 || balloonCount > 100 - used) return null;
    const message: WallMessage = { ...input, id: crypto.randomUUID(), authorId: "self", authorName: snapshot.profile.nickname, avatar: snapshot.profile.avatar, createdAt: now.toISOString(), birthdayDate: window.birthdayDate, revealAt: window.revealAt };
    update((s) => ({ ...s, messages: [...s.messages,message], balloons: balloonCount ? [...s.balloons,{recipientId:input.recipientId,senderId:"self",senderName:s.profile.nickname,avatar:s.profile.avatar,year:window.year,count:balloonCount,createdAt:now.toISOString(),revealAt:window.revealAt}] : s.balloons }));
    return message;
  },
  /** Adapter boundary for future message_id, user_id, created_at database rows. */
  toggleMessageLike(messageId: string, userId: string): boolean {
    const message = snapshot.messages.find((m) => m.id === messageId);
    if (!message || message.visibility !== "public" || !isCardRevealed(message) || snapshot.hiddenMessages.includes(messageId) || snapshot.blocked.includes(message.authorId) || !userId) return false;
    update((s) => {
      const exists = s.messageLikes.some((like) => like.messageId === messageId && like.userId === userId);
      return { ...s, messageLikes: exists ? s.messageLikes.filter((like) => like.messageId !== messageId || like.userId !== userId) : [...s.messageLikes,{messageId,userId,createdAt:new Date().toISOString()}] };
    });
    return true;
  },
  sendBalloons(recipientId: string, count: number): boolean {
    const year = birthdayYear();
    const used = snapshot.balloons.filter((b) => b.recipientId === recipientId && b.senderId === "self" && b.year === year).reduce((total, b) => total + b.count, 0);
    if (!Number.isInteger(count) || count < 1 || count > 100 - used) return false;
    update((s) => ({ ...s, balloons: [...s.balloons, { recipientId, senderId: "self", senderName: s.profile.nickname, avatar: s.profile.avatar, year, count, createdAt: new Date().toISOString() }] }));
    return true;
  },
  acceptRequest(id: string) { update((s) => ({ ...s, requests: s.requests.filter((r) => r !== id), people: s.people.map((p) => p.id === id ? { ...p, connected: true } : p) })); },
  declineRequest(id: string) { update((s) => ({ ...s, requests: s.requests.filter((r) => r !== id) })); },
  requestConnection(id: string) { update((s) => ({ ...s, notifications: [...s.notifications, { id: crypto.randomUUID(), kind: "info", text: `${s.people.find((p) => p.id === id)?.nickname ?? "相手"}さんに申請を送りました`, date: new Date().toISOString(), read: true, personId: id }] })); },
  joinCircle(id: string) { update((s) => ({ ...s, circles: s.circles.map((c) => c.id === id ? { ...c, joined: true } : c) })); },
  leaveCircle(id: string) { update((s) => ({ ...s, circles: s.circles.map((c) => c.id === id ? { ...c, joined: false } : c) })); },
  markRead(id?: string) { update((s) => ({ ...s, notifications: s.notifications.map((n) => !id || n.id === id ? { ...n, read: true } : n) })); },
  hideMessage(id: string) { update((s) => ({ ...s, hiddenMessages: [...new Set([...s.hiddenMessages, id])] })); },
  blockUser(id: string) { if (id !== "self") update((s) => ({ ...s, blocked: [...new Set([...s.blocked, id])] })); },
  unblockUser(id: string) { update((s) => ({ ...s, blocked: s.blocked.filter((b) => b !== id) })); },
  deleteAccount() { update(() => createInitialState(new Date())); },
};
