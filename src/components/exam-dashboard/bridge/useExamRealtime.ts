import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExamAuth } from './useExamAuth';

export function useExamRealtime(onSync?: () => void) {
  const { user } = useExamAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (onSync) onSync();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_tracker',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (onSync) onSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onSync]);
}
