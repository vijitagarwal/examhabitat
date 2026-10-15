import type { ExamConfig, SectionAttempt } from './types';

export const jeeMainConfig: ExamConfig = {
  id: 'jee_main',
  stage: 'unified',
  name: 'JEE Main',
  fullName: 'Joint Entrance Examination (Main)',
  emoji: '⚡',
  primaryColor: 'oklch(0.65 0.22 255)',   // Blue
  secondaryColor: 'oklch(0.68 0.19 290)', // Purple
  examDate: new Date('2027-01-24T09:00:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2026-11-01T00:00:00+05:30'),
  registrationEnd: new Date('2026-12-04T00:00:00+05:30'),
  deadlines: [
    {
      title: 'Session 1 Registration Window Opens',
      date: new Date('2026-11-01T10:00:00+05:30'),
      type: 'registration',
      description: 'Online application release on jeemain.nta.ac.in',
    },
    {
      title: 'Session 1 Registration & Fee Deadline',
      date: new Date('2026-12-04T23:50:00+05:30'),
      type: 'registration',
      description: 'Last date for Session 1 registration & fee payment',
    },
    {
      title: 'Session 1 City Intimation & Admit Card',
      date: new Date('2027-01-15T12:00:00+05:30'),
      type: 'admit_card',
      description: 'Download admit card with test shift (Morning 9-12 / Afternoon 3-6)',
    },
    {
      title: 'JEE Main 2027 Session 1 Exam Window',
      date: new Date('2027-01-24T09:00:00+05:30'),
      type: 'exam',
      description: 'Computer Based Test (CBT) across test centers nationwide',
    },
    {
      title: 'Session 1 NTA NTA Percentile Score Release',
      date: new Date('2027-02-12T17:00:00+05:30'),
      type: 'result',
      description: 'Session 1 NTA score report & percentile declaration',
    },
    {
      title: 'Session 2 Registration Window',
      date: new Date('2027-02-15T10:00:00+05:30'),
      type: 'registration',
      description: 'Registration opens for April Session 2 exam',
    },
    {
      title: 'JEE Main 2027 Session 2 Exam Window',
      date: new Date('2027-04-04T09:00:00+05:30'),
      type: 'exam',
      description: 'Session 2 exam & final All India Rank (AIR) calculation',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Syllabus Coverage & High-Yield Problem Solving',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-10-31T00:00:00+05:30'),
      description: 'Cover all chapters across Physics, Chem, Math with high problem-solving density.',
    },
    {
      label: 'Phase 2: January Session Mock Sprint & NTA CBT Drills',
      startDate: new Date('2026-11-01T00:00:00+05:30'),
      endDate: new Date('2027-01-24T00:00:00+05:30'),
      description: 'Daily NTA-style CBT mocks, speed optimization, and error rectification.',
    },
    {
      label: 'Phase 3: April Session Percentile Boost Sprint',
      startDate: new Date('2027-01-25T00:00:00+05:30'),
      endDate: new Date('2027-04-10T00:00:00+05:30'),
      description: 'Targeted weak chapter mastery for Session 2 percentile boost.',
    },
  ],
  sections: [
    {
      code: 'Physics',
      name: 'Physics',
      maxQuestions: 25,
      maxMarks: 100,
      questionTypes: [
        { id: 'standard', label: 'MCQ & Numerical', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Chemistry',
      name: 'Chemistry',
      maxQuestions: 25,
      maxMarks: 100,
      questionTypes: [
        { id: 'standard', label: 'MCQ & Numerical', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Math',
      name: 'Mathematics',
      maxQuestions: 25,
      maxMarks: 100,
      questionTypes: [
        { id: 'standard', label: 'MCQ & Numerical', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 300,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const score = (attempt.correct * 4) - ((attempt.attempts - attempt.correct) * 1);
      return total + score;
    }, 0);
  },
  scoringDescription: '+4 for correct, -1 for incorrect',
  targetInstitutionLabel: 'Target NIT / IIIT / GFTI',
  targetScoreLabel: 'Target Score (e.g. 210+ / 300)',
  mockCategories: ['NTA_ABHYAS', 'MATHONGO', 'ALLEN_CBT', 'JEE_MAIN_PYQ'],
  defaultTopics: [
    // PHYSICS
    { section: 'Physics', topic_name: 'Units, Dimensions & Errors' },
    { section: 'Physics', topic_name: 'Kinematics 1D & 2D (Relative Motion)' },
    { section: 'Physics', topic_name: 'Laws of Motion, Friction & Circular Motion' },
    { section: 'Physics', topic_name: 'Work, Power & Energy' },
    { section: 'Physics', topic_name: 'Center of Mass, Collisions & Momentum' },
    { section: 'Physics', topic_name: 'Rotational Dynamics & Rigid Body' },
    { section: 'Physics', topic_name: 'Gravitation & Satellite Motion' },
    { section: 'Physics', topic_name: 'Properties of Solids & Fluid Mechanics' },
    { section: 'Physics', topic_name: 'Thermal Physics & Calorimetry' },
    { section: 'Physics', topic_name: 'Thermodynamics & KTG' },
    { section: 'Physics', topic_name: 'Simple Harmonic Motion (Oscillations)' },
    { section: 'Physics', topic_name: 'Waves & Sound (Doppler Effect)' },
    { section: 'Physics', topic_name: 'Electrostatics — Field, Potential & Gauss Law' },
    { section: 'Physics', topic_name: 'Current Electricity & Meter Bridge / Potentiometer' },
    { section: 'Physics', topic_name: 'Magnetic Effects of Current & Ampere Law' },
    { section: 'Physics', topic_name: 'Magnetism & Matter' },
    { section: 'Physics', topic_name: 'Electromagnetic Induction & AC Circuits' },
    { section: 'Physics', topic_name: 'Electromagnetic Waves' },
    { section: 'Physics', topic_name: 'Ray Optics & Optical Instruments' },
    { section: 'Physics', topic_name: 'Wave Optics (YDSE & Polarization)' },
    { section: 'Physics', topic_name: 'Dual Nature of Radiation & Photoelectric Effect' },
    { section: 'Physics', topic_name: 'Atoms & Nuclei' },
    { section: 'Physics', topic_name: 'Semiconductors & Logic Gates' },

    // CHEMISTRY
    { section: 'Chemistry', topic_name: 'Mole Concept & Stoichiometry' },
    { section: 'Chemistry', topic_name: 'Atomic Structure & Quantum Numbers' },
    { section: 'Chemistry', topic_name: 'Periodic Table & Periodicity' },
    { section: 'Chemistry', topic_name: 'Chemical Bonding & Molecular Structure' },
    { section: 'Chemistry', topic_name: 'States of Matter & Gas Laws' },
    { section: 'Chemistry', topic_name: 'Chemical Thermodynamics & Energetics' },
    { section: 'Chemistry', topic_name: 'Chemical & Ionic Equilibrium' },
    { section: 'Chemistry', topic_name: 'Redox Reactions & Electrochemistry' },
    { section: 'Chemistry', topic_name: 'Solutions & Colligative Properties' },
    { section: 'Chemistry', topic_name: 'Chemical Kinetics' },
    { section: 'Chemistry', topic_name: 'Surface Chemistry' },
    { section: 'Chemistry', topic_name: 'P-Block & D-Block Elements' },
    { section: 'Chemistry', topic_name: 'Coordination Compounds & Bonding' },
    { section: 'Chemistry', topic_name: 'Purification & Characterisation of Organic Compounds' },
    { section: 'Chemistry', topic_name: 'General Organic Chemistry (GOC) & Isomerism' },
    { section: 'Chemistry', topic_name: 'Hydrocarbons (Alkanes, Alkenes, Alkynes, Benzene)' },
    { section: 'Chemistry', topic_name: 'Organic Compounds Containing Halogens' },
    { section: 'Chemistry', topic_name: 'Organic Compounds Containing Oxygen (Alcohols, Aldehydes, Acids)' },
    { section: 'Chemistry', topic_name: 'Organic Compounds Containing Nitrogen (Amines)' },
    { section: 'Chemistry', topic_name: 'Biomolecules & Polymers' },

    // MATHEMATICS
    { section: 'Math', topic_name: 'Sets, Relations & Functions' },
    { section: 'Math', topic_name: 'Complex Numbers & Quadratic Equations' },
    { section: 'Math', topic_name: 'Matrices & Determinants' },
    { section: 'Math', topic_name: 'Permutations & Combinations' },
    { section: 'Math', topic_name: 'Mathematical Induction & Binomial Theorem' },
    { section: 'Math', topic_name: 'Sequences & Series (AP, GP, Special Sums)' },
    { section: 'Math', topic_name: 'Limit, Continuity & Differentiability' },
    { section: 'Math', topic_name: 'Application of Derivatives (Tangents, Maxima/Minima)' },
    { section: 'Math', topic_name: 'Indefinite & Definite Integrals' },
    { section: 'Math', topic_name: 'Area Under Curves' },
    { section: 'Math', topic_name: 'Differential Equations' },
    { section: 'Math', topic_name: 'Straight Lines & Circles (Coordinate Geometry)' },
    { section: 'Math', topic_name: 'Conic Sections (Parabola, Ellipse, Hyperbola)' },
    { section: 'Math', topic_name: 'Vector Algebra' },
    { section: 'Math', topic_name: 'Three Dimensional Geometry (Lines & Planes)' },
    { section: 'Math', topic_name: 'Trigonometric Ratios, Equations & Inverse Trigonometry' },
    { section: 'Math', topic_name: 'Probability & Probability Distributions' },
    { section: 'Math', topic_name: 'Statistics & Measures of Dispersion' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'High-Yield Physics Strategy',
        description: 'Modern Physics and Semiconductors yield quick guaranteed marks.',
        keyTactics: ['Solve Modern Physics and Optics first.', 'Master formula substitution for direct questions.'],
      },
      {
        title: 'Chemistry Scoring Strategy',
        description: 'Aim for 80+ in Chemistry in under 45 minutes.',
        keyTactics: ['Complete Inorganic questions in <10 mins.', 'Double check calculation in Physical numericals.'],
      },
      {
        title: 'Math Time Management',
        description: 'Math in JEE Main is notoriously lengthy. Choose 12-15 doable questions carefully.',
        keyTactics: ['Skip lengthy 3D/Vector calculation traps in round 1.', 'Attempt calculus questions with clean boundaries.'],
      },
    ],
    scoreStrategies: [
      { targetPercentile: '99.5+%ile (Top NIT CSE)', targetScore: '220+ / 300', notes: 'Chem 85+, Phys 80+, Math 60+' },
      { targetPercentile: '99.0+%ile', targetScore: '190+ / 300', notes: 'Chem 75+, Phys 70+, Math 45+' },
    ],
    contingencies: [
      { scenario: 'Math section is exceptionally tough', trigger: 'Math solve rate <3 questions in 20 mins', action: 'Focus 80% of time on Physics & Chemistry to push score to 200+.' },
    ],
    standingOrders: ['Daily 1 chapter PYQs revision.', 'Weekly full 3-hour CBT mock attempt.'],
  },
};
