import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExamAuth } from "./useExamAuth";
import { useExamToast } from "./useExamToast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useExamKV<T>(
  key: string,
  defaultValue: T,
): {
  value: T;
  setValue: (v: T) => Promise<void>;
  loading: boolean;
  persistence: "remote" | "local" | "unauthenticated";
} {
  const { user } = useExamAuth();
  const { toast } = useExamToast();
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [persistence, setPersistence] = useState<"remote" | "local" | "unauthenticated">("local");

  useEffect(() => {
    if (!user) {
      setPersistence("unauthenticated");
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchValue = async () => {
      try {
        const { data, error } = await db
          .from("kv_store")
          .select("value")
          .eq("user_id", user.id)
          .eq("key", key)
          .maybeSingle();
        if (error) {
          throw error;
        }
        if (cancelled) return;
        if (data?.value !== undefined && data?.value !== null) {
          setValueState(data.value as T);
          setPersistence("remote");
        } else {
          const local = localStorage.getItem(`exam_kv_${key}`);
          if (local) {
            try {
              setValueState(JSON.parse(local) as T);
              setPersistence("local");
            } catch {
              toast("Saved local preference could not be read.", { type: "error" });
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load remote preference:", err);
        const local = localStorage.getItem(`exam_kv_${key}`);
        if (local) {
          try {
            setValueState(JSON.parse(local) as T);
            setPersistence("local");
          } catch {
            toast("Saved local preference could not be read.", { type: "error" });
          }
        } else {
          toast("Unable to load this preference.", {
            description: "The default value is being used locally.",
            type: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchValue();

    const handleUpdate = (e: Event) => {
      const event = e as CustomEvent<{ key: string; value: T }>;
      if (event.detail.key === key) {
        setValueState(event.detail.value);
      }
    };
    window.addEventListener("exam_kv_update", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("exam_kv_update", handleUpdate);
    };
  }, [user, key, toast]);

  const setValue = useCallback(
    async (newValue: T) => {
      setValueState(newValue);
      localStorage.setItem(`exam_kv_${key}`, JSON.stringify(newValue));
      window.dispatchEvent(new CustomEvent("exam_kv_update", { detail: { key, value: newValue } }));
      if (!user) {
        setPersistence("unauthenticated");
        return;
      }
      try {
        const { error } = await db
          .from("kv_store")
          .upsert(
            { user_id: user.id, key, value: newValue, updated_at: new Date().toISOString() },
            { onConflict: "user_id,key" },
          );
        if (error) {
          throw error;
        }
        setPersistence("remote");
      } catch (err) {
        console.warn("Failed to persist preference remotely:", err);
        setPersistence("local");
        toast("Preference saved locally only.", {
          description: "It was not saved to your account. Please try again later.",
          type: "error",
        });
        throw err;
      }
    },
    [user, key, toast],
  );

  return { value, setValue, loading, persistence };
}
