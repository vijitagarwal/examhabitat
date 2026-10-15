import type { ExamConfig, SectionAttempt } from './types';

export const catConfig: ExamConfig = {
  id: 'cat',
  stage: 'unified',
  name: 'CAT',
  fullName: 'Common Admission Test',
  emoji: '🐅',
  primaryColor: 'oklch(0.80 0.17 75)',    // Amber
  secondaryColor: 'oklch(0.68 0.16 185)',  // Teal
  examDate: new Date('2026-11-29T00:00:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2026-08-01T00:00:00+05:30'),
  registrationEnd: new Date('2026-09-20T00:00:00+05:30'),
  deadlines: [
    {
      title: 'Registration Window Opens',
      date: new Date('2026-08-01T10:00:00+05:30'),
      type: 'registration',
      description: 'Official CAT registration opens on iimcat.ac.in',
    },
    {
      title: 'Registration Deadline',
      date: new Date('2026-09-20T17:00:00+05:30'),
      type: 'registration',
      description: 'Final date for filling application form & fee payment',
    },
    {
      title: 'Admit Card Release',
      date: new Date('2026-10-25T17:00:00+05:30'),
      type: 'admit_card',
      description: 'Download admit card with assigned test slot & city',
    },
    {
      title: 'CAT 2026 Exam Day',
      date: new Date('2026-11-29T08:30:00+05:30'),
      type: 'exam',
      description: 'Official test across 3 slots nation-wide',
    },
    {
      title: 'Results & Percentiles Declaration',
      date: new Date('2027-01-10T12:00:00+05:30'),
      type: 'result',
      description: 'Scorecard release & IIM shortlist calls begin',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Concept Mastery & Topic Tests',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-07-31T00:00:00+05:30'),
      description: 'Master core arithmetic, algebra, VARC accuracy, and DILR set types.',
    },
    {
      label: 'Phase 2: Timed Sectionals & Speed Building',
      startDate: new Date('2026-08-01T00:00:00+05:30'),
      endDate: new Date('2026-09-30T00:00:00+05:30'),
      description: 'Timed sectional practice, weak area remediation, speed building.',
    },
    {
      label: 'Phase 3: Full Mock Grind & Strategy Taper',
      startDate: new Date('2026-10-01T00:00:00+05:30'),
      endDate: new Date('2026-11-29T00:00:00+05:30'),
      description: '2 mocks/week, detailed error log analysis, exam strategy execution.',
    },
  ],
  sections: [
    {
      code: 'VARC',
      name: 'Verbal Ability & Reading Comprehension',
      maxQuestions: 24,
      maxMarks: 72,
      questionTypes: [
        {
          id: 'standard',
          label: 'Standard Question',
          correctMarks: 3,
          incorrectMarks: -1,
          allowsPartialMarking: false,
        },
      ],
    },
    {
      code: 'DILR',
      name: 'Data Interpretation & Logical Reasoning',
      maxQuestions: 20,
      maxMarks: 60,
      questionTypes: [
        {
          id: 'standard',
          label: 'Standard Question',
          correctMarks: 3,
          incorrectMarks: -1,
          allowsPartialMarking: false,
        },
      ],
    },
    {
      code: 'QA',
      name: 'Quantitative Ability',
      maxQuestions: 22,
      maxMarks: 66,
      questionTypes: [
        {
          id: 'standard',
          label: 'Standard Question',
          correctMarks: 3,
          incorrectMarks: -1,
          allowsPartialMarking: false,
        },
      ],
    },
  ],
  totalMaxMarks: 198,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const score = (attempt.correct * 3) - ((attempt.attempts - attempt.correct) * 1);
      return total + score;
    }, 0);
  },
  scoringDescription: '+3 for correct, -1 for incorrect',
  targetInstitutionLabel: 'Target IIM / B-School',
  targetScoreLabel: 'Target Score / Percentile',
  mockCategories: ['SIMCAT', 'AIMCAT', 'CL PRIME', 'CRACKU', 'PREVIOUS_YEAR'],
  defaultTopics: [
    // VARC
    { section: 'VARC', topic_name: 'RC — Philosophy & Psychology Passages' },
    { section: 'VARC', topic_name: 'RC — Economics, Business & Finance' },
    { section: 'VARC', topic_name: 'RC — Science, Technology & Environment' },
    { section: 'VARC', topic_name: 'RC — History, Art & Sociology' },
    { section: 'VARC', topic_name: 'Para Jumbles (TCTA & MCQ)' },
    { section: 'VARC', topic_name: 'Para Summary' },
    { section: 'VARC', topic_name: 'Para Completion / Odd Sentence Out' },
    { section: 'VARC', topic_name: 'Critical Reasoning & Inference' },

    // DILR
    { section: 'DILR', topic_name: 'Arrangements — Linear, Circular & Complex' },
    { section: 'DILR', topic_name: 'Matrix & Grid Puzzles' },
    { section: 'DILR', topic_name: 'Games & Tournaments (Knockout, Round-Robin)' },
    { section: 'DILR', topic_name: 'Networks, Routes & Flow Diagrams' },
    { section: 'DILR', topic_name: 'Venn Diagrams (3 & 4 Sets, Max/Min)' },
    { section: 'DILR', topic_name: 'Selection & Grouping' },
    { section: 'DILR', topic_name: 'Quant-Based Reasoning (Costing, Optimization)' },
    { section: 'DILR', topic_name: 'Scheduling, Timetables & Project Management' },
    { section: 'DILR', topic_name: 'Tables & Caselets' },
    { section: 'DILR', topic_name: 'Bar Charts, Line Graphs & Pie Charts' },
    { section: 'DILR', topic_name: 'Scatter Plots, Radar Charts & Bubble Diagrams' },
    { section: 'DILR', topic_name: 'Missing Data & Data Sufficiency' },
    { section: 'DILR', topic_name: 'Binary Logic & Truth-Tellers' },
    { section: 'DILR', topic_name: 'Cubes, Cuts & Geometric Reasoning' },

    // QA
    { section: 'QA', topic_name: 'Percentages, Profit & Loss' },
    { section: 'QA', topic_name: 'Ratio, Proportion & Variations' },
    { section: 'QA', topic_name: 'Averages, Mixtures & Alligations' },
    { section: 'QA', topic_name: 'Time, Speed & Distance (Races, Escalators, Circular Tracks)' },
    { section: 'QA', topic_name: 'Time & Work (Pipes, Cisterns & Efficiency)' },
    { section: 'QA', topic_name: 'Simple & Compound Interest, Installments' },
    { section: 'QA', topic_name: 'Linear Equations & Polynomials' },
    { section: 'QA', topic_name: 'Quadratic Equations & Higher Degree Polynomials' },
    { section: 'QA', topic_name: 'Inequalities & Absolute Value (Modulus)' },
    { section: 'QA', topic_name: 'Functions, Graphs & Transformations' },
    { section: 'QA', topic_name: 'Logarithms & Exponents' },
    { section: 'QA', topic_name: 'Sequences & Series (AP, GP, HP, AGP, Special Series)' },
    { section: 'QA', topic_name: 'Number System — Divisibility, Units & Remainder Theorems' },
    { section: 'QA', topic_name: 'Number System — Factors, Multiples & LCM/HCF' },
    { section: 'QA', topic_name: 'Number System — Base Systems & Factorials' },
    { section: 'QA', topic_name: 'Triangles, Circles & Polygons (Plane Geometry)' },
    { section: 'QA', topic_name: 'Mensuration (2D & 3D Solids)' },
    { section: 'QA', topic_name: 'Coordinate Geometry & Straight Lines' },
    { section: 'QA', topic_name: 'Trigonometry & Heights/Distances' },
    { section: 'QA', topic_name: 'Permutations & Combinations' },
    { section: 'QA', topic_name: 'Probability & Conditional Probability' },
    { section: 'QA', topic_name: 'Set Theory & Venn Diagrams (Quant)' },
    { section: 'QA', topic_name: 'Matrices & Determinants' },
    { section: 'QA', topic_name: 'Special Equations & Diophantine Equations' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'VARC Strategy',
        description: 'Accuracy over attempts. Aim for 3 RC sets (12 questions) + 4 Para-jumbles/summaries.',
        keyTactics: [
          'Read passage fully in 2.5 mins before looking at questions.',
          'Eliminate options with extreme words (always, never, completely).',
          'Solve Para Summary and Odd Sentence Out first (high accuracy rate).',
        ],
      },
      {
        title: 'DILR Strategy',
        description: 'Set selection determines 80% of your score. 8-10 mins initial scanning is essential.',
        keyTactics: [
          'Spend first 5 minutes scanning all 4 sets and ranking them 1 to 4.',
          'Solve Set #1 completely before touching Set #2.',
          'If stuck >4 mins on a step, move on immediately — do not get anchor-trapped.',
        ],
      },
      {
        title: 'QA Strategy',
        description: 'Three-pass strategy: Round 1 (sitters <1 min), Round 2 (doable 2-3 mins), Round 3 (tough).',
        keyTactics: [
          'Arithmetic + Algebra account for ~65% of the section.',
          'Use option substitution and estimation wherever possible.',
          'Never spend >3 mins on any single question.',
        ],
      },
    ],
    scoreStrategies: [
      { targetPercentile: '99+%ile', targetScore: '100+ / 198', varcScore: '40+', dilrScore: '30+', qaScore: '32+', notes: 'Aim for 35+ total correct with <8 errors' },
      { targetPercentile: '95+%ile', targetScore: '75+ / 198', varcScore: '30+', dilrScore: '22+', qaScore: '23+', notes: 'Solid overall performance across all 3 sections' },
      { targetPercentile: '90+%ile', targetScore: '60+ / 198', varcScore: '24+', dilrScore: '18+', qaScore: '18+', notes: 'Sufficient for sectional cutoffs at top IIMs' },
    ],
    contingencies: [
      { scenario: 'VARC passage is extremely obscure', trigger: 'Reading speed drops <100 wpm on passage 1', action: 'Switch immediately to Para-jumbles and Para-summaries, then attempt easiest 2 RCs.' },
      { scenario: 'DILR Set 1 collapses midway', trigger: '10 mins spent with no solid grid filled', action: 'Abandon set 1 immediately. Pick the easiest pure DI table/chart set to secure base score.' },
    ],
    standingOrders: [
      'Log error log within 2 hours of completing every mock test.',
      'Maintain minimum 1 RC passage and 1 DILR set daily without exception.',
      'Review formulas and shortcut notes every Sunday evening.',
    ],
  },
};
