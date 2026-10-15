import { toast } from 'sonner';
import { useCallback } from 'react';

export function useExamToast() {
  const notify = useCallback(
    (message: string, options?: { description?: string; type?: 'success' | 'error' | 'info' }) => {
      if (options?.type === 'error') {
        toast.error(message, { description: options.description });
      } else if (options?.type === 'success') {
        toast.success(message, { description: options.description });
      } else {
        toast(message, { description: options.description });
      }
    },
    [],
  );

  return {
    toast: notify,
  };
}
