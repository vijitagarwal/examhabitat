import { createFileRoute, redirect } from '@tanstack/react-router';
import { ExamDashboardShell } from '@/components/exam-dashboard/ExamDashboardShell';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({ to: '/auth' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  return <ExamDashboardShell />;
}
