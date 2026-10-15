export type ExamId = 'cat' | 'neet' | 'jee_main' | 'jee_adv' | 'upsc' | 'gate' | 'clat';

export type ExamStage = 'unified' | 'prelims' | 'mains';

export type TopicStatus = 'Not Started' | 'In Progress' | 'Revised' | 'Mastered';

export interface QuestionType {
  id: string;                   // 'mcq', '1-mark', '2-mark', 'msq', 'numerical'
  label: string;                // e.g. '1-Mark MCQ', '2-Mark MCQ'
  correctMarks: number;         // e.g. 1, 2, 3, 4
  incorrectMarks: number;       // e.g. -0.33, -0.66, -1 (negative numbers)
  allowsPartialMarking: boolean;
}

export interface SectionAttempt {
  section: string;        // section code e.g. 'VARC'
  questionTypeId: string; // matches QuestionType.id in that section
  attempts: number;
  correct: number;
  score: number;          // calculated by scoringFormula
}

export interface ExamSection {
  code: string;            // 'VARC', 'Physics', 'GS-I'
  name: string;            // full display name
  maxQuestions: number;
  maxMarks: number;
  questionTypes: QuestionType[];  // length=1 for simple exams; >1 for GATE/JEE Adv
}

export interface ExamPhase {
  label: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface ExamDeadline {
  title: string;
  date: Date;
  type: 'registration' | 'correction' | 'admit_card' | 'exam' | 'result';
  description: string;
}

export interface ScoreStrategyRow {
  targetPercentile: string;
  targetScore: string;
  varcScore?: string;
  dilrScore?: string;
  qaScore?: string;
  notes: string;
}

export interface ContingencyPlan {
  scenario: string;
  trigger: string;
  action: string;
}

export interface ExamStrategyContent {
  sections: {
    title: string;
    description: string;
    keyTactics: string[];
  }[];
  scoreStrategies: ScoreStrategyRow[];
  contingencies: ContingencyPlan[];
  standingOrders: string[];
}

export interface ExamConfig {
  id: ExamId;
  stage: ExamStage;
  name: string;           // 'CAT', 'NEET UG'
  fullName: string;       // 'Common Admission Test'
  emoji: string;
  primaryColor: string;   // OKLCH string e.g. 'oklch(0.80 0.17 75)'
  secondaryColor: string; // OKLCH string e.g. 'oklch(0.68 0.16 185)'
  examDate: Date;
  campaignStart: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  deadlines: ExamDeadline[];
  phases: ExamPhase[];
  sections: ExamSection[];
  totalMaxMarks: number;
  scoringFormula: (sectionAttempts: SectionAttempt[]) => number;
  scoringDescription: string;   // '+4 / -1 per question'
  targetInstitutionLabel: string;
  targetScoreLabel: string;
  mockCategories: string[];
  defaultTopics: { section: string; topic_name: string; subtopics?: string[] }[];
  strategyContent: ExamStrategyContent;
}

export const STATUS_ORDER: TopicStatus[] = [
  'Not Started',
  'In Progress',
  'Revised',
  'Mastered',
];

export const STATUS_COLORS: Record<TopicStatus, { bg: string; text: string; border: string }> = {
  'Not Started': { bg: 'bg-zinc-800/50', text: 'text-zinc-400', border: 'border-zinc-700/50' },
  'In Progress': { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-800/50' },
  'Revised': { bg: 'bg-blue-950/50', text: 'text-blue-400', border: 'border-blue-800/50' },
  'Mastered': { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-800/50' },
};
