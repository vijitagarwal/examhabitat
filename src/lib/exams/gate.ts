import type { ExamConfig, SectionAttempt } from './types';

export const gateConfig: ExamConfig = {
  id: 'gate',
  stage: 'unified',
  name: 'GATE',
  fullName: 'Graduate Aptitude Test in Engineering',
  emoji: '⚙️',
  primaryColor: 'oklch(0.65 0.20 305)',   // Violet
  secondaryColor: 'oklch(0.55 0.06 240)', // Slate
  examDate: new Date('2027-02-13T09:30:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2026-08-30T00:00:00+05:30'),
  registrationEnd: new Date('2026-09-30T00:00:00+05:30'),
  deadlines: [
    {
      title: 'Online Application Portal (GOAPS) Opens',
      date: new Date('2026-08-30T10:00:00+05:30'),
      type: 'registration',
      description: 'Registration opens on official GOAPS portal',
    },
    {
      title: 'Regular Registration Deadline',
      date: new Date('2026-09-30T23:59:00+05:30'),
      type: 'registration',
      description: 'Closing date for regular fee payment',
    },
    {
      title: 'Extended Registration Window (With Late Fee)',
      date: new Date('2026-10-07T23:59:00+05:30'),
      type: 'registration',
      description: 'Final cutoff date with extended late fee',
    },
    {
      title: 'Admit Card Download Release',
      date: new Date('2027-01-03T10:00:00+05:30'),
      type: 'admit_card',
      description: 'Download admit card with test center and shift allocation',
    },
    {
      title: 'GATE 2027 Exam Days',
      date: new Date('2027-02-13T09:30:00+05:30'),
      type: 'exam',
      description: 'Computer Based Test across test centers nationwide',
    },
    {
      title: 'Official Answer Key & Candidate Responses',
      date: new Date('2027-02-22T17:00:00+05:30'),
      type: 'result',
      description: 'Candidate response sheet display & answer key challenge window',
    },
    {
      title: 'GATE Scorecard & AIR Result Declaration',
      date: new Date('2027-03-19T17:00:00+05:30'),
      type: 'result',
      description: 'Official scorecards download on GOAPS & COAP PSU recruitment registration',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Core Subject Foundations & Engineering Math',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-10-31T00:00:00+05:30'),
      description: 'Master core discipline subjects, virtual calculator speed, and Engg Math.',
    },
    {
      label: 'Phase 2: Subject Tests & Full Mock Grind',
      startDate: new Date('2026-11-01T00:00:00+05:30'),
      endDate: new Date('2027-02-14T00:00:00+05:30'),
      description: 'Full 3-hour GATE CBT mocks, NAT numerical practice, PYQ solving.',
    },
  ],
  sections: [
    {
      code: 'CoreEngg',
      name: 'Core Computer Science & Engineering',
      maxQuestions: 45,
      maxMarks: 70,
      questionTypes: [
        { id: '1-mark', label: '1-Mark Question', correctMarks: 1.0, incorrectMarks: -0.33, allowsPartialMarking: false },
        { id: '2-mark', label: '2-Mark Question', correctMarks: 2.0, incorrectMarks: -0.66, allowsPartialMarking: false },
      ],
    },
    {
      code: 'EnggMath',
      name: 'Engineering Mathematics',
      maxQuestions: 10,
      maxMarks: 15,
      questionTypes: [
        { id: '1-mark', label: '1-Mark Question', correctMarks: 1.0, incorrectMarks: -0.33, allowsPartialMarking: false },
        { id: '2-mark', label: '2-Mark Question', correctMarks: 2.0, incorrectMarks: -0.66, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Aptitude',
      name: 'General Aptitude',
      maxQuestions: 10,
      maxMarks: 15,
      questionTypes: [
        { id: '1-mark', label: '1-Mark Question', correctMarks: 1.0, incorrectMarks: -0.33, allowsPartialMarking: false },
        { id: '2-mark', label: '2-Mark Question', correctMarks: 2.0, incorrectMarks: -0.66, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 100,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const is1Mark = attempt.questionTypeId === '1-mark';
      const markPerCorrect = is1Mark ? 1.0 : 2.0;
      const markPerWrong = is1Mark ? -0.33 : -0.66;
      const score = (attempt.correct * markPerCorrect) + ((attempt.attempts - attempt.correct) * markPerWrong);
      return total + score;
    }, 0);
  },
  scoringDescription: '1-Mark (+1/-0.33), 2-Mark (+2/-0.66), NAT has no negative marking',
  targetInstitutionLabel: 'Target IISc / IIT / PSU (IOCL, ONGC, NTPC)',
  targetScoreLabel: 'Target GATE Marks / Rank (e.g. 75+ / 100)',
  mockCategories: ['MADE_EASY', 'ACE_ACADEMY', 'GATE_FORUM', 'GATE_PYQ'],
  defaultTopics: [
    // CORE COMPUTER SCIENCE / ENGG
    { section: 'CoreEngg', topic_name: 'Digital Logic — Boolean Algebra, Combinational & Sequential Circuits' },
    { section: 'CoreEngg', topic_name: 'Computer Organization & Architecture — Machine Instructions, Pipelining & Memory Hierarchy' },
    { section: 'CoreEngg', topic_name: 'Programming & Data Structures — Arrays, Stacks, Queues, Trees, Binary Search Trees & Heaps' },
    { section: 'CoreEngg', topic_name: 'Algorithms — Searching, Sorting, Asymptotic Analysis, Dynamic Programming & Graph Algorithms' },
    { section: 'CoreEngg', topic_name: 'Theory of Computation — Regular Expressions, DFA/NFA, Context-Free Grammars & Turing Machines' },
    { section: 'CoreEngg', topic_name: 'Compiler Design — Lexical Analysis, Parsing, Syntax Directed Translation & Intermediate Code' },
    { section: 'CoreEngg', topic_name: 'Operating Systems — Process Management, Threads, CPU Scheduling, Deadlocks & Virtual Memory' },
    { section: 'CoreEngg', topic_name: 'Database Management Systems — ER-Model, Relational Algebra, SQL, Normalisation & Transactions (ACID)' },
    { section: 'CoreEngg', topic_name: 'Computer Networks — ISO/OSI & TCP/IP Stack, IP Addressing, Routing Algorithms & Congestion Control' },

    // ENGINEERING MATHEMATICS
    { section: 'EnggMath', topic_name: 'Discrete Mathematics — Propositional Logic, Sets, Relations, Functions & Combinatorics' },
    { section: 'EnggMath', topic_name: 'Graph Theory — Connectivity, Coloring, Isomorphism & Spanning Trees' },
    { section: 'EnggMath', topic_name: 'Linear Algebra — Matrices, Determinants, Systems of Equations & Eigenvalues/Eigenvectors' },
    { section: 'EnggMath', topic_name: 'Calculus — Limits, Continuity, Differentiability, Mean Value Theorems & Integration' },
    { section: 'EnggMath', topic_name: 'Probability & Statistics — Random Variables, Uniform/Normal Distributions & Bayes Theorem' },

    // GENERAL APTITUDE
    { section: 'Aptitude', topic_name: 'Verbal Aptitude — Vocabulary, Grammar, Reading Comprehension & Critical Reasoning' },
    { section: 'Aptitude', topic_name: 'Quantitative Aptitude — Data Interpretation, Geometry, Mensuration & Numeracy' },
    { section: 'Aptitude', topic_name: 'Analytical & Spatial Aptitude — Pattern Recognition, Folding & Spatial Reasoning' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'GATE Scoring Strategy',
        description: 'General Aptitude (15m) + Engg Math (15m) are high-scoring foundations.',
        keyTactics: ['Secure 25+ out of 30 in Aptitude + Math.', 'Practice extensively with TCS virtual calculator.'],
      },
    ],
    scoreStrategies: [
      { targetPercentile: 'Top 100 Rank (PSU / IISc)', targetScore: '75+ / 100', notes: 'High accuracy in 2-mark questions' },
      { targetPercentile: 'Top 500 Rank (IIT M.Tech)', targetScore: '65+ / 100', notes: 'Solid performance across core subjects' },
    ],
    contingencies: [
      { scenario: 'TCS Virtual calculator misclicks', trigger: 'Silly calculation error detected in review', action: 'Always type numbers using keypad and re-verify NAT calculations once.' },
    ],
    standingOrders: ['Daily practice of 15 NAT (Numerical Answer Type) questions.'],
  },
};
