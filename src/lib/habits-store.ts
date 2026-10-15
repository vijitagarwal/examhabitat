import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

export type HabitCategory =
  "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle" | "Exam Prep";

export const CATEGORIES: HabitCategory[] = [
  "Health",
  "Mind",
  "Productivity",
  "Learning",
  "Lifestyle",
  "Exam Prep",
];
export const ICON_CHOICES = [
  "Sparkles",
  "Dumbbell",
  "BookOpen",
  "NotebookPen",
  "Code2",
  "Droplets",
  "Ban",
  "Moon",
  "GraduationCap",
  "Footprints",
  "Heart",
  "Apple",
  "Bike",
  "Music",
  "Palette",
  "Sun",
  "Coffee",
  "Leaf",
  "Brain",
  "Star",
  "Target",
  "CheckCircle2",
  "Calculator",
  "PenTool",
  "Timer",
  "Trophy",
  "Flame",
];
export const COLOR_CHOICES = ["brand", "brand-2", "success", "warning", "danger", "info"];

export type HabitDirection = "build" | "break";
export type ScheduleType = "daily" | "weekdays" | "weekly" | "monthly" | "oneoff";

export interface Schedule {
  type: ScheduleType;
  /** For "weekdays": array of 0=Sun..6=Sat. For "weekly": use first entry. */
  weekdays?: number[];
  /** For "monthly": 1..28, or "last". */
  monthDay?: number | "last";
  /** For "oneoff": ISO date. */
  date?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  color: string;
  createdAt: string;
  /** "build" = accumulate toward top benchmark (e.g. water). "break" = stay under (e.g. sugar). */
  direction?: HabitDirection;
  /** e.g. "L", "g", "hrs", "pages". */
  unit?: string;
  /** Sorted ascending. Empty/undefined = simple boolean habit. */
  benchmarks?: number[];
  schedule?: Schedule;
  /** True for duration/stopwatch habits (e.g. study hours, coding time). */
  isTimer?: boolean;
  /** Optional monthly target amount (e.g. 30 sessions, 60 hours). */
  monthlyTarget?: number;
}

export interface ActiveTimer {
  habitId: string;
  dateISO: string;
  startTime: number;
  accumulatedSec: number;
  isRunning: boolean;
}

export interface DailyMetrics {
  mood?: number;
  sleep?: number;
  water?: number;
  weight?: number;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM" (24-hour)
  notificationPermission: NotificationPermission;
}

export interface HabitState {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  /** Numeric values for benchmarked habits. */
  values: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  metrics: Record<string, DailyMetrics>;
  monthlyGoal: number;
  level: number;
  xp: number;
  freezeTokens: number;
  freezes: Record<string, Record<string, boolean>>;
  reminderSettings: ReminderSettings;
}

const BASE_KEY = "habit-tracker-v2";
let userKey: string | null = null;
function KEY() {
  return userKey ? `${BASE_KEY}::${userKey}` : BASE_KEY;
}

const todayISO = () => new Date().toLocaleDateString('en-CA');
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const dailySchedule: Schedule = { type: "daily" };

const seedHabits: Habit[] = [
  {
    id: "meditation",
    name: "Morning Meditation",
    icon: "Sparkles",
    category: "Mind",
    color: "brand",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "exercise",
    name: "Exercise",
    icon: "Dumbbell",
    category: "Health",
    color: "success",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "read",
    name: "Read 20 Pages",
    icon: "BookOpen",
    category: "Learning",
    color: "info",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "journal",
    name: "Daily Journal",
    icon: "NotebookPen",
    category: "Mind",
    color: "brand-2",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "code",
    name: "Code for 1 Hour",
    icon: "Code2",
    category: "Productivity",
    color: "warning",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "water",
    name: "Drink Water",
    icon: "Droplets",
    category: "Health",
    color: "info",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
    direction: "build",
    unit: "L",
    benchmarks: [1, 2, 3],
  },
  {
    id: "nosugar",
    name: "Limit Sugar",
    icon: "Ban",
    category: "Health",
    color: "danger",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
    direction: "break",
    unit: "g",
    benchmarks: [5, 10, 20],
  },
  {
    id: "sleep",
    name: "Sleep by 11 PM",
    icon: "Moon",
    category: "Lifestyle",
    color: "brand",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "learn",
    name: "Learn Something New",
    icon: "GraduationCap",
    category: "Learning",
    color: "warning",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
  {
    id: "walk",
    name: "Walk 10K Steps",
    icon: "Footprints",
    category: "Health",
    color: "success",
    createdAt: daysAgoISO(60),
    schedule: dailySchedule,
  },
];

function seedCompletions(habits: Habit[]): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {};
  const rates: Record<string, number> = {
    meditation: 0.9,
    exercise: 0.95,
    read: 0.9,
    journal: 0.88,
    code: 0.85,
    water: 0.6,
    nosugar: 0.55,
    sleep: 0.8,
    learn: 0.75,
    walk: 0.55,
  };
  for (let i = 60; i >= 0; i--) {
    const day = daysAgoISO(i);
    out[day] = {};
    for (const h of habits) {
      if (h.benchmarks && h.benchmarks.length) continue; // values-tracked
      const rate = rates[h.id] ?? 0.7;
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 9301 + hcode * 49297) * 233280) % 1;
      out[day][h.id] = mix < rate;
    }
  }
  const today = todayISO();
  out[today] = out[today] ?? {};
  const doneToday = ["meditation", "exercise", "read", "journal", "code", "sleep", "learn"];
  for (const h of habits) {
    if (h.benchmarks && h.benchmarks.length) continue;
    out[today][h.id] = doneToday.includes(h.id);
  }
  return out;
}

function seedValues(habits: Habit[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (let i = 60; i >= 0; i--) {
    const day = daysAgoISO(i);
    for (const h of habits) {
      if (!h.benchmarks || !h.benchmarks.length) continue;
      const target = Math.max(...h.benchmarks);
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 7919 + hcode * 31337) * 100000) % 1;
      const v =
        h.direction === "break"
          ? Math.round(mix * target * 0.6 * 10) / 10
          : Math.round(mix * target * 10) / 10;
      out[day] = out[day] ?? {};
      out[day][h.id] = v;
    }
  }
  return out;
}

function defaultState(): HabitState {
  const habits = seedHabits;
  return {
    habits,
    completions: seedCompletions(habits),
    values: seedValues(habits),
    notes: {},
    metrics: {},
    monthlyGoal: 90,
    level: 18,
    xp: 2450,
    freezeTokens: 0,
    freezes: {},
    reminderSettings: {
      enabled: false,
      time: "20:00", // Default: 8 PM
      notificationPermission: "default",
    },
  };
}

function emptyState(): HabitState {
  return {
    habits: [],
    completions: {},
    values: {},
    notes: {},
    metrics: {},
    monthlyGoal: 80,
    level: 1,
    xp: 0,
    freezeTokens: 0,
    freezes: {},
    reminderSettings: {
      enabled: false,
      time: "20:00", // Default: 8 PM
      notificationPermission: "default",
    },
  };
}

function load(): HabitState {
  if (typeof window === "undefined") return defaultState();
  try {
    // 1. Try user-specific local key
    let raw = userKey ? localStorage.getItem(`habit-tracker-v2::${userKey}`) : null;

    // 2. Fallback to unauthenticated key if user-specific key is empty
    if (!raw) {
      raw = localStorage.getItem("habit-tracker-v2");
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.habits) && parsed.habits.length > 0) {
        return {
          ...defaultState(),
          ...parsed,
          values: parsed.values ?? {},
          notes: parsed.notes ?? {},
          metrics: parsed.metrics ?? {},
          monthlyGoal: parsed.monthlyGoal ?? 90,
        };
      }
    }
  } catch {}

  // 3. Default fallback (seed habits)
  const loadedState = defaultState();
    // Ensure new fields exist in loaded state
    if (state.freezeTokens === undefined) {
      state.freezeTokens = 0;
    }
    if (!state.freezes) {
      state.freezes = {};
    }
    if (!state.reminderSettings) {
      state.reminderSettings = loadedState.reminderSettings;
    }
  return state;
}

let state: HabitState = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

export type SyncStatus = "idle" | "syncing" | "synced" | "error";
let currentSyncStatus: SyncStatus = "idle";
const syncListeners = new Set<() => void>();

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      syncListeners.add(l);
      return () => syncListeners.delete(l);
    },
    () => currentSyncStatus
  );
}

function setSyncStatus(s: SyncStatus) {
  currentSyncStatus = s;
  syncListeners.forEach((l) => l());
}

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function syncToSupabase(uid: string, currentState: HabitState) {
  setSyncStatus("syncing");
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { error } = await db
        .from("kv_store")
        .upsert(
          {
            user_id: uid,
            key: "habit_state_v2",
            value: currentState,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" },
        );
      
      if (error) throw error;
      setSyncStatus("synced");
    } catch (err) {
      console.warn("[habits-store] Supabase cloud sync failed:", err);
      setSyncStatus("error");
    }
  }, 300);
}

/** Force immediate manual sync with Supabase cloud */
export async function syncNow(): Promise<void> {
  if (!userKey) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    // Push current local state to cloud first
    await db
      .from("kv_store")
      .upsert(
        {
          user_id: userKey,
          key: "habit_state_v2",
          value: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,key" },
      );
    // Fetch remote to verify & update
    const { data } = await db
      .from("kv_store")
      .select("value")
      .eq("user_id", userKey)
      .eq("key", "habit_state_v2")
      .maybeSingle();

    if (data?.value && Array.isArray(data.value.habits) && data.value.habits.length > 0) {
      const remoteState = data.value as HabitState;
      state = {
        ...defaultState(),
        ...remoteState,
        values: remoteState.values ?? {},
        notes: remoteState.notes ?? {},
        metrics: remoteState.metrics ?? {},
        monthlyGoal: remoteState.monthlyGoal ?? 90,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(KEY(), JSON.stringify(state));
      }
      listeners.forEach((l) => l());
    }
  } catch (err) {
    console.warn("[habits-store] Manual sync error:", err);
  }
}

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY(), JSON.stringify(state));
  listeners.forEach((l) => l());
  if (userKey) {
    syncToSupabase(userKey, state);
  }
  // Re-schedule reminder when state changes
  scheduleReminder();
}

function setState(update: (prev: HabitState) => HabitState) {
  state = update(state);
  persist();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const serverState: HabitState = emptyState();
function getSnapshot() {
  return state;
}
function getServerSnapshot(): HabitState {
  return serverState;
}

let activeRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

/** Bind the store to a specific user; reloads from localStorage and syncs with Supabase. */
export function setStoreUser(uid: string | null) {
  const nextKey = uid ?? null;
  if (nextKey === userKey && hydrated) return;
  userKey = nextKey;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());

  if (activeRealtimeChannel) {
    supabase.removeChannel(activeRealtimeChannel);
    activeRealtimeChannel = null;
  }

  if (userKey) {
    const currentUid = userKey;
    // Fetch remote state from Supabase kv_store
    const fetchRemoteState = async () => {
      setSyncStatus("syncing");
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        const { data } = await db
          .from("kv_store")
          .select("value")
          .eq("user_id", currentUid)
          .eq("key", "habit_state_v2")
          .maybeSingle();

        if (data?.value && Array.isArray(data.value.habits) && data.value.habits.length > 0) {
          const remoteState = data.value as HabitState;
          state = {
            ...defaultState(),
            ...remoteState,
            values: remoteState.values ?? {},
            notes: remoteState.notes ?? {},
            metrics: remoteState.metrics ?? {},
            monthlyGoal: remoteState.monthlyGoal ?? 90,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(KEY(), JSON.stringify(state));
          }
          listeners.forEach((l) => l());
          setSyncStatus("synced");
        } else {
          // If remote is empty, push our local state (containing user's desktop habits) to Supabase cloud!
          if (state.habits && state.habits.length > 0) {
            syncToSupabase(currentUid, state);
          } else {
            setSyncStatus("synced");
          }
        }
      } catch (err) {
        console.error("Failed to fetch remote state", err);
        setSyncStatus("error");
      }
    };

    fetchRemoteState();

    // Subscribe to realtime changes so checking off habits on mobile updates desktop in real-time
    activeRealtimeChannel = supabase
      .channel(`habit_sync_${userKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kv_store",
          filter: `user_id=eq.${userKey}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.new && payload.new.key === "habit_state_v2") {
            const remoteState = payload.new.value as HabitState;
            if (remoteState && Array.isArray(remoteState.habits) && remoteState.habits.length > 0) {
              state = {
                ...defaultState(),
                ...remoteState,
                values: remoteState.values ?? {},
                notes: remoteState.notes ?? {},
                metrics: remoteState.metrics ?? {},
                monthlyGoal: remoteState.monthlyGoal ?? 90,
              };
              if (typeof window !== "undefined") {
                localStorage.setItem(KEY(), JSON.stringify(state));
              }
              listeners.forEach((l) => l());
            }
          }
        },
      )
      .subscribe();
  }
}

export function useHabits() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      state = load();
      listeners.forEach((l) => l());
    }
  }, []);
  return s;
}

// ---------- Scheduling ----------

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isScheduledOn(h: Habit, iso: string): boolean {
  // Never show a habit on dates before it was created
  if (h.createdAt && iso < h.createdAt) return false;

  const sch = h.schedule ?? { type: "daily" };
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  switch (sch.type) {
    case "daily":
      return true;
    case "weekdays":
      return (sch.weekdays ?? []).includes(dow);
    case "weekly":
      return (sch.weekdays?.[0] ?? 0) === dow;
    case "monthly": {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (sch.monthDay === "last") return d.getDate() === last;
      return d.getDate() === (typeof sch.monthDay === "number" ? sch.monthDay : 1);
    }
    case "oneoff":
      return sch.date === iso;
    default:
      return true;
  }
}

export function scheduleLabel(h: Habit): string {
  const sch = h.schedule ?? { type: "daily" };
  switch (sch.type) {
    case "daily":
      return "Daily";
    case "weekdays":
      return (sch.weekdays ?? []).map((d) => WEEKDAY_LABELS[d]).join(", ") || "Weekdays";
    case "weekly":
      return `Every ${WEEKDAY_LABELS[sch.weekdays?.[0] ?? 0]}`;
    case "monthly":
      return sch.monthDay === "last" ? "Last of month" : `Day ${sch.monthDay ?? 1}`;
    case "oneoff":
      return sch.date ? `On ${sch.date}` : "One-off";
  }
}

export function habitsFor(s: HabitState, iso: string): Habit[] {
  return s.habits.filter((h) => isScheduledOn(h, iso));
}

// ---------- Values & completion ----------

export type HabitStatus = "completed" | "in_progress" | "not_started" | "failed";

export function habitStatus(s: HabitState, h: Habit, iso: string): HabitStatus {
  const today = todayISO();
  const hasBenchmarks = !!(h.benchmarks && h.benchmarks.length);
  const isBreak = h.direction === "break";
  const isTimer = !!h.isTimer;
  const t = habitTarget(h);
  const v = s.values?.[iso]?.[h.id] ?? 0;

  // Check if the day is frozen for this habit
  if (s.freezes[iso]?.[h.id]) {
    return "completed"; // Frozen days count as completed
  }

  // Check if an active timer is running for this habit today
  if (activeTimer && activeTimer.habitId === h.id && activeTimer.dateISO === iso) {
    return "in_progress";
  }

  // Timer habits: any logged time = completed
  if (isTimer) {
    return v > 0 ? "completed" : "not_started";
  }

  // Build habits (e.g., "Drink 3L Water")
  if (!isBreak && hasBenchmarks) {
    if (iso > today) return "not_started"; // Future dates
    if (iso === today) {
      if (v >= t) return "completed";
      if (v > 0) return "in_progress";
      return "not_started";
    } else {
      // Past days
      if (v >= t) return "completed";
      if (v > 0) return "in_progress";
      return "failed"; // No progress = failed
    }
  }

  // Break/Limit habits (e.g., "Sugar < 10g")
  if (isBreak && hasBenchmarks) {
    if (iso > today) return "not_started"; // Future dates
    if (iso === today) {
      if (v > t) return "failed";
      if (v > 0) return "in_progress";
      return "not_started";
    } else {
      // Past days
      if (v > t) return "failed";
      return "completed"; // Kept within limit
    }
  }

  // Boolean habits (no benchmarks)
  return s.completions[iso]?.[h.id] ? "completed" : "not_started";
}

export function habitTarget(h: Habit): number {
  return h.benchmarks && h.benchmarks.length ? Math.max(...h.benchmarks) : 0;
}

export function habitPct(s: HabitState, h: Habit, iso: string): number {
  const today = todayISO();
  
  // Check if the day is frozen for this habit
  if (s.freezes[iso]?.[h.id]) {
    return 100; // Frozen days count as 100%
  }
  
  if (h.benchmarks && h.benchmarks.length) {
    const t = habitTarget(h);
    const v = s.values?.[iso]?.[h.id] ?? 0;
    if (t <= 0) return 0;
    if (h.direction === "break") {
      if (iso > today) return 0; // Future days show 0% (pending)
      if (v > t) return 0; // Exceeded limit -> 0%
      // Calculate on-track capacity percentage
      return Math.max(0, Math.min(100, Math.round(((t - v) / t) * 100)));
    }
    return Math.max(0, Math.min(100, Math.round((v / t) * 100)));
  }
  return s.completions[iso]?.[h.id] ? 100 : 0;
}

export function habitValue(s: HabitState, h: Habit, iso: string): number {
  return s.values?.[iso]?.[h.id] ?? 0;
}

export function setHabitValue(iso: string, habitId: string, value: number) {
  const prevStreak = currentStreak(state);

  const day = { ...(state.values[iso] ?? {}) };
  if (Number.isFinite(value) && value > 0) day[habitId] = Math.round(value * 100) / 100;
  else delete day[habitId];
  const values = { ...state.values, [iso]: day };
  if (Object.keys(day).length === 0) delete values[iso];
  state = { ...state, values };

  const newStreak = currentStreak(state);
  if (newStreak > prevStreak && newStreak > 0 && newStreak % 7 === 0) {
    state = { ...state, freezeTokens: Math.min(state.freezeTokens + 1, 3) };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("streak-freeze-earned", { detail: newStreak }));
    }
  }

  persist();
}

export function toggleHabit(dateISO: string, habitId: string) {
  const h = state.habits.find((x) => x.id === habitId);
  if (h && h.benchmarks && h.benchmarks.length) return; // benchmarked; use setHabitValue
  
  const prevStreak = currentStreak(state);

  const day = state.completions[dateISO] ?? {};
  const next = { ...day, [habitId]: !day[habitId] };
  state = { ...state, completions: { ...state.completions, [dateISO]: next } };
  if (next[habitId]) state = { ...state, xp: state.xp + 10 };

  const newStreak = currentStreak(state);
  if (newStreak > prevStreak && newStreak > 0 && newStreak % 7 === 0) {
    state = { ...state, freezeTokens: Math.min(state.freezeTokens + 1, 3) };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("streak-freeze-earned", { detail: newStreak }));
    }
  }

  persist();
}

// ---------- CRUD ----------

export function addHabit(input: Omit<Habit, "id" | "createdAt">) {
  const id =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);
  const h: Habit = { schedule: { type: "daily" }, ...input, id, createdAt: todayISO() };
  state = { ...state, habits: [...state.habits, h] };
  persist();
}

export function updateHabit(id: string, patch: Partial<Omit<Habit, "id" | "createdAt">>) {
  state = { ...state, habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) };
  persist();
}

export function deleteHabit(id: string) {
  const completions: HabitState["completions"] = {};
  for (const [d, day] of Object.entries(state.completions)) {
    const { [id]: _removed, ...rest } = day;
    completions[d] = rest;
  }
  const values: HabitState["values"] = {};
  for (const [d, day] of Object.entries(state.values)) {
    const { [id]: _removed, ...rest } = day;
    values[d] = rest;
  }
  state = { ...state, habits: state.habits.filter((h) => h.id !== id), completions, values };
  persist();
}

export function useFreezeToken(dateISO: string, habitId: string) {
  setState((s) => {
    if (s.freezeTokens <= 0) return s;
    
    const newFreezes = { ...s.freezes };
    newFreezes[dateISO] = newFreezes[dateISO] || {};
    newFreezes[dateISO][habitId] = true;
    
    return {
      ...s,
      freezeTokens: s.freezeTokens - 1,
      freezes: newFreezes,
    };
  });
}

export function addFreezeToken() {
  setState((s) => ({
    ...s,
    freezeTokens: Math.min(s.freezeTokens + 1, 3),
  }));
}

export function setNote(dateISO: string, text: string) {
  const notes = { ...state.notes };
  if (text) notes[dateISO] = text;
  else delete notes[dateISO];
  state = { ...state, notes };
  persist();
}

export function setMetric<K extends keyof DailyMetrics>(
  dateISO: string,
  key: K,
  value: DailyMetrics[K] | undefined,
) {
  const existing = state.metrics[dateISO] ?? {};
  const next: DailyMetrics = { ...existing };
  if (value === undefined || value === null || Number.isNaN(value)) delete next[key];
  else next[key] = value;
  const metrics = { ...state.metrics, [dateISO]: next };
  if (Object.keys(next).length === 0) delete metrics[dateISO];
  state = { ...state, metrics };
  persist();
}

export function setMonthlyGoal(pct: number) {
  state = { ...state, monthlyGoal: Math.max(0, Math.min(100, Math.round(pct))) };
  persist();
}

export function setReminderSettings(settings: Partial<ReminderSettings>) {
  state = {
    ...state,
    reminderSettings: { ...state.reminderSettings, ...settings },
  };
  persist();
  scheduleReminder();
}

export function getReminderSettings(): ReminderSettings {
  return state.reminderSettings;
}

export function resetAll(mode: "seed" | "empty" = "empty") {
  state = mode === "seed" ? defaultState() : emptyState();
  persist();
}

export function clearHistory() {
  state = { ...state, completions: {}, values: {}, notes: {}, metrics: {}, xp: 0 };
  persist();
}

// ---------- Active Timer Store ----------

let activeTimer: ActiveTimer | null = null;

export function getActiveTimer(): ActiveTimer | null {
  return activeTimer;
}

export function startTimer(habitId: string, dateISO: string) {
  activeTimer = {
    habitId,
    dateISO,
    startTime: Date.now(),
    accumulatedSec: 0,
    isRunning: true,
  };
  state = { ...state };
  persist();
}

export function pauseTimer() {
  if (!activeTimer || !activeTimer.isRunning) return;
  const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
  activeTimer = {
    ...activeTimer,
    accumulatedSec: activeTimer.accumulatedSec + elapsed,
    isRunning: false,
  };
  state = { ...state };
  persist();
}

export function resumeTimer() {
  if (!activeTimer || activeTimer.isRunning) return;
  activeTimer = {
    ...activeTimer,
    startTime: Date.now(),
    isRunning: true,
  };
  state = { ...state };
  persist();
}

export function stopAndSaveTimer(unit?: string) {
  if (!activeTimer) return 0;
  let totalSec = activeTimer.accumulatedSec;
  if (activeTimer.isRunning) {
    totalSec += Math.floor((Date.now() - activeTimer.startTime) / 1000);
  }

  const isHours = unit === "hrs" || unit === "hr" || unit === "hours" || unit === "hour";
  const val = isHours
    ? Math.round((totalSec / 3600) * 100) / 100
    : Math.round((totalSec / 60) * 10) / 10;

  const { habitId, dateISO } = activeTimer;
  activeTimer = null;

  if (val > 0) {
    const existing = state.values[dateISO]?.[habitId] ?? 0;
    setHabitValue(dateISO, habitId, existing + val);
  } else {
    state = { ...state };
    persist();
  }
  return val;
}

export function cancelTimer() {
  activeTimer = null;
  state = { ...state };
  persist();
}

// ---------- Aggregate stats (all scheduling-aware) ----------

export function completionsForDate(s: HabitState, dateISO: string) {
  const scheduled = habitsFor(s, dateISO);
  if (scheduled.length === 0) return { done: 0, total: 0, pct: 0 };
  let sum = 0,
    done = 0;
  for (const h of scheduled) {
    const p = habitPct(s, h, dateISO);
    const status = habitStatus(s, h, dateISO);
    sum += p;
    if (status === "completed") done++;
  }
  return { done, total: scheduled.length, pct: Math.round(sum / scheduled.length) };
}

export function currentStreak(s: HabitState): number {
  if (s.habits.length === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = daysAgoISO(i);
    const scheduled = habitsFor(s, day);
    if (scheduled.length === 0) continue; // skip off-days
    
    // Check if the day is frozen for any habit
    const isFrozenDay = scheduled.some(h => s.freezes[day]?.[h.id]);
    if (isFrozenDay) {
      streak++; // Frozen days count as streak days
      continue;
    }
    
    const { pct } = completionsForDate(s, day);
    if (pct >= 60) streak++;
    else break;
  }
  return streak;
}

export function longestStreak(s: HabitState): { days: number; from: string; to: string } {
  let best = 0,
    cur = 0,
    bestEnd = "";
  const daysBack = 200;
  for (let i = daysBack; i >= 0; i--) {
    const day = daysAgoISO(i);
    const scheduled = habitsFor(s, day);
    if (scheduled.length === 0) continue;
    
    // Check if the day is frozen for any habit
    const isFrozenDay = scheduled.some(h => s.freezes[day]?.[h.id]);
    if (isFrozenDay) {
      cur++;
      if (cur > best) {
        best = cur;
        bestEnd = day;
      }
      continue;
    }
    
    const { pct } = completionsForDate(s, day);
    if (pct >= 60) {
      cur++;
      if (cur > best) {
        best = cur;
        bestEnd = day;
      }
    } else cur = 0;
  }
  const end = new Date(bestEnd || todayISO());
  const start = new Date(end);
  start.setDate(end.getDate() - best + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { days: best, from: best ? fmt(start) : "—", to: best ? fmt(end) : "—" };
}

export function weeklyProgress(s: HabitState) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const { pct } = completionsForDate(s, iso);
    return { day: label, pct, date: iso };
  });
}

export function categoryBreakdown(s: HabitState) {
  const colors: Record<HabitCategory, string> = {
    Health: "oklch(0.72 0.18 155)",
    Mind: "oklch(0.68 0.22 350)",
    Productivity: "oklch(0.75 0.18 55)",
    Learning: "oklch(0.72 0.18 235)",
    Lifestyle: "oklch(0.65 0.22 320)",
    "CAT Prep": "oklch(0.7 0.22 25)",
  };
  return CATEGORIES.map((cat) => {
    const catHabits = s.habits.filter((h) => h.category === cat);
    if (catHabits.length === 0) return { cat, pct: 0, color: colors[cat] };
    let sum = 0,
      n = 0;
    for (let i = 0; i < 30; i++) {
      const iso = daysAgoISO(i);
      for (const h of catHabits) {
        if (!isScheduledOn(h, iso)) continue;
        sum += habitPct(s, h, iso);
        n++;
      }
    }
    return { cat, pct: n ? Math.round(sum / n) : 0, color: colors[cat] };
  });
}

export function overallProgress(s: HabitState): number {
  if (s.habits.length === 0) return 0;
  let sum = 0,
    n = 0;
  for (let i = 0; i < 30; i++) {
    const iso = daysAgoISO(i);
    for (const h of s.habits) {
      if (!isScheduledOn(h, iso)) continue;
      sum += habitPct(s, h, iso);
      n++;
    }
  }
  return n ? Math.round(sum / n) : 0;
}

export function topHabits(s: HabitState) {
  return s.habits
    .map((h) => {
      let sum = 0,
        n = 0;
      for (let i = 0; i < 30; i++) {
        const iso = daysAgoISO(i);
        if (!isScheduledOn(h, iso)) continue;
        sum += habitPct(s, h, iso);
        n++;
      }
      return { habit: h, pct: n ? Math.round(sum / n) : 0 };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
}

export function monthlyHeatmap(s: HabitState, year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  const todayD = now.getDate();

  const cells: { day: number; row: number; level: number; hasData: boolean }[] = [];
  s.habits.forEach((h, r) => {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      // Ensure month and day are correctly padded, though toISOString does UTC.
      // Better to manually format the local date.
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const iso = `${y}-${mm}-${dd}`;
      
      const isFuture = isCurrentMonth && d > todayD;
      
      if (isFuture || !isScheduledOn(h, iso)) {
        cells.push({ day: d, row: r, level: -1, hasData: false });
        continue;
      }
      
      const pct = habitPct(s, h, iso);
      let level = 0;
      if (pct >= 100) level = 4;
      else if (pct >= 66) level = 3;
      else if (pct >= 34) level = 2;
      else if (pct > 0) level = 1;
      
      cells.push({ day: d, row: r, level, hasData: true });
    }
  });
  
  return { cells, daysInMonth, year: y, month: m, habitNames: s.habits.map(h => h.name) };
}

export function totalCompleted(s: HabitState): number {
  let n = 0;
  for (const day of Object.values(s.completions)) for (const v of Object.values(day)) if (v) n++;
  // count benchmarked days that hit 100%
  for (const [iso, day] of Object.entries(s.values ?? {})) {
    for (const h of s.habits) {
      if (!h.benchmarks || !h.benchmarks.length) continue;
      if (!(h.id in day)) continue;
      if (habitStatus(s, h, iso) === "completed") n++;
    }
  }
  return n;
}

export function perfectDays(s: HabitState): number {
  let n = 0;
  const dates = new Set<string>([...Object.keys(s.completions), ...Object.keys(s.values ?? {})]);
  for (const iso of dates) {
    const scheduled = habitsFor(s, iso);
    if (scheduled.length === 0) continue;
    
    // Check if the day is frozen for any habit
    const isFrozenDay = scheduled.some(h => s.freezes[iso]?.[h.id]);
    if (isFrozenDay) {
      n++; // Frozen days count as perfect days
      continue;
    }
    
    const { pct, total } = completionsForDate(s, iso);
    if (total > 0 && pct === 100) n++;
  }
  return n;
}

export type Achievement = {
  id: string;
  icon: string;
  label: string;
  sub: string;
  from: string;
  to: string;
  unlocked: boolean;
};

/** Returns all possible achievements and their unlocked status */
export function getAchievements(s: HabitState): Achievement[] {
  const currentStreakDays = currentStreak(s);
  const totalCompletions = totalCompleted(s);
  const perfectDaysCount = perfectDays(s);

  // CAT-specific helpers
  const catHabits = s.habits.filter((h) => h.category === "CAT Prep");
  const catCompletions = catHabits.flatMap((h) => {
    return Object.entries(s.completions).filter(([iso, day]) => day[h.id] && isScheduledOn(h, iso));
  }).length;

  // Check if all CAT topics are mastered (simplified - assumes topics are stored in KV)
  // In a real implementation, this would check the topic_progress table
  const catTopicsMastered = false; // Placeholder - would check actual topic data

  // Check if all CAT checklist items are done
  const catChecklistDone = false; // Placeholder - would check actual checklist data

  // Check if first CAT topic is finished
  const firstCatTopicFinished = false; // Placeholder - would check actual topic data

  return [
    // Streak achievements
    {
      id: "streak-7",
      icon: "Flame",
      label: "Early Bird",
      sub: "7 Days",
      from: "oklch(0.7 0.18 235)",
      to: "oklch(0.55 0.2 260)",
      unlocked: currentStreakDays >= 7,
    },
    {
      id: "streak-25",
      icon: "Flame",
      label: "Streak Master",
      sub: "25 Days",
      from: "oklch(0.75 0.2 55)",
      to: "oklch(0.65 0.22 25)",
      unlocked: currentStreakDays >= 25,
    },
    {
      id: "streak-50",
      icon: "ShieldCheck",
      label: "Consistent",
      sub: "50 Days",
      from: "oklch(0.72 0.18 155)",
      to: "oklch(0.55 0.2 175)",
      unlocked: currentStreakDays >= 50,
    },

    // Completion achievements
    {
      id: "completions-100",
      icon: "CheckCircle2",
      label: "Centurion",
      sub: "100 Completions",
      from: "oklch(0.65 0.2 320)",
      to: "oklch(0.5 0.22 300)",
      unlocked: totalCompletions >= 100,
    },
    {
      id: "completions-500",
      icon: "Award",
      label: "Gold Achiever",
      sub: "500 Completions",
      from: "oklch(0.8 0.17 75)",
      to: "oklch(0.65 0.2 45)",
      unlocked: totalCompletions >= 500,
    },

    // Perfect day achievements
    {
      id: "perfect-5",
      icon: "Star",
      label: "Flawless Week",
      sub: "5 Perfect Days",
      from: "oklch(0.75 0.2 85)",
      to: "oklch(0.6 0.22 65)",
      unlocked: perfectDaysCount >= 5,
    },

    // CAT-specific achievements
    {
      id: "cat-first-topic",
      icon: "GraduationCap",
      label: "First Topic",
      sub: "Finished a CAT topic",
      from: "oklch(0.7 0.22 25)",
      to: "oklch(0.55 0.2 45)",
      unlocked: firstCatTopicFinished,
    },
    {
      id: "cat-all-topics",
      icon: "Trophy",
      label: "CAT Master",
      sub: "All topics mastered",
      from: "oklch(0.75 0.2 55)",
      to: "oklch(0.6 0.22 35)",
      unlocked: catTopicsMastered,
    },
    {
      id: "cat-checklist",
      icon: "ListCheck",
      label: "CAT Ready",
      sub: "All checklist items done",
      from: "oklch(0.68 0.22 350)",
      to: "oklch(0.5 0.2 330)",
      unlocked: catChecklistDone,
    },
    {
      id: "cat-50-completions",
      icon: "Calculator",
      label: "CAT Grinder",
      sub: "50 CAT completions",
      from: "oklch(0.7 0.22 25)",
      to: "oklch(0.55 0.2 45)",
      unlocked: catCompletions >= 50,
    },
  ];
}

// ---------- Reminder Scheduling ----------

let reminderTimeout: ReturnType<typeof setTimeout> | null = null;

function clearReminderTimeout() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
}

export function scheduleReminder(): void {
  clearReminderTimeout();

  const settings = state.reminderSettings;
  if (!settings.enabled || typeof window === "undefined") return;

  const [hours, minutes] = settings.time.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );

  // If reminder time is in the past, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delay = reminderTime.getTime() - now.getTime();

  reminderTimeout = setTimeout(() => {
    showReminderNotification();
    // Schedule next reminder for tomorrow
    scheduleReminder();
  }, delay);
}

function showReminderNotification(): void {
  if (typeof window === "undefined") return;

  const settings = state.reminderSettings;
  if (!settings.enabled) return;

  if (Notification.permission === "granted") {
    new Notification("Daily Habit Reminder", {
      body: "Don't forget to complete your habits for today!",
      icon: "/icons/icon-192x192.png",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setReminderSettings({ notificationPermission: permission });
        new Notification("Daily Habit Reminder", {
          body: "Don't forget to complete your habits for today!",
          icon: "/icons/icon-192x192.png",
        });
      } else {
        setReminderSettings({ notificationPermission: permission });
      }
    });
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") return Promise.resolve("default");
  return Notification.requestPermission().then((permission) => {
    setReminderSettings({ notificationPermission: permission });
    return permission;
  });
}

export function testReminderNotification(): void {
  if (typeof window === "undefined") return;

  if (Notification.permission === "granted") {
    new Notification("Test Habit Reminder", {
      body: "This is a test notification for your daily habits.",
      icon: "/icons/icon-192x192.png",
    });
  } else if (Notification.permission !== "denied") {
    requestNotificationPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Test Habit Reminder", {
          body: "This is a test notification for your daily habits.",
          icon: "/icons/icon-192x192.png",
        });
      }
    });
  }
}

// ---------- Insights Helpers ----------


export function bestHabitThisWeek(s: HabitState): { name: string; pct: number } {
  const today = todayISO();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toLocaleDateString('en-CA');

  const habitStats = s.habits.map((h) => {
    let total = 0;
    let completed = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateISO = date.toLocaleDateString('en-CA');
      if (dateISO < sevenDaysAgoISO) continue;

      const scheduled = isScheduledOn(h, dateISO);
      if (!scheduled) continue;
      total++;

      const status = habitStatus(s, h, dateISO);
      if (status === "completed") completed++;
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: h.name, pct };
  }).filter((stat) => stat.pct > 0);

  return habitStats.reduce((best, current) => (current.pct > best.pct ? current : best), { name: "None", pct: 0 });
}

export function mostMissedHabit(s: HabitState): { name: string; pct: number } {
  const today = todayISO();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toLocaleDateString('en-CA');

  const habitStats = s.habits.map((h) => {
    let total = 0;
    let completed = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateISO = date.toLocaleDateString('en-CA');
      if (dateISO < sevenDaysAgoISO) continue;

      const scheduled = isScheduledOn(h, dateISO);
      if (!scheduled) continue;
      total++;

      const status = habitStatus(s, h, dateISO);
      if (status === "completed") completed++;
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: h.name, pct };
  }).filter((stat) => stat.pct < 100);

  return habitStats.reduce((worst, current) => (current.pct < worst.pct ? current : worst), { name: "None", pct: 100 });
}

export function weekOverWeekProgress(s: HabitState): number {
  const currentWeek = weeklyProgress(s);
  
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekIso = lastWeekDate.toLocaleDateString('en-CA');
  
  let lastWeekCompleted = 0;
  let lastWeekTotal = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(lastWeekDate);
    date.setDate(date.getDate() - i);
    const dateISO = date.toLocaleDateString('en-CA');
    const { done, total } = completionsForDate(s, dateISO);
    lastWeekCompleted += done;
    lastWeekTotal += total;
  }
  
  const currentPct = currentWeek.reduce((sum, d) => sum + d.pct, 0) / (currentWeek.length || 1);
  const lastWeekPct = lastWeekTotal > 0 ? (lastWeekCompleted / lastWeekTotal) * 100 : 0;
  
  return Math.round(currentPct - lastWeekPct);
}

export function longestActiveStreak(s: HabitState): { name: string; streak: number } {
  const today = todayISO();
  let best = { name: "None", streak: 0 };
  
  for (const h of s.habits) {
    let current = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateISO = date.toLocaleDateString('en-CA');
      
      const scheduled = isScheduledOn(h, dateISO);
      if (!scheduled) continue;
      
      const status = habitStatus(s, h, dateISO);
      if (status === "completed" || (status as any) === "frozen") {
        current++;
      } else if ((status as any) === "missed") {
        break;
      }
    }
    if (current > best.streak) {
      best = { name: h.name, streak: current };
    }
  }
  
  return best;
}

export function bestDayToCheckIn(s: HabitState): { day: string; pct: number } {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayStats = Array(7).fill(0).map(() => ({ done: 0, total: 0 }));
  
  for (let i = 0; i < 28; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateISO = date.toLocaleDateString('en-CA');
    const dayOfWeek = date.getDay();
    const { done, total } = completionsForDate(s, dateISO);
    dayStats[dayOfWeek].done += done;
    dayStats[dayOfWeek].total += total;
  }
  
  let best = { day: "None", pct: 0 };
  for (let i = 0; i < 7; i++) {
    const pct = dayStats[i].total > 0 ? Math.round((dayStats[i].done / dayStats[i].total) * 100) : 0;
    if (pct > best.pct) {
      best = { day: days[i], pct };
    }
  }
  
  return best;
}

export { todayISO, daysAgoISO };
