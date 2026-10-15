import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExamConfig, SectionAttempt } from '@/lib/exams';
import { validateMockAttempts } from '@/lib/exams/validation';
import { supabase } from '@/integrations/supabase/client';
import { useExamToast } from '../bridge/useExamToast';
import { Trophy, Plus, TrendingUp, Calendar, CheckCircle2, BarChart2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MockTrackerProps {
  examConfig: ExamConfig;
}

interface MockRecord {
  id: string;
  exam_id: string;
  date: string;
  test_name: string;
  sections: SectionAttempt[];
  total_score: number;
  max_score: number;
  percentile?: number;
  notes?: string;
  created_at: string;
}

export function MockTracker({ examConfig }: MockTrackerProps) {
  const [mocks, setMocks] = useState<MockRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useExamToast();

  // Form State
  const [testName, setTestName] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [percentile, setPercentile] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Initial Section Attempts based on Exam Config questionTypes
  const [sectionAttempts, setSectionAttempts] = useState<SectionAttempt[]>(() => {
    const attemptsList: SectionAttempt[] = [];
    examConfig.sections.forEach((sec) => {
      sec.questionTypes.forEach((qt) => {
        attemptsList.push({
          section: sec.code,
          questionTypeId: qt.id,
          attempts: 0,
          correct: 0,
          score: 0,
        });
      });
    });
    return attemptsList;
  });

  // 1. Fetch Mocks
  const loadMocks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setLoading(false);
        toast('You must be signed in to load mock tests.', { type: 'error' });
        return;
      }

      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('exam_id', examConfig.id)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }
      if (data) {
        setMocks(data as MockRecord[]);
      }
    } catch (err) {
      console.warn('Failed to load mocks:', err);
      toast('Unable to load mock tests.', {
        description: 'Please refresh the page and try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [examConfig.id, toast]);

  useEffect(() => {
    loadMocks();
  }, [loadMocks]);

  // Live Score Calculation as user types in form
  const liveTotalScore = examConfig.scoringFormula(sectionAttempts);

  const handleUpdateAttempt = (sectionCode: string, questionTypeId: string, field: 'attempts' | 'correct', val: number) => {
    const sanitizedVal = Math.max(0, val);
    setSectionAttempts((prev) =>
      prev.map((item) => {
        if (item.section === sectionCode && item.questionTypeId === questionTypeId) {
          const updated = { ...item, [field]: sanitizedVal };
          // Ensure correct cannot exceed attempts
          if (field === 'attempts' && updated.correct > sanitizedVal) {
            updated.correct = sanitizedVal;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSaveMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!testName.trim()) {
      toast('Enter a test name before saving.', { type: 'error' });
      return;
    }

    const parsedPercentile = percentile ? Number(percentile) : null;
    const validationError = validateMockAttempts(examConfig, sectionAttempts, parsedPercentile);
    if (validationError) {
      toast('Mock result could not be saved.', {
        description: validationError,
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        toast('You must be signed in to save a mock.', { type: 'error' });
        return;
      }

      const payload = {
        user_id: session.user.id,
        exam_id: examConfig.id,
        date: testDate,
        test_name: testName.trim(),
        sections: sectionAttempts,
        total_score: liveTotalScore,
        max_score: examConfig.totalMaxMarks,
        percentile: parsedPercentile,
        notes: notes.trim() || null,
      };

      const { data: saved, error } = await supabase
        .from('mock_tests')
        .insert(payload)
        .select('*')
        .single();

      if (error || !saved) {
        throw error ?? new Error('Mock result was not returned after saving.');
      }
      setMocks((prev) => [...prev, saved as MockRecord]);
      setShowAddForm(false);
      setTestName('');
      setPercentile('');
      setNotes('');
      toast('Mock result saved.', { type: 'success' });
    } catch (err) {
      console.error('Error saving mock test:', err);
      toast('Unable to save this mock result.', {
        description: 'No result was added. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare chart data
  const chartData = mocks.map((m, index) => ({
    name: m.test_name || `Mock #${index + 1}`,
    score: m.total_score,
    maxScore: m.max_score,
    date: m.date,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            {examConfig.name} Mock Test Analyzer
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Log mock scores, analyze sectional performance, and track your score trend line.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Log New Mock'}
        </button>
      </div>

      {/* Add Mock Modal / Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveMock}
            className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 overflow-hidden"
          >
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Log Mock Test Performance</h3>
              <div className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                Calculated Score: {liveTotalScore} / {examConfig.totalMaxMarks}
              </div>
            </div>

            {/* Test Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIMCAT 12 / Allen Major 3"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Test Date</label>
                <input
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Percentile (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 98.5"
                  value={percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Sectional Attempts Form */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sectional Inputs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {examConfig.sections.map((sec) => {
                  return sec.questionTypes.map((qt) => {
                    const attempt = sectionAttempts.find((sa) => sa.section === sec.code && sa.questionTypeId === qt.id);
                    return (
                      <div key={`${sec.code}-${qt.id}`} className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-white">{sec.code}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">{qt.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Attempts</label>
                            <input
                              type="number"
                              min="0"
                              max={sec.maxQuestions}
                              value={attempt?.attempts || 0}
                              onChange={(e) => handleUpdateAttempt(sec.code, qt.id, 'attempts', parseInt(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Correct</label>
                            <input
                              type="number"
                              min="0"
                              max={attempt?.attempts || sec.maxQuestions}
                              value={attempt?.correct || 0}
                              onChange={(e) => handleUpdateAttempt(sec.code, qt.id, 'correct', parseInt(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 text-center font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Key Learnings & Notes</label>
              <textarea
                rows={2}
                placeholder="What went well? Where were silly mistakes made?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
            {isSaving ? 'Saving Mock Test Result...' : 'Save Mock Test Result'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Score Trend Chart */}
      {chartData.length > 0 && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Score Progression Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} domain={[0, examConfig.totalMaxMarks]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--exam-primary, #f59e0b)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History Table */}
      {mocks.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-8">
          <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No mock tests logged yet for {examConfig.name}.</p>
          <p className="text-xs text-zinc-500 mt-1">Click "Log New Mock" above to record your first score!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Test Name</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Score</th>
                <th className="p-3.5 text-right">Max</th>
                <th className="p-3.5 text-right">Percentile</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {mocks.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-900/80 transition-colors">
                  <td className="p-3.5 font-bold text-white">{m.test_name}</td>
                  <td className="p-3.5 font-mono text-zinc-400">{m.date}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-amber-400">{m.total_score}</td>
                  <td className="p-3.5 text-right font-mono text-zinc-500">{m.max_score}</td>
                  <td className="p-3.5 text-right font-mono text-emerald-400">{m.percentile ? `${m.percentile}%ile` : '—'}</td>
                  <td className="p-3.5 text-zinc-400 truncate max-w-xs">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
