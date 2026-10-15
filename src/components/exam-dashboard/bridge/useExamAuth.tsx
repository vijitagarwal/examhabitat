import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface Profile {
  id: string;
  target_exam: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ExamAuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultAuthContext: ExamAuthContextType = {
  session: null,
  user: null,
  profile: null,
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
};

const ExamAuthContext = createContext<ExamAuthContextType>(defaultAuthContext);

async function seedProfileIfNeeded(userId: string) {
  try {
    const { data: existing } = await db.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!existing) {
      await db.from("profiles").insert({
        id: userId,
        target_exam: null,
        display_name: null,
        avatar_url: null,
      });
    }
  } catch (err) {
    console.warn("Error seeding profile:", err);
  }
}

export function ExamAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    await seedProfileIfNeeded(userId);
    const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data as Profile | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        setLoading(false);
      } else if (s?.user) {
        setSession(s);
        loadProfile(s.user.id).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <ExamAuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </ExamAuthContext.Provider>
  );
}

export function useExamAuth() {
  return useContext(ExamAuthContext);
}
