import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_ORDER, STATUS_COLORS, type ExamConfig, type TopicStatus } from '@/lib/exams';
import { isTopicStatus } from '@/lib/exams/validation';
import { supabase } from '@/integrations/supabase/client';
import { useExamToast } from '../bridge/useExamToast';
import { Search, Sparkles, CheckCircle2, RotateCw, Plus, BookOpen, Filter } from 'lucide-react';

interface TopicTrackerProps {
  examConfig: ExamConfig;
}

interface TopicItem {
  id?: string;
  exam_id: string;
  section: string;
  topic_name: string;
  status: TopicStatus;
  confidence: number;
  time_spent_minutes: number;
}

export function TopicTracker({ examConfig }: TopicTrackerProps) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>(examConfig.sections[0]?.code || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingTopic, setSavingTopic] = useState<string | null>(null);
  const { toast } = useExamToast();

  // 1. Fetch & Auto-seed Topics
  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Fetch existing topics for current exam_id
      const { data: existingTopics, error } = await supabase
        .from('topic_tracker')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('exam_id', examConfig.id);

      if (error) {
        console.warn('Error fetching topics:', error);
        toast('Unable to load topics.', {
          description: 'Please refresh the page and try again.',
          type: 'error',
        });
        return;
      }

      if (existingTopics && existingTopics.length > 0) {
        setTopics(existingTopics as TopicItem[]);
      } else {
        // Auto-seed default topics using upsert to avoid race conditions
        const defaultTopicPayload = examConfig.defaultTopics.map((dt) => ({
          user_id: session.user.id,
          exam_id: examConfig.id,
          section: dt.section,
          topic_name: dt.topic_name,
          status: 'Not Started' as TopicStatus,
          confidence: 0,
          time_spent_minutes: 0,
        }));

        const { data: seeded, error: seedError } = await supabase
          .from('topic_tracker')
          .upsert(defaultTopicPayload, { onConflict: 'user_id,exam_id,topic_name' })
          .select('*');

        if (seedError) {
          console.warn('Error seeding topics:', seedError);
          toast('Unable to prepare your topic tracker.', {
            description: 'Please refresh the page and try again.',
            type: 'error',
          });
        } else if (seeded) {
          setTopics(seeded as TopicItem[]);
        }
      }
    } catch (err) {
      console.warn('Failed to load topic tracker:', err);
      toast('Unable to load your topic tracker.', {
        description: 'Please refresh the page and try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [examConfig.id, examConfig.defaultTopics, toast]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // 2. Cycle Status on Click & Record Audit Log in topic_history
  const handleCycleStatus = async (topic: TopicItem) => {
    const currentIndex = STATUS_ORDER.indexOf(topic.status);
    if (!isTopicStatus(topic.status) || currentIndex < 0) {
      toast('This topic has an unsupported status.', {
        description: 'Refresh the tracker before changing it.',
        type: 'error',
      });
      return;
    }
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    if (savingTopic === topic.topic_name) return;
    setSavingTopic(topic.topic_name);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        toast('You must be signed in to update topics.', { type: 'error' });
        return;
      }

      // Update topic status in topic_tracker
      const { error: updateError } = await supabase
        .from('topic_tracker')
        .upsert(
          {
            user_id: session.user.id,
            exam_id: examConfig.id,
            section: topic.section,
            topic_name: topic.topic_name,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exam_id,topic_name' }
        );
      if (updateError) throw updateError;

      // Record audit history in topic_history table
      const { error: historyError } = await supabase.from('topic_history').insert({
        user_id: session.user.id,
        exam_id: examConfig.id,
        topic_name: topic.topic_name,
        old_status: topic.status,
        new_status: nextStatus,
        changed_at: new Date().toISOString(),
      });
      setTopics((prev) =>
        prev.map((t) => (t.topic_name === topic.topic_name ? { ...t, status: nextStatus } : t))
      );
      if (historyError) {
        console.warn('Error recording topic status history:', historyError);
        toast('Topic status updated, but history was not recorded.', {
          description: 'The status is saved. Please refresh before retrying.',
          type: 'error',
        });
      }
    } catch (err) {
      console.warn('Error updating topic status:', err);
      toast('Unable to update this topic.', {
        description: 'Your previous status is still active.',
        type: 'error',
      });
    } finally {
      setSavingTopic(null);
    }
  };

  // Filter topics by section & search query
  const filteredTopics = topics.filter((t) => {
    const matchesSection = activeSection === 'All' || t.section === activeSection;
    const matchesSearch = t.topic_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const sectionCodes = ['All', ...examConfig.sections.map((s) => s.code)];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            {examConfig.name} Topic Tracker
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Track syllabus progress across all sections. Click any badge to cycle status.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {sectionCodes.map((code) => {
          const isActive = activeSection === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setActiveSection(code)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>

      {/* Topic Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 text-sm">Loading topic database...</div>
      ) : filteredTopics.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-8">
          <p className="text-sm text-zinc-400">No topics match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((topic) => {
            const colors = STATUS_COLORS[topic.status] || STATUS_COLORS['Not Started'];
            const isMastered = topic.status === 'Mastered';

            return (
              <motion.div
                key={topic.topic_name}
                layout
                whileHover={{ scale: 1.01 }}
                onClick={() => handleCycleStatus(topic)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isMastered
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {topic.section}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    {topic.status}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                  {topic.topic_name}
                </h4>

                <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-between items-center text-[11px] text-zinc-500">
                  <span>Click to cycle status</span>
                  {isMastered && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
