import type { BirthyState, Person } from "@/types/birthy";

/**
 * Production-safe empty client state.
 * Authentication and the user's real profile are hydrated from /api/auth/me.
 * Social data is intentionally empty until each feature is connected to Supabase.
 */
export function createInitialState(_now: Date): BirthyState {
  void _now;

  return {
    registered: false,
    profile: {
      nickname: "",
      avatar: "/birthy/profile-sky.webp",
      birthday: "--",
      birthyId: "",
      showFullBirthday: true,
    },
    preferences: {
      idSearch: true,
      connectionRequests: true,
      notifyTomorrow: true,
      notifyToday: true,
      notifyBirthy: true,
      email: "",
    },
    people: [],
    requests: [],
    circles: [],
    messages: [],
    balloons: [],
    notifications: [],
    blocked: [],
    hiddenMessages: [],
    messageLikes: [],
  };
}

export const INITIAL_STATE = createInitialState(new Date());
export const PEOPLE: Person[] = [];
