import { useState, useEffect, useCallback } from 'react';
import { type ExamId, type ExamConfig, getExamConfig, isExamId, DEFAULT_EXAM_ID } from '@/lib/exams';
import { supabase } from '@/integrations/supabase/client';
import { useExamToast } from '@/components/exam-dashboard/bridge/useExamToast';

const LOCAL_STORAGE_KEY = 'exam_habitat_selected_exam';

function hasInvalidCachedExam(): boolean {
  if (typeof window === 'undefined') return false;
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached !== null && !isExamId(cached);
}

export interface UseSelectedExamReturn {
  examId: ExamId;
  examConfig: ExamConfig;
  setExam: (newExamId: ExamId) => Promise<void>;
  isLoading: boolean;
  needsOnboarding: boolean;
}

export function useSelectedExam(): UseSelectedExamReturn {
  const { toast } = useExamToast();
  const [examId, setExamIdState] = useState<ExamId>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (isExamId(cached)) return cached;
    }
    return DEFAULT_EXAM_ID;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(hasInvalidCachedExam);

  useEffect(() => {
    let isMounted = true;
    let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;

    async function loadUserExam() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          toast('Unable to load your session.', {
            description: 'Please refresh the page and try again.',
            type: 'error',
          });
          return;
        }
        if (!session?.user) {
          if (hasInvalidCachedExam()) {
            toast('Your saved exam selection is unavailable.', {
              description: 'Please choose a supported exam to continue.',
              type: 'error',
            });
            setNeedsOnboarding(true);
          } else {
            setNeedsOnboarding(false);
          }
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('target_exam')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching profile target_exam:', error);
          toast('Unable to load your exam selection.', {
            description: 'Choose your exam again after refreshing the page.',
            type: 'error',
          });
          return;
        }

        if (isMounted) {
          if (!profile || !profile.target_exam) {
            setNeedsOnboarding(true);
          } else if (!isExamId(profile.target_exam)) {
            setNeedsOnboarding(true);
            toast('Your saved exam selection is unavailable.', {
              description: 'Please choose a supported exam to continue.',
              type: 'error',
            });
          } else {
            setExamIdState(profile.target_exam);
            localStorage.setItem(LOCAL_STORAGE_KEY, profile.target_exam);
            setNeedsOnboarding(false);
          }
        }

        if (session.user.id) {
          supabaseChannel = supabase
            .channel(`profile_exam_sync_${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`,
              },
              async (payload) => {
                const nextExam = payload.new?.target_exam as string | null | undefined;
                if (!nextExam) {
                  setNeedsOnboarding(true);
                  return;
                }

                if (!isExamId(nextExam)) {
                  setNeedsOnboarding(true);
                  toast('Your exam selection is unavailable on another device.', {
                    description: 'Please choose a supported exam again.',
                    type: 'error',
                  });
                  return;
                }

                setExamIdState(nextExam);
                localStorage.setItem(LOCAL_STORAGE_KEY, nextExam);
                setNeedsOnboarding(false);
              },
            )
            .subscribe();
        }
      } catch (err) {
        console.warn('Failed to load user exam profile:', err);
        toast('Unable to load your exam selection.', {
          description: 'Please refresh the page and try again.',
          type: 'error',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUserExam();

    return () => {
      isMounted = false;
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [toast]);

  const setExam = useCallback(async (newExamId: ExamId) => {
    if (!isExamId(newExamId)) {
      toast('That exam is not supported.', {
        description: 'Choose an exam from the available options.',
        type: 'error',
      });
      throw new Error('Unsupported exam selection');
    }

    const config = getExamConfig(newExamId);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          target_exam: config.id,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        throw error;
      }

      setExamIdState(config.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, config.id);
      setNeedsOnboarding(false);
    } catch (err) {
      console.warn('Failed to persist exam choice to Supabase:', err);
      toast('Your exam selection was not saved.', {
        description: 'Please try again. Your previous selection is still active.',
        type: 'error',
      });
      throw err;
    }
  }, [toast]);

  return {
    examId,
    examConfig: getExamConfig(examId),
    setExam,
    isLoading,
    needsOnboarding,
  };
}
