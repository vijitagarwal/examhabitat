import type { ExamConfig, SectionAttempt } from './types';

export const upscConfig: ExamConfig = {
  id: 'upsc',
  stage: 'prelims',
  name: 'UPSC CSE',
  fullName: 'Civil Services Examination (Prelims)',
  emoji: '🏛️',
  primaryColor: 'oklch(0.62 0.20 20)',   // Crimson
  secondaryColor: 'oklch(0.72 0.15 60)', // Bronze
  examDate: new Date('2027-05-30T09:30:00+05:30'),
  campaignStart: new Date('2026-06-01T00:00:00+05:30'),
  registrationStart: new Date('2027-02-10T00:00:00+05:30'),
  registrationEnd: new Date('2027-03-02T00:00:00+05:30'),
  deadlines: [
    {
      title: 'UPSC CSE Notification & Online Form Release',
      date: new Date('2027-02-10T10:00:00+05:30'),
      type: 'registration',
      description: 'Official notification & application form on upsc.gov.in',
    },
    {
      title: 'Application Form Closing Deadline',
      date: new Date('2027-03-02T18:00:00+05:30'),
      type: 'registration',
      description: 'Final date for filling OT registration and prelims application',
    },
    {
      title: 'E-Admit Card Download Release',
      date: new Date('2027-05-08T12:00:00+05:30'),
      type: 'admit_card',
      description: 'Download e-Admit Card for Prelims Paper 1 & Paper 2',
    },
    {
      title: 'UPSC CSE Prelims 2027 Exam Day',
      date: new Date('2027-05-30T09:30:00+05:30'),
      type: 'exam',
      description: 'GS-I (09:30-11:30) & CSAT Paper II (14:30-16:30)',
    },
    {
      title: 'Prelims Result & Mains DAF-1 Release',
      date: new Date('2027-06-25T17:00:00+05:30'),
      type: 'result',
      description: 'Qualified candidates list for CSE Mains 2027',
    },
    {
      title: 'UPSC CSE Mains 2027 Exam Window',
      date: new Date('2027-09-17T09:00:00+05:30'),
      type: 'exam',
      description: '5-day written subjective examination for Mains qualified candidates',
    },
  ],
  phases: [
    {
      label: 'Phase 1: Standard Books & NCERT Foundation',
      startDate: new Date('2026-06-01T00:00:00+05:30'),
      endDate: new Date('2026-11-30T00:00:00+05:30'),
      description: 'Polity (Laxmikanth), Economy (Ramesh Singh/Mrunal), History (Spectrum), Geography (NCERTs).',
    },
    {
      label: 'Phase 2: Current Affairs & CSAT Speed Building',
      startDate: new Date('2026-12-01T00:00:00+05:30'),
      endDate: new Date('2027-02-28T00:00:00+05:30'),
      description: 'Monthly compilations, CSAT quant & reading comprehension speed drills.',
    },
    {
      label: 'Phase 3: Prelims Test Series & Elimination Technique',
      startDate: new Date('2027-03-01T00:00:00+05:30'),
      endDate: new Date('2027-05-30T00:00:00+05:30'),
      description: 'Solve 30 full-length GS-I test papers + 10 CSAT papers under timed exam conditions.',
    },
  ],
  sections: [
    {
      code: 'GS-I',
      name: 'General Studies Paper I',
      maxQuestions: 100,
      maxMarks: 200,
      questionTypes: [
        { id: 'gs1', label: 'GS-I Question', correctMarks: 2.0, incorrectMarks: -0.66, allowsPartialMarking: false },
      ],
    },
    {
      code: 'CSAT',
      name: 'General Studies Paper II (CSAT)',
      maxQuestions: 80,
      maxMarks: 200,
      questionTypes: [
        { id: 'csat', label: 'CSAT Question', correctMarks: 2.5, incorrectMarks: -0.83, allowsPartialMarking: false },
      ],
    },
  ],
  totalMaxMarks: 400,
  scoringFormula: (sectionAttempts: SectionAttempt[]): number => {
    return sectionAttempts.reduce((total, attempt) => {
      const isCsat = attempt.questionTypeId === 'csat';
      const markPerCorrect = isCsat ? 2.5 : 2.0;
      const markPerWrong = isCsat ? -0.83 : -0.66;
      const score = (attempt.correct * markPerCorrect) + ((attempt.attempts - attempt.correct) * markPerWrong);
      return total + score;
    }, 0);
  },
  scoringDescription: 'GS-I (+2/-0.66), CSAT (+2.5/-0.83, 33% qualifying)',
  targetInstitutionLabel: 'Target Academy (LBSNAA Mussoorie)',
  targetScoreLabel: 'Target GS-I Score (e.g. 105+ / 200)',
  mockCategories: ['VISION_IAS', 'FORUM_IAS', 'INSIGHTS_ON_INDIA', 'UPSC_PRELIMS_PYQ'],
  defaultTopics: [
    // POLITY
    { section: 'GS-I', topic_name: 'Polity — Preamble, Fundamental Rights, DPSP & Fundamental Duties' },
    { section: 'GS-I', topic_name: 'Polity — Parliament, President, Prime Minister & Cabinet' },
    { section: 'GS-I', topic_name: 'Polity — Judiciary (Supreme Court, High Courts & Judicial Review)' },
    { section: 'GS-I', topic_name: 'Polity — Federal System, Centre-State Relations & Emergency Provisions' },
    { section: 'GS-I', topic_name: 'Polity — Constitutional & Non-Constitutional Bodies (EC, UPSC, CAG, NITI Aayog)' },
    { section: 'GS-I', topic_name: 'Polity — Local Self-Government (73rd & 74th Amendments)' },

    // ECONOMY
    { section: 'GS-I', topic_name: 'Economy — National Income, GDP, Inflation & CPI/WPI Indices' },
    { section: 'GS-I', topic_name: 'Economy — Banking System, RBI Monetary Policy & NPAs' },
    { section: 'GS-I', topic_name: 'Economy — Fiscal Policy, Union Budget & Taxation (GST)' },
    { section: 'GS-I', topic_name: 'Economy — External Sector, Balance of Payments, Forex & Exchange Rates' },
    { section: 'GS-I', topic_name: 'Economy — Financial Markets (SEBI, Stocks, Bonds, Money Market)' },
    { section: 'GS-I', topic_name: 'Economy — Agriculture, MSP, Subsidies & Food Security' },
    { section: 'GS-I', topic_name: 'Economy — Schemes, Poverty Alleviation & Social Sector' },

    // HISTORY & ART & CULTURE
    { section: 'GS-I', topic_name: 'Modern History — 1857 Revolt & Freedom Struggle (1885-1905)' },
    { section: 'GS-I', topic_name: 'Modern History — Gandhian Era, Non-Cooperation, Civil Disobedience & Quit India' },
    { section: 'GS-I', topic_name: 'Modern History — Governor Generals, Acts (1909, 1919, 1935) & Socio-Religious Reforms' },
    { section: 'GS-I', topic_name: 'Ancient History — Indus Valley, Vedic Age, Buddhism & Jainism' },
    { section: 'GS-I', topic_name: 'Ancient & Medieval — Mauryas, Guptas, Cholas & Vijayanagara Empire' },
    { section: 'GS-I', topic_name: 'Art & Culture — Architecture, Temples, Paintings & Classical Dances' },

    // GEOGRAPHY
    { section: 'GS-I', topic_name: 'Geography — Geomorphology, Plate Tectonics, Earthquakes & Volcanoes' },
    { section: 'GS-I', topic_name: 'Geography — Climatology, Monsoons, Cyclones & Jet Streams' },
    { section: 'GS-I', topic_name: 'Geography — Oceanography, Currents, Tides & Coral Reefs' },
    { section: 'GS-I', topic_name: 'Geography — Indian Physical Geography, Rivers & Drainage Systems' },

    // ENVIRONMENT & ECOLOGY
    { section: 'GS-I', topic_name: 'Environment — Biodiversity Hotspots, National Parks & Wildlife Sanctuaries' },
    { section: 'GS-I', topic_name: 'Environment — Climate Change, Paris Agreement, UNFCCC & COP Summits' },
    { section: 'GS-I', topic_name: 'Environment — Pollution, E-Waste & Environmental Protection Acts' },

    // SCIENCE & TECH + CURRENT AFFAIRS
    { section: 'GS-I', topic_name: 'Science & Tech — Space Tech (ISRO Missions), Biotech & Gene Editing' },
    { section: 'GS-I', topic_name: 'Science & Tech — IT, AI, Quantum Computing & Cybersecurity' },
    { section: 'GS-I', topic_name: 'Current Affairs — International Treaties, Organisations & Geopolitics' },

    // CSAT PAPER II
    { section: 'CSAT', topic_name: 'CSAT — Reading Comprehension (Passages & Inferences)' },
    { section: 'CSAT', topic_name: 'CSAT — Quantitative Aptitude (Number System, Percentages, Ratios)' },
    { section: 'CSAT', topic_name: 'CSAT — Speed, Time, Work, Permutations & Probability' },
    { section: 'CSAT', topic_name: 'CSAT — Logical Reasoning, Syllogisms & Coding-Decoding' },
    { section: 'CSAT', topic_name: 'CSAT — Data Interpretation (Tables, Charts & Caselets)' },
  ],
  strategyContent: {
    sections: [
      {
        title: 'GS-I Prelims Cutoff Strategy',
        description: 'Aim for 85-90 attempts with high precision in Core Polity and Economy.',
        keyTactics: ['Polity and Economy are 100% conceptual — zero guesswork.', 'Environment & Modern History carry ~35 questions combined.'],
      },
      {
        title: 'CSAT Safety Net',
        description: 'Never underestimate CSAT. You need 66.6 marks to qualify.',
        keyTactics: ['Solve 35 RC passages with high accuracy first.', 'Master basic quant arithmetic for guaranteed 20+ marks.'],
      },
    ],
    scoreStrategies: [
      { targetPercentile: 'Safe Cutoff Margin', targetScore: '105+ / 200 (GS-I)', notes: 'Guarantees Mains call regardless of tough paper' },
      { targetPercentile: 'CSAT Qualifying', targetScore: '100+ / 200 (CSAT)', notes: 'Comfortably above 66.6 mark requirement' },
    ],
    contingencies: [
      { scenario: 'GS-I paper has heavy factual current affairs', trigger: 'Concept questions count <30 in paper', action: 'Avoid blind guesses. Maintain 75+ intelligent elimination attempts.' },
    ],
    standingOrders: ['Daily newspaper reading (The Hindu / Indian Express).', 'Weekly 1 full CSAT sectional test.'],
  },
};
