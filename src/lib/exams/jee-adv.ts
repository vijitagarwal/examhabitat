import type { ExamConfig, SectionAttempt } from './types';

export const jeeAdvConfig: ExamConfig = {
  id: 'jee_adv',
  stage: 'unified',
  name: 'JEE Advanced',
  fullName: 'Joint Entrance Examination (Advanced)',
  emoji: '🏆',
  primaryColor: 'oklch(0.58 0.22 280)',   // Indigo
  secondaryColor: 'oklch(0.82 0.18 85)',   // Gold
  examDate: new Date('2027-05-23T09:00:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2027-04-25T00:00:00+05:30'),
  registrationEnd: new Date('2027-05-05T00:00:00+05:30'),
  deadlines: [
    {
      title: 'Online Portal Registration Opens',
      date: new Date('2027-04-25T10:00:00+05:30'),
      type: 'registration',
      description: 'JEE Main top 2,500,000 rankers register on jeeadv.ac.in',
    },
    {
      title: 'Registration & Fee Payment Closing',
      date: new Date('2027-05-05T17:00:00+05:30'),
      type: 'registration',
      description: 'Final deadline for documents upload and exam registration',
    },
    {
      title: 'Admit Card Download',
      date: new Date('2027-05-12T10:00:00+05:30'),
      type: 'admit_card',
      description: 'Download Paper 1 and Paper 2 admit card',
    },
    {
      title: 'JEE Advanced 2027 Exam Day',
      date: new Date('2027-05-23T09:00:00+05:30'),
      type: 'exam',
      description: 'Paper 1 (09:00 - 12:00) & Paper 2 (14:30 - 17:30)',
    },
    {
      title: 'Copy of Candidate Responses Displayed',
      date: new Date('2027-05-29T17:00:00+05:30'),
      type: 'result',
      description: 'Download recorded CBT responses on candidate portal',
    },
    {
      title: 'Official Answer Keys & Final Result Declaration',
      date: new Date('2027-06-08T10:00:00+05:30'),
      type: 'result',
      description: 'Final AIR list announcement & JoSAA Counseling registration',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Advanced Concept Depth & Problem Solving',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2027-01-31T00:00:00+05:30'),
      description: 'Deep multi-concept problem solving across Physics, Chem, Math.',
    },
    {
      label: 'Phase 2: Post-Main Advanced Intensive Sprint',
      startDate: new Date('2027-02-01T00:00:00+05:30'),
      endDate: new Date('2027-05-23T00:00:00+05:30'),
      description: 'Paper 1 + Paper 2 back-to-back full day mock drills.',
    },
  ],
  sections: [
    {
      code: 'Physics',
      name: 'Physics',
      maxQuestions: 18,
      maxMarks: 60,
      questionTypes: [
        { id: 'single_mcq', label: 'Single-Correct MCQ', correctMarks: 3, incorrectMarks: -1, allowsPartialMarking: false },
        { id: 'multi_msq', label: 'Multi-Correct MSQ', correctMarks: 4, incorrectMarks: -2, allowsPartialMarking: true },
        { id: 'numerical', label: 'Numerical Value', correctMarks: 3, incorrectMarks: 0, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Chemistry',
      name: 'Chemistry',
      maxQuestions: 18,
      maxMarks: 60,
      questionTypes: [
        { id: 'single_mcq', label: 'Single-Correct MCQ', correctMarks: 3, incorrectMarks: -1, allowsPartialMarking: false },
        { id: 'multi_msq', label: 'Multi-Correct MSQ', correctMarks: 4, incorrectMarks: -2, allowsPartialMarking: true },
        { id: 'numerical', label: 'Numerical Value', correctMarks: 3, incorrectMarks: 0, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Math',
      name: 'Mathematics',
      maxQuestions: 18,
      maxMarks: 60,
      questionTypes: [
        { id: 'single_mcq', label: 'Single-Correct MCQ', correctMarks: 3, incorrectMarks: -1, allowsPartialMarking: false },
        { id: 'multi_msq', label: 'Multi-Correct MSQ', correctMarks: 4, incorrectMarks: -2, allowsPartialMarking: true },
        { id: 'numerical', label: 'Numerical Value', correctMarks: 3, incorrectMarks: 0, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 360,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      let markPerCorrect = 3;
      let markPerWrong = -1;

      if (attempt.questionTypeId === 'multi_msq') {
        markPerCorrect = 4;
        markPerWrong = -2;
      } else if (attempt.questionTypeId === 'numerical') {
        markPerCorrect = 3;
        markPerWrong = 0;
      }

      const score = (attempt.correct * markPerCorrect) + ((attempt.attempts - attempt.correct) * markPerWrong);
      return total + score;
    }, 0);
  },
  scoringDescription: 'Variable (+3/-1, +4/-2 MSQ with partial, +3/0 Numerical)',
  targetInstitutionLabel: 'Target IIT (IIT Bombay / IIT Delhi / IIT Madras)',
  targetScoreLabel: 'Target Score / Rank (e.g. AIR <500)',
  mockCategories: ['FIITJEE_AITS', 'ALLEN_SCORE', 'JEE_ADV_PYQ', 'RESONANCE_OPEN'],
  defaultTopics: [
    // PHYSICS ADVANCED
    { section: 'Physics', topic_name: 'Advanced Mechanics — Variable Mass & Rigid Rotational Dynamics' },
    { section: 'Physics', topic_name: 'Fluid Dynamics — Bernoulli, Viscosity & Surface Tension' },
    { section: 'Physics', topic_name: 'Non-linear Oscillations & Coupled Pendulums' },
    { section: 'Physics', topic_name: 'Thermodynamics — Cyclic Processes, Entropy & Heat Engines' },
    { section: 'Physics', topic_name: 'Electrostatics — Conductors, Image Charges & Dielectric Polarization' },
    { section: 'Physics', topic_name: 'Magnetism — Biot-Savart, Ampere & Magnetic Dipoles' },
    { section: 'Physics', topic_name: 'Electromagnetic Induction — Mutual Inductance & LC Oscillations' },
    { section: 'Physics', topic_name: 'Optics — Lens Combinations, Aberrations & Wave Interference' },
    { section: 'Physics', topic_name: 'Modern Physics — X-Rays, Photoelectric & Nuclear Reactions' },

    // CHEMISTRY ADVANCED
    { section: 'Chemistry', topic_name: 'Advanced Chemical Thermodynamics & Phase Equilibrium' },
    { section: 'Chemistry', topic_name: 'Electrochemistry — Nernst Equation & Concentrated Cells' },
    { section: 'Chemistry', topic_name: 'Inorganic — Qualitative Salt Analysis & Anion/Cation Tests' },
    { section: 'Chemistry', topic_name: 'Coordination Chemistry — Isomerism, CFT & Magnetism' },
    { section: 'Chemistry', topic_name: 'Metallurgy — Extraction Principles & Ellingham Diagrams' },
    { section: 'Chemistry', topic_name: 'Organic — Stereochemistry (Optical, Geometrical & Conformational)' },
    { section: 'Chemistry', topic_name: 'Organic — Reaction Mechanisms (Electrophilic, Nucleophilic, Pericyclic)' },
    { section: 'Chemistry', topic_name: 'Organic — Named Reactions & Multi-step Synthesis' },

    // MATHEMATICS ADVANCED
    { section: 'Mathematics', topic_name: 'Advanced Calculus — Definite Integrals & Reduction Formulas' },
    { section: 'Mathematics', topic_name: 'Differential Equations — Homogeneous & Exact Equations' },
    { section: 'Mathematics', topic_name: 'Complex Numbers — Geometry & Roots of Unity' },
    { section: 'Mathematics', topic_name: 'Probability — Bayes Theorem & Probability Density' },
    { section: 'Mathematics', topic_name: 'Vector Algebra & 3D Lines/Planes Intersections' },
    { section: 'Mathematics', topic_name: 'Conic Sections — Tangents, Normals & Loci Problems' },
    { section: 'Mathematics', topic_name: 'Functional Equations & Graph Transformations' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'JEE Advanced Selection Strategy',
        description: 'Selection accuracy is everything. 50% marks yields AIR <1000.',
        keyTactics: ['Solve non-negative numerical questions first.', 'Use partial marking safely on MSQs.'],
      },
    ],
    scoreStrategies: [
      { targetPercentile: 'Top 500 AIR (IIT Bombay CSE)', targetScore: '210+ / 360', notes: '~60% aggregate score' },
      { targetPercentile: 'Top 2000 AIR', targetScore: '160+ / 360', notes: '~45% aggregate score' },
    ],
    contingencies: [
      { scenario: 'Paper 1 goes poorly', trigger: 'Paper 1 expected score <70', action: 'Reset mindset during 2-hour break; treats Paper 2 as a brand new independent paper.' },
    ],
    standingOrders: ['Solve 5 multi-concept advanced problems daily.'],
  },
};
