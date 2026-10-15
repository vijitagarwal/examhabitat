import type { ExamConfig, SectionAttempt } from './types';

export const clatConfig: ExamConfig = {
  id: 'clat',
  stage: 'unified',
  name: 'CLAT',
  fullName: 'Common Law Admission Test',
  emoji: '⚖️',
  primaryColor: 'oklch(0.70 0.18 35)',   // Coral
  secondaryColor: 'oklch(0.80 0.16 75)', // Gold
  examDate: new Date('2026-12-06T14:00:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2026-07-15T00:00:00+05:30'),
  registrationEnd: new Date('2026-11-03T00:00:00+05:30'),
  deadlines: [
    {
      title: 'Consortium Registration Portal Opens',
      date: new Date('2026-07-15T10:00:00+05:30'),
      type: 'registration',
      description: 'Online application form release on consortiumofnlus.ac.in',
    },
    {
      title: 'CLAT Application & Fee Deadline',
      date: new Date('2026-11-03T23:59:00+05:30'),
      type: 'registration',
      description: 'Final cutoff date for registration and NLU preference list submission',
    },
    {
      title: 'Admit Card Download Window',
      date: new Date('2026-11-20T10:00:00+05:30'),
      type: 'admit_card',
      description: 'Download admit card with test center details',
    },
    {
      title: 'CLAT 2026 Exam Day',
      date: new Date('2026-12-06T14:00:00+05:30'),
      type: 'exam',
      description: 'Pen-and-paper OMR exam (14:00 - 16:00 IST)',
    },
    {
      title: 'Provisional Answer Key Release',
      date: new Date('2026-12-07T10:00:00+05:30'),
      type: 'result',
      description: 'Provisional key display & objection portal',
    },
    {
      title: 'Final Rank List & Allotment Counseling',
      date: new Date('2026-12-20T12:00:00+05:30'),
      type: 'result',
      description: 'AIR publication & NLU counseling seat allotment rounds',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Legal Principles & Reading Speed Foundations',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-08-31T00:00:00+05:30'),
      description: 'Master Torts, Contracts, Criminal Law concepts, GK compilations, high speed reading.',
    },
    {
      label: 'Phase 2: Passage-Based Mock Marathon',
      startDate: new Date('2026-09-01T00:00:00+05:30'),
      endDate: new Date('2026-12-06T00:00:00+05:30'),
      description: '2-hour timed passage mock tests, accuracy enhancement, legal aptitude drills.',
    },
  ],
  sections: [
    {
      code: 'Legal',
      name: 'Legal Reasoning',
      maxQuestions: 32,
      maxMarks: 32,
      questionTypes: [
        { id: 'standard', label: 'Passage Question', correctMarks: 1, incorrectMarks: -0.25, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Logical',
      name: 'Logical Reasoning',
      maxQuestions: 24,
      maxMarks: 24,
      questionTypes: [
        { id: 'standard', label: 'Passage Question', correctMarks: 1, incorrectMarks: -0.25, allowsPartialMarking: false },
      ],
    },
    {
      code: 'English',
      name: 'English Language',
      maxQuestions: 24,
      maxMarks: 24,
      questionTypes: [
        { id: 'standard', label: 'Passage Question', correctMarks: 1, incorrectMarks: -0.25, allowsPartialMarking: false },
      ],
    },
    {
      code: 'GK',
      name: 'Current Affairs & General Knowledge',
      maxQuestions: 28,
      maxMarks: 28,
      questionTypes: [
        { id: 'standard', label: 'Passage Question', correctMarks: 1, incorrectMarks: -0.25, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Quant',
      name: 'Quantitative Techniques',
      maxQuestions: 12,
      maxMarks: 12,
      questionTypes: [
        { id: 'standard', label: 'Caselet Question', correctMarks: 1, incorrectMarks: -0.25, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 120,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const score = (attempt.correct * 1.0) - ((attempt.attempts - attempt.correct) * 0.25);
      return total + score;
    }, 0);
  },
  scoringDescription: '+1 for correct, -0.25 for incorrect',
  targetInstitutionLabel: 'Target NLU (NLSIU Bengaluru / NALSAR Hyderabad / WBNUJS Kolkata)',
  targetScoreLabel: 'Target Score (e.g. 95+ / 120)',
  mockCategories: ['LEGAL_EDGE', 'CAREER_LAUNCHER', 'IMS_LAW', 'CLAT_PYQ'],
  defaultTopics: [
    // LEGAL REASONING
    { section: 'Legal', topic_name: 'Law of Torts — Negligence, Nuisance, Defamation & Strict Liability' },
    { section: 'Legal', topic_name: 'Law of Contracts — Offer, Acceptance, Consideration & Void Agreements' },
    { section: 'Legal', topic_name: 'Criminal Law — Bharatiya Nyaya Sanhita (IPC) Principles & Offenses' },
    { section: 'Legal', topic_name: 'Constitutional Law — Fundamental Rights, Writs & Constitutional Amendments' },
    { section: 'Legal', topic_name: 'Family Law & Intellectual Property Rights (IPR)' },
    { section: 'Legal', topic_name: 'International Law & Environmental Law Principles' },
    { section: 'Legal', topic_name: 'Recent Supreme Court Landmark Judgments & Legal Current Affairs' },

    // LOGICAL REASONING
    { section: 'Logical', topic_name: 'Critical Reasoning — Identifying Arguments, Premises & Conclusions' },
    { section: 'Logical', topic_name: 'Critical Reasoning — Assumptions, Weakening & Strengthening Arguments' },
    { section: 'Logical', topic_name: 'Critical Reasoning — Inferences, Parallel Reasoning & Paradoxes' },
    { section: 'Logical', topic_name: 'Analytical Reasoning — Puzzles, Seating Arrangements & Sequences' },

    // ENGLISH LANGUAGE
    { section: 'English', topic_name: 'Reading Comprehension — Contemporary & Historical Literary Passages' },
    { section: 'English', topic_name: 'Vocabulary in Context & Idiomatic Expressions' },
    { section: 'English', topic_name: 'Grammar — Subject-Verb Agreement, Tenses & Modifier Errors' },

    // CURRENT AFFAIRS & GK
    { section: 'GK', topic_name: 'National & International Contemporary Current Affairs (Last 12 Months)' },
    { section: 'GK', topic_name: 'Legal & Judicial Current Affairs' },
    { section: 'GK', topic_name: 'Government Schemes, Summits & International Treaties' },
    { section: 'GK', topic_name: 'Static GK — History, Geography, Environment & Art/Culture' },

    // QUANTITATIVE TECHNIQUES
    { section: 'Quant', topic_name: 'Caselet-based Data Interpretation' },
    { section: 'Quant', topic_name: 'Percentages, Profit & Loss, Simple/Compound Interest' },
    { section: 'Quant', topic_name: 'Ratio, Proportion, Averages & Mixtures' },
    { section: 'Quant', topic_name: 'Mensuration 2D/3D & Time, Speed, Work' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'CLAT Reading Speed Strategy',
        description: 'CLAT has ~4500 words to read in 120 minutes. Speed is paramount.',
        keyTactics: ['Target 300+ wpm reading speed with 80% comprehension.', 'Strict 25 mins per major passage section.'],
      },
    ],
    scoreStrategies: [
      { targetPercentile: 'NLSIU Bengaluru (Top 50 Rank)', targetScore: '95+ / 120', notes: 'Legal 28+, Logical 20+, GK 22+, English 20+, Quant 8+' },
      { targetPercentile: 'Top 5 NLU Call', targetScore: '85+ / 120', notes: 'Solid accuracy across all sections' },
    ],
    contingencies: [
      { scenario: 'Passage length is exceptionally long', trigger: 'Reading time per passage exceeds 3.5 mins', action: 'Skim principle first, read question options, then locate specific evidence in passage.' },
    ],
    standingOrders: ['Daily reading of Hindu Legal Columns & LiveLaw updates.'],
  },
};
