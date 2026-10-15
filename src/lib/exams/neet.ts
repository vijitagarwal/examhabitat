import type { ExamConfig, SectionAttempt } from './types';

export const neetConfig: ExamConfig = {
  id: 'neet',
  stage: 'unified',
  name: 'NEET UG',
  fullName: 'National Eligibility cum Entrance Test (UG)',
  emoji: '🩺',
  primaryColor: 'oklch(0.72 0.18 155)',   // Emerald
  secondaryColor: 'oklch(0.75 0.16 200)', // Cyan
  examDate: new Date('2027-05-02T14:00:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2027-02-01T00:00:00+05:30'),
  registrationEnd: new Date('2027-03-09T00:00:00+05:30'),
  deadlines: [
    {
      title: 'NTA Information Bulletin & Application Release',
      date: new Date('2027-02-01T10:00:00+05:30'),
      type: 'registration',
      description: 'Official notification & online registration on neet.nta.nic.in',
    },
    {
      title: 'Registration & Fee Deadline',
      date: new Date('2027-03-09T23:50:00+05:30'),
      type: 'registration',
      description: 'Final cutoff for application submission and payment',
    },
    {
      title: 'Application Correction Window',
      date: new Date('2027-03-15T10:00:00+05:30'),
      type: 'correction',
      description: 'Edit photo, signature, category, and exam city choice',
    },
    {
      title: 'Admit Card Download Window',
      date: new Date('2027-04-25T12:00:00+05:30'),
      type: 'admit_card',
      description: 'Download self-declaration admit card with exam center details',
    },
    {
      title: 'NEET UG 2027 Exam Day',
      date: new Date('2027-05-02T14:00:00+05:30'),
      type: 'exam',
      description: 'Pen & Paper OMR test (14:00 to 17:20 IST)',
    },
    {
      title: 'OMR Sheet & Answer Key Release',
      date: new Date('2027-05-28T10:00:00+05:30'),
      type: 'result',
      description: 'NTA displays scanned OMR sheets and provisional answer keys',
    },
    {
      title: 'NEET UG Result & AIR Announcement',
      date: new Date('2027-06-12T17:00:00+05:30'),
      type: 'result',
      description: 'Scorecard release & MCC 15% All India Quota counseling registration',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Full NCERT Line-by-Line Syllabus Coverage',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-11-30T00:00:00+05:30'),
      description: 'Master Class 11 and Class 12 NCERT concepts across Bio, Chem, Phys.',
    },
    {
      label: 'Phase 2: Intensive Question Banks & PYQ Grinding',
      startDate: new Date('2026-12-01T00:00:00+05:30'),
      endDate: new Date('2027-02-28T00:00:00+05:30'),
      description: 'Solve past 15 years PYQs, daily 100 question targets, formula memorization.',
    },
    {
      label: 'Phase 3: Full OMR Mock Drills & Active Recall',
      startDate: new Date('2027-03-01T00:00:00+05:30'),
      endDate: new Date('2027-05-02T00:00:00+05:30'),
      description: 'Full 3h 20m timed mock tests twice weekly + intensive NCERT diagram drills.',
    },
  ],
  sections: [
    {
      code: 'Physics',
      name: 'Physics',
      maxQuestions: 45,
      maxMarks: 180,
      questionTypes: [
        { id: 'standard', label: 'MCQ', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Chemistry',
      name: 'Chemistry',
      maxQuestions: 45,
      maxMarks: 180,
      questionTypes: [
        { id: 'standard', label: 'MCQ', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Botany',
      name: 'Botany',
      maxQuestions: 45,
      maxMarks: 180,
      questionTypes: [
        { id: 'standard', label: 'MCQ', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
    {
      code: 'Zoology',
      name: 'Zoology',
      maxQuestions: 45,
      maxMarks: 180,
      questionTypes: [
        { id: 'standard', label: 'MCQ', correctMarks: 4, incorrectMarks: -1, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 720,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const score = (attempt.correct * 4) - ((attempt.attempts - attempt.correct) * 1);
      return total + score;
    }, 0);
  },
  scoringDescription: '+4 for correct, -1 for incorrect',
  targetInstitutionLabel: 'Target Medical College (AIIMS / MAMC / KGMU)',
  targetScoreLabel: 'Target Score (e.g. 680+ / 720)',
  mockCategories: ['ALLEN_MAJOR', 'AAKASH_FORTNIGHTLY', 'NEET_PYQ', 'PW_ALL_INDIA'],
  defaultTopics: [
    // PHYSICS — Class 11 & 12
    { section: 'Physics', topic_name: 'Units, Measurements & Error Analysis' },
    { section: 'Physics', topic_name: 'Kinematics — Motion in 1D & 2D (Vectors & Projectile)' },
    { section: 'Physics', topic_name: 'Laws of Motion & Friction' },
    { section: 'Physics', topic_name: 'Work, Energy & Power' },
    { section: 'Physics', topic_name: 'System of Particles & Rotational Motion' },
    { section: 'Physics', topic_name: 'Gravitation & Kepler Laws' },
    { section: 'Physics', topic_name: 'Mechanical Properties of Solids & Fluids' },
    { section: 'Physics', topic_name: 'Thermal Properties of Matter, Calorimetry & Heat Transfer' },
    { section: 'Physics', topic_name: 'Thermodynamics & Kinetic Theory of Gases' },
    { section: 'Physics', topic_name: 'Oscillations (SHM) & Wave Motion' },
    { section: 'Physics', topic_name: 'Electrostatics — Electric Charges, Fields & Potential' },
    { section: 'Physics', topic_name: 'Capacitance & Dielectrics' },
    { section: 'Physics', topic_name: 'Current Electricity — Kirchhoff Laws & Circuits' },
    { section: 'Physics', topic_name: 'Moving Charges & Magnetism (Biot-Savart & Ampere)' },
    { section: 'Physics', topic_name: 'Magnetism & Matter (Magnetic Properties & Earth Mag)' },
    { section: 'Physics', topic_name: 'Electromagnetic Induction (Faraday & Lenz Laws)' },
    { section: 'Physics', topic_name: 'Alternating Current & Transformers' },
    { section: 'Physics', topic_name: 'Electromagnetic Waves' },
    { section: 'Physics', topic_name: 'Ray Optics & Optical Instruments' },
    { section: 'Physics', topic_name: 'Wave Optics — Interference (YDSE) & Diffraction' },
    { section: 'Physics', topic_name: 'Dual Nature of Radiation & Matter (Photoelectric Effect)' },
    { section: 'Physics', topic_name: 'Atoms & Bohr Model' },
    { section: 'Physics', topic_name: 'Nuclei, Radioactivity & Nuclear Energy' },
    { section: 'Physics', topic_name: 'Semiconductors — Diodes, Transistors & Logic Gates' },

    // CHEMISTRY — Physical, Organic, Inorganic
    { section: 'Chemistry', topic_name: 'Some Basic Concepts of Chemistry (Mole Concept)' },
    { section: 'Chemistry', topic_name: 'Structure of Atom & Quantum Numbers' },
    { section: 'Chemistry', topic_name: 'Classification of Elements & Periodic Trends' },
    { section: 'Chemistry', topic_name: 'Chemical Bonding & Molecular Structure (VSEPR & MOT)' },
    { section: 'Chemistry', topic_name: 'Chemical Thermodynamics & Thermochemistry' },
    { section: 'Chemistry', topic_name: 'Chemical & Ionic Equilibrium' },
    { section: 'Chemistry', topic_name: 'Redox Reactions & Oxidation Numbers' },
    { section: 'Chemistry', topic_name: 'Solutions & Colligative Properties' },
    { section: 'Chemistry', topic_name: 'Electrochemistry & Nernst Equation' },
    { section: 'Chemistry', topic_name: 'Chemical Kinetics & Rate Laws' },
    { section: 'Chemistry', topic_name: 'Inorganic — P-Block, D-Block & F-Block Elements' },
    { section: 'Chemistry', topic_name: 'Coordination Compounds & IUPAC Nomenclature' },
    { section: 'Chemistry', topic_name: 'Organic — GOC (IUPAC, Isomerism, Resonance, Inductive)' },
    { section: 'Chemistry', topic_name: 'Hydrocarbons — Alkanes, Alkenes, Alkynes & Aromatic' },
    { section: 'Chemistry', topic_name: 'Haloalkanes & Haloarenes (SN1, SN2 Mechanisms)' },
    { section: 'Chemistry', topic_name: 'Alcohols, Phenols & Ethers' },
    { section: 'Chemistry', topic_name: 'Aldehydes, Ketones & Carboxylic Acids' },
    { section: 'Chemistry', topic_name: 'Amines & Diazonium Salts' },
    { section: 'Chemistry', topic_name: 'Biomolecules — Carbohydrates, Proteins & Nucleic Acids' },

    // BOTANY — Plant Biology
    { section: 'Botany', topic_name: 'The Living World & Biological Classification' },
    { section: 'Botany', topic_name: 'Plant Kingdom — Algae, Bryophytes, Pteridophytes, Gymnosperms' },
    { section: 'Botany', topic_name: 'Morphology of Flowering Plants' },
    { section: 'Botany', topic_name: 'Anatomy of Flowering Plants' },
    { section: 'Botany', topic_name: 'Cell: The Unit of Life & Cell Cycle and Division' },
    { section: 'Botany', topic_name: 'Photosynthesis in Higher Plants (C3, C4 Cycles)' },
    { section: 'Botany', topic_name: 'Respiration in Plants (Glycolysis, Krebs, ETS)' },
    { section: 'Botany', topic_name: 'Plant Growth and Development (Phytohormones)' },
    { section: 'Botany', topic_name: 'Sexual Reproduction in Flowering Plants (Embryo Sac & Seed)' },
    { section: 'Botany', topic_name: 'Principles of Inheritance & Variation (Mendelian Genetics)' },
    { section: 'Botany', topic_name: 'Molecular Basis of Inheritance (DNA Replication, Transcription, Translation)' },
    { section: 'Botany', topic_name: 'Microbes in Human Welfare' },
    { section: 'Botany', topic_name: 'Organisms and Populations (Ecology)' },
    { section: 'Botany', topic_name: 'Ecosystem — Energy Flow & Pyramids' },
    { section: 'Botany', topic_name: 'Biodiversity and Conservation' },

    // ZOOLOGY — Animal Biology & Human Physiology
    { section: 'Zoology', topic_name: 'Animal Kingdom — Non-Chordates & Chordates' },
    { section: 'Zoology', topic_name: 'Structural Organisation in Animals (Animal Tissues & Cockroach)' },
    { section: 'Zoology', topic_name: 'Biomolecules — Enzymes, Amino Acids & Lipids' },
    { section: 'Zoology', topic_name: 'Digestion and Absorption (Human Physiology)' },
    { section: 'Zoology', topic_name: 'Breathing and Exchange of Gases' },
    { section: 'Zoology', topic_name: 'Body Fluids and Circulation (Heart & Blood)' },
    { section: 'Zoology', topic_name: 'Excretory Products and Their Elimination (Nephron)' },
    { section: 'Zoology', topic_name: 'Locomotion and Movement (Skeletal & Muscle)' },
    { section: 'Zoology', topic_name: 'Neural Control and Coordination (Eye, Ear & Brain)' },
    { section: 'Zoology', topic_name: 'Chemical Coordination and Integration (Endocrine Glands)' },
    { section: 'Zoology', topic_name: 'Human Reproduction (Male & Female Systems)' },
    { section: 'Zoology', topic_name: 'Reproductive Health & ART Techniques' },
    { section: 'Zoology', topic_name: 'Evolution — Origin of Life & Darwinism' },
    { section: 'Zoology', topic_name: 'Human Health and Disease (Immunity, Cancer, AIDS)' },
    { section: 'Zoology', topic_name: 'Biotechnology: Principles and Processes (rDNA Tech)' },
    { section: 'Zoology', topic_name: 'Biotechnology and its Applications (GMO, Insulin, Gene Therapy)' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'Biology Mastery (360 Marks Target)',
        description: 'Biology makes up 50% of the NEET paper. 340+ in Bio is mandatory for top colleges.',
        keyTactics: [
          'Read NCERT Biology line-by-line minimum 5 times before exam day.',
          'Focus heavily on diagrams, tables, and scientist names mentioned in NCERT.',
        ],
      },
      {
        title: 'Chemistry Balanced Approach (160 Marks Target)',
        description: 'Inorganic is 100% NCERT direct. Organic requires reaction mechanism trees.',
        keyTactics: [
          'Memorize trends and exceptions in Periodic Table and P-block.',
          'Solve minimum 50 numericals per chapter in Physical Chemistry.',
        ],
      },
      {
        title: 'Physics Speed & Accuracy (150 Marks Target)',
        description: 'Focus on formula application and dimensional analysis.',
        keyTactics: [
          'Maintain a formula notebook and revise it every morning.',
          'Solve previous 20 years NEET & AIPMT questions thoroughly.',
        ],
      },
    ],
    scoreStrategies: [
      { targetPercentile: 'AIIMS / Top 10 MBBS', targetScore: '680+ / 720', notes: 'Bio 350+, Chem 165+, Phys 165+' },
      { targetPercentile: 'State GMC All India Quota', targetScore: '640+ / 720', notes: 'Bio 340+, Chem 150+, Phys 150+' },
    ],
    contingencies: [
      { scenario: 'Physics paper is calculation-heavy', trigger: 'Questions taking >1.5 mins each in round 1', action: 'Complete Biology and Chemistry first to secure 500+ marks, then spend remaining time on easiest Physics numericals.' },
    ],
    standingOrders: [
      'Daily 1 hour NCERT Biology active recall / flashcards.',
      'Log every silly mistake in Chemistry/Physics error log.',
    ],
  },
};
