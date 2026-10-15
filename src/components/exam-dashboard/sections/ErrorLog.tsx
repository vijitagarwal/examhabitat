import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ExamConfig } from '@/lib/exams';
import { supabase } from '@/integrations/supabase/client';
import { useExamToast } from '../bridge/useExamToast';
import { AlertOctagon, Plus, Search, Trash2, CheckCircle2 } from 'lucide-react';

interface ErrorLogProps {
  examConfig: ExamConfig;
}

interface ErrorLogRecord {
  id: string;
  exam_id: string;
  date: string;
  question: string;
  section: string;
  topic?: string;
  type?: string;
  cause?: string;
  fix?: string;
  mock_number?: number;
  created_at: string;
}

export function ErrorLog({ examConfig }: ErrorLogProps) {
  const [errors, setErrors] = useState<ErrorLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [questionText, setQuestionText] = useState<string>('');
  const [sectionCode, setSectionCode] = useState<string>(examConfig.sections[0]?.code || '');
  const [topicName, setTopicName] = useState<string>('');
  const [errorCause, setErrorCause] = useState<string>('');
  const [errorFix, setErrorFix] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useExamToast();

  const loadErrors = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setLoading(false);
        toast('You must be signed in to load the error log.', { type: 'error' });
        return;
      }

      const { data, error } = await supabase
        .from('error_log')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('exam_id', examConfig.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setErrors(data as ErrorLogRecord[]);
    } catch (err) {
      console.warn('Failed to load error log:', err);
      toast('Unable to load the error log.', {
        description: 'Please refresh the page and try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [examConfig.id, toast]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const handleSaveError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!questionText.trim()) {
      toast('Describe the question before saving.', { type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        toast('You must be signed in to save an error.', { type: 'error' });
        return;
      }

      const payload = {
        user_id: session.user.id,
        exam_id: examConfig.id,
        date: new Date().toISOString().slice(0, 10),
        question: questionText.trim(),
        section: sectionCode,
        topic: topicName.trim() || null,
        cause: errorCause.trim() || null,
        fix: errorFix.trim() || null,
      };

      const { data: saved, error } = await supabase
        .from('error_log')
        .insert(payload)
        .select('*')
        .single();

      if (error || !saved) {
        throw error ?? new Error('Error log entry was not returned after saving.');
      }
      setErrors((prev) => [saved as ErrorLogRecord, ...prev]);
      setShowAddForm(false);
      setQuestionText('');
      setTopicName('');
      setErrorCause('');
      setErrorFix('');
      toast('Error entry saved.', { type: 'success' });
    } catch (err) {
      console.error('Error saving error log:', err);
      toast('Unable to save this error entry.', {
        description: 'No entry was added. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteError = async (id: string) => {
    if (deletingId === id) return;
    const previousIndex = errors.findIndex((error) => error.id === id);
    const previousError = errors[previousIndex];
    if (!previousError) return;

    setDeletingId(id);
    setErrors((prev) => prev.filter((e) => e.id !== id));
    try {
      const { error } = await supabase.from('error_log').delete().eq('id', id);
      if (error) throw error;
      toast('Error entry deleted.', { type: 'success' });
    } catch (err) {
      console.warn('Error deleting error log:', err);
      setErrors((prev) => {
        if (prev.some((error) => error.id === id)) return prev;
        const next = [...prev];
        next.splice(Math.min(previousIndex, next.length), 0, previousError);
        return next;
      });
      toast('Unable to delete this error entry.', {
        description: 'The entry was restored.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredErrors = errors.filter((errItem) => {
    const matchesSection = activeSection === 'All' || errItem.section === activeSection;
    const matchesSearch =
      errItem.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (errItem.topic && errItem.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const sectionCodes = ['All', ...examConfig.sections.map((s) => s.code)];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-amber-400" />
            {examConfig.name} Error Log
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Log silly mistakes, conceptual traps, and calculation errors to avoid repeating them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Log New Error'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSaveError} className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Log Mistakes & Remediation Fix</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Section</label>
              <select
                value={sectionCode}
                onChange={(e) => setSectionCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              >
                {examConfig.sections.map((sec) => (
                  <option key={sec.code} value={sec.code}>
                    {sec.name} ({sec.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Topic Name</label>
              <input
                type="text"
                placeholder="e.g. Quadratic Inequalities / Plant Physiology"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Question Summary / Description</label>
            <textarea
              required
              rows={2}
              placeholder="Describe the question or concept..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Cause of Mistake</label>
              <input
                type="text"
                placeholder="e.g. Misread question / Silly arithmetic error"
                value={errorCause}
                onChange={(e) => setErrorCause(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Remediation Fix / Takeaway</label>
              <input
                type="text"
                placeholder="e.g. Always check domain boundaries before taking logs"
                value={errorFix}
                onChange={(e) => setErrorFix(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
          >
            {isSaving ? 'Saving Error Entry...' : 'Save Error Entry'}
          </button>
        </form>
      )}

      {/* Section Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {sectionCodes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setActiveSection(code)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
              activeSection === code
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredErrors.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-8">
          <p className="text-sm text-zinc-400">No error entries logged yet for {examConfig.name}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((errItem) => (
            <div key={errItem.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {errItem.section}
                  </span>
                  {errItem.topic && <span className="text-xs font-semibold text-white">{errItem.topic}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteError(errItem.id)}
                  disabled={deletingId === errItem.id}
                  aria-label={`Delete error entry: ${errItem.question}`}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 font-medium">{errItem.question}</p>

              {errItem.fix && (
                <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Fix: {errItem.fix}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
