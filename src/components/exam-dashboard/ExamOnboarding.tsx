import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllExams, type ExamConfig, type ExamId } from '@/lib/exams';
import { Check, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

interface ExamOnboardingProps {
  isOpen: boolean;
  currentExamId: ExamId;
  onSelectExam: (examId: ExamId) => Promise<void>;
  onClose?: () => void;
}

export function ExamOnboarding({
  isOpen,
  currentExamId,
  onSelectExam,
  onClose,
}: ExamOnboardingProps) {
  const [selectedId, setSelectedId] = useState<ExamId>(currentExamId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const exams = getAllExams();

  React.useEffect(() => {
    setSelectedId(currentExamId);
  }, [currentExamId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSelectExam(selectedId);
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to set target exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/90 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-zinc-800/60 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to ExamHabitat
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Select Your Target Exam
            </h1>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
              Your entire workspace — theme colors, countdown ring, topic tracker, mock analyzer, and study strategies — will dynamically adapt to your exam.
            </p>
          </div>

          {/* Exam Grid */}
          <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam: ExamConfig) => {
              const isSelected = selectedId === exam.id;
              return (
                <motion.button
                  key={exam.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedId(exam.id)}
                  type="button"
                  className={`relative text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    {/* Header: Emoji + Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50">
                        {exam.emoji}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {exam.name}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {exam.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-zinc-300 mb-4">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Max Score:</span>
                        <span className="font-mono font-medium text-white">{exam.totalMaxMarks} Marks</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Scoring:</span>
                        <span className="font-medium text-zinc-300">{exam.scoringDescription}</span>
                      </div>
                    </div>

                    {/* Section Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {exam.sections.map((sec) => (
                        <span
                          key={sec.code}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/40"
                        >
                          {sec.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Strip at bottom */}
                  <div
                    className="h-1.5 w-full rounded-full mt-4 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, ${exam.primaryColor}, ${exam.secondaryColor})`,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-zinc-800/80 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              You can switch your target exam anytime from your Profile settings.
            </p>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Configuring Dashboard...' : 'Confirm Target Exam'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
