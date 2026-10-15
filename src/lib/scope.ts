import { createContext, useContext } from "react";
import type { Habit } from "./habits-store";

export type Scope = "habit" | "exam";
export const ScopeCtx = createContext<Scope>("habit");

export function useScope(): Scope {
  return useContext(ScopeCtx);
}

export function filterHabitsByScope<T extends Habit>(habits: T[], scope: Scope): T[] {
  if (scope === "exam") return habits.filter((h) => h.category === "Exam Prep");
  return habits;
}
