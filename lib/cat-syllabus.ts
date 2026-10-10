export const CAT_CATALOG_ID = "cat-2026-v1"
export const CAT_CATALOG_VERSION = "2026.1"

export type CatSectionCode = "VARC" | "DILR" | "QA"

export type CatSyllabusSection = {
  id: string
  code: CatSectionCode
  name: string
  description: string
  sortOrder: number
}

export type CatTopicGroup = {
  id: string
  sectionId: string
  name: string
  description: string
  sortOrder: number
}

export type CatSyllabusTopic = {
  id: string
  catalogId: string
  sectionId: string
  groupId: string
  slug: string
  title: string
  description: string
  estimatedMinutes: number
  defaultPriority: number
  difficulty: number
  sortOrder: number
  prerequisiteIds: string[]
}

export type CatSyllabusCatalog = {
  id: string
  examCode: "cat"
  version: string
  label: string
  disclaimer: string
  sections: CatSyllabusSection[]
  groups: CatTopicGroup[]
  topics: CatSyllabusTopic[]
}

export const catSections: CatSyllabusSection[] = [
  {
    id: "cat-varc",
    code: "VARC",
    name: "Verbal Ability and Reading Comprehension",
    description: "Read precisely, identify structure, and communicate the logic behind an answer.",
    sortOrder: 1,
  },
  {
    id: "cat-dilr",
    code: "DILR",
    name: "Data Interpretation and Logical Reasoning",
    description: "Turn dense information into a model, then make sound deductions under time pressure.",
    sortOrder: 2,
  },
  {
    id: "cat-qa",
    code: "QA",
    name: "Quantitative Aptitude",
    description: "Build a dependable toolkit for translating and solving quantitative problems.",
    sortOrder: 3,
  },
]

export const catTopicGroups: CatTopicGroup[] = [
  { id: "cat-varc-rc", sectionId: "cat-varc", name: "Reading Comprehension", description: "Comprehension, inference, and author intent.", sortOrder: 1 },
  { id: "cat-varc-va", sectionId: "cat-varc", name: "Verbal Ability", description: "Paragraph-level organization and summary skills.", sortOrder: 2 },
  { id: "cat-dilr-di", sectionId: "cat-dilr", name: "Data Interpretation", description: "Tables, charts, sets, and caselets.", sortOrder: 1 },
  { id: "cat-dilr-lr", sectionId: "cat-dilr", name: "Logical Reasoning", description: "Arrangements, games, routes, and scheduling.", sortOrder: 2 },
  { id: "cat-qa-arithmetic", sectionId: "cat-qa", name: "Arithmetic", description: "High-frequency applications of ratios, rates, and percentages.", sortOrder: 1 },
  { id: "cat-qa-algebra", sectionId: "cat-qa", name: "Algebra", description: "Equations, functions, inequalities, and patterns.", sortOrder: 2 },
  { id: "cat-qa-geometry", sectionId: "cat-qa", name: "Geometry", description: "Visual relationships and coordinate reasoning.", sortOrder: 3 },
  { id: "cat-qa-number-systems", sectionId: "cat-qa", name: "Number Systems", description: "Properties, divisibility, and remainders.", sortOrder: 4 },
  { id: "cat-qa-modern-math", sectionId: "cat-qa", name: "Modern Math", description: "Counting, probability, and set-based reasoning.", sortOrder: 5 },
]

const topic = (
  id: string,
  sectionId: string,
  groupId: string,
  slug: string,
  title: string,
  description: string,
  estimatedMinutes: number,
  defaultPriority: number,
  difficulty: number,
  sortOrder: number,
  prerequisiteIds: string[] = [],
): CatSyllabusTopic => ({
  id,
  catalogId: CAT_CATALOG_ID,
  sectionId,
  groupId,
  slug,
  title,
  description,
  estimatedMinutes,
  defaultPriority,
  difficulty,
  sortOrder,
  prerequisiteIds,
})

export const catTopics: CatSyllabusTopic[] = [
  topic("cat-varc-rc-main-idea", "cat-varc", "cat-varc-rc", "main-idea", "Main idea and purpose", "Separate the passage's central claim from its supporting details.", 35, 5, 2, 1),
  topic("cat-varc-rc-inference", "cat-varc", "cat-varc-rc", "inference", "Inference and implication", "Infer only what the passage supports, without importing outside assumptions.", 35, 5, 3, 2, ["cat-varc-rc-main-idea"]),
  topic("cat-varc-rc-tone", "cat-varc", "cat-varc-rc", "tone-attitude", "Tone and author attitude", "Track the author's stance through language, qualification, and contrast.", 30, 4, 3, 3, ["cat-varc-rc-main-idea"]),
  topic("cat-varc-rc-structure", "cat-varc", "cat-varc-rc", "structure", "Passage structure", "Map how paragraphs develop, challenge, or qualify the central argument.", 35, 4, 3, 4, ["cat-varc-rc-main-idea"]),
  topic("cat-varc-rc-application", "cat-varc", "cat-varc-rc", "application-evaluation", "Application and evaluation", "Apply a passage's logic to a new example while preserving its boundaries.", 35, 3, 4, 5, ["cat-varc-rc-inference"]),
  topic("cat-varc-va-summary", "cat-varc", "cat-varc-va", "para-summary", "Para summary", "Compress a paragraph without losing its scope, intent, or logical relationship.", 25, 5, 2, 1),
  topic("cat-varc-va-jumbles", "cat-varc", "cat-varc-va", "para-jumbles", "Para jumbles", "Use reference words, chronology, and argument flow to order sentences.", 30, 5, 3, 2, ["cat-varc-va-summary"]),
  topic("cat-varc-va-odd-sentence", "cat-varc", "cat-varc-va", "odd-sentence", "Odd sentence out", "Identify the sentence that breaks the paragraph's coherent thread.", 25, 4, 3, 3, ["cat-varc-va-summary"]),
  topic("cat-varc-va-completion", "cat-varc", "cat-varc-va", "sentence-completion", "Sentence completion", "Complete an idea using the intended claim and grammatical direction.", 25, 3, 2, 4, ["cat-varc-va-summary"]),

  topic("cat-dilr-di-tables", "cat-dilr", "cat-dilr-di", "tables", "Tables and data grids", "Read multi-variable tables and identify the smallest useful calculation.", 35, 5, 2, 1),
  topic("cat-dilr-di-charts", "cat-dilr", "cat-dilr-di", "bar-line-charts", "Bar and line charts", "Compare trends, ratios, and changes across charted data.", 35, 4, 3, 2, ["cat-dilr-di-tables"]),
  topic("cat-dilr-di-pie", "cat-dilr", "cat-dilr-di", "pie-charts", "Pie charts and proportions", "Translate proportions into comparable quantities without over-calculating.", 30, 3, 2, 3, ["cat-dilr-di-tables"]),
  topic("cat-dilr-di-caselets", "cat-dilr", "cat-dilr-di", "caselets", "Data caselets", "Extract a compact model from prose before attempting the questions.", 40, 5, 4, 4, ["cat-dilr-di-tables", "cat-dilr-di-charts"]),
  topic("cat-dilr-di-venn", "cat-dilr", "cat-dilr-di", "venn-diagrams", "Venn diagrams and sets", "Represent overlapping groups and use inclusion-exclusion carefully.", 35, 4, 3, 5, ["cat-dilr-di-tables"]),
  topic("cat-dilr-lr-arrangements", "cat-dilr", "cat-dilr-lr", "arrangements", "Arrangements and order", "Convert positional constraints into a clean arrangement model.", 40, 5, 4, 1),
  topic("cat-dilr-lr-selection", "cat-dilr", "cat-dilr-lr", "selection-distribution", "Selection and distribution", "Track inclusion, exclusion, and distribution constraints systematically.", 40, 5, 4, 2),
  topic("cat-dilr-lr-games", "cat-dilr", "cat-dilr-lr", "games-tournaments", "Games and tournaments", "Build a standings or match-outcome model without missing cases.", 40, 4, 4, 3, ["cat-dilr-lr-selection"]),
  topic("cat-dilr-lr-routes", "cat-dilr", "cat-dilr-lr", "routes-networks", "Routes and networks", "Trace paths and connectivity constraints through a simple graph model.", 35, 3, 3, 4),
  topic("cat-dilr-lr-scheduling", "cat-dilr", "cat-dilr-lr", "scheduling", "Scheduling and sequencing", "Place events over time while maintaining every dependency and exclusion.", 40, 5, 4, 5, ["cat-dilr-lr-arrangements"]),
  topic("cat-dilr-lr-binary", "cat-dilr", "cat-dilr-lr", "binary-logic", "Binary logic and truth tables", "Use consistent truth assignments to eliminate impossible cases.", 35, 3, 4, 6, ["cat-dilr-lr-selection"]),

  topic("cat-qa-arithmetic-percentages", "cat-qa", "cat-qa-arithmetic", "percentages", "Percentages", "Move fluently between percentage change, base values, and comparisons.", 35, 5, 2, 1),
  topic("cat-qa-arithmetic-profit-loss", "cat-qa", "cat-qa-arithmetic", "profit-loss", "Profit, loss, and discount", "Model cost, marked price, discount, and margin without mixing bases.", 30, 4, 2, 2, ["cat-qa-arithmetic-percentages"]),
  topic("cat-qa-arithmetic-ratios", "cat-qa", "cat-qa-arithmetic", "ratios", "Ratios and proportions", "Translate relationships into scalable quantities and constraints.", 35, 5, 2, 3),
  topic("cat-qa-arithmetic-averages", "cat-qa", "cat-qa-arithmetic", "averages", "Averages and weighted averages", "Use totals and weights to avoid repeated arithmetic.", 30, 4, 2, 4, ["cat-qa-arithmetic-ratios"]),
  topic("cat-qa-arithmetic-tsd", "cat-qa", "cat-qa-arithmetic", "time-speed-distance", "Time, speed, and distance", "Connect rate, time, relative speed, and journeys into one model.", 40, 5, 3, 5, ["cat-qa-arithmetic-ratios"]),
  topic("cat-qa-arithmetic-time-work", "cat-qa", "cat-qa-arithmetic", "time-work", "Time and work", "Use work rates to combine or compare people and machines.", 40, 4, 3, 6, ["cat-qa-arithmetic-ratios"]),
  topic("cat-qa-arithmetic-mixtures", "cat-qa", "cat-qa-arithmetic", "mixtures", "Mixtures and alligation", "Balance component proportions and concentration changes.", 35, 3, 3, 7, ["cat-qa-arithmetic-ratios"]),
  topic("cat-qa-algebra-linear", "cat-qa", "cat-qa-algebra", "linear-equations", "Linear equations", "Translate a word problem into a minimal system of equations.", 30, 5, 2, 1),
  topic("cat-qa-algebra-quadratic", "cat-qa", "cat-qa-algebra", "quadratics", "Quadratic equations", "Use roots, factorisation, and relationships between roots efficiently.", 35, 4, 3, 2, ["cat-qa-algebra-linear"]),
  topic("cat-qa-algebra-inequalities", "cat-qa", "cat-qa-algebra", "inequalities", "Inequalities and ranges", "Track sign changes and valid ranges while solving constraints.", 30, 4, 3, 3, ["cat-qa-algebra-linear"]),
  topic("cat-qa-algebra-functions", "cat-qa", "cat-qa-algebra", "functions", "Functions and graphs", "Interpret transformations, domains, and outputs from a function model.", 40, 3, 4, 4, ["cat-qa-algebra-linear"]),
  topic("cat-qa-algebra-sequences", "cat-qa", "cat-qa-algebra", "sequences-series", "Sequences and series", "Identify recurrence, progression, and summation structure.", 35, 3, 3, 5, ["cat-qa-algebra-linear"]),
  topic("cat-qa-geometry-lines", "cat-qa", "cat-qa-geometry", "lines-angles", "Lines and angles", "Use angle relationships and parallel-line properties with precision.", 30, 3, 2, 1),
  topic("cat-qa-geometry-triangles", "cat-qa", "cat-qa-geometry", "triangles", "Triangles", "Apply similarity, area, and proportionality in triangle problems.", 40, 4, 3, 2, ["cat-qa-geometry-lines"]),
  topic("cat-qa-geometry-circles", "cat-qa", "cat-qa-geometry", "circles", "Circles", "Use chords, tangents, and cyclic relationships to reduce geometry.", 35, 3, 4, 3, ["cat-qa-geometry-lines"]),
  topic("cat-qa-geometry-coordinate", "cat-qa", "cat-qa-geometry", "coordinate-geometry", "Coordinate geometry", "Translate geometric relationships into manageable equations.", 40, 3, 4, 4, ["cat-qa-geometry-lines"]),
  topic("cat-qa-number-divisibility", "cat-qa", "cat-qa-number-systems", "divisibility", "Divisibility and primes", "Use factors and divisibility rules to simplify integer constraints.", 30, 4, 2, 1),
  topic("cat-qa-number-remainders", "cat-qa", "cat-qa-number-systems", "remainders", "Remainders and cyclicity", "Track repeated remainder patterns without expanding large values.", 35, 4, 3, 2, ["cat-qa-number-divisibility"]),
  topic("cat-qa-number-hcf-lcm", "cat-qa", "cat-qa-number-systems", "hcf-lcm", "HCF and LCM", "Model common factors and multiples across integer conditions.", 30, 3, 2, 3, ["cat-qa-number-divisibility"]),
  topic("cat-qa-modern-pnc", "cat-qa", "cat-qa-modern-math", "permutation-combination", "Permutation and combination", "Count arrangements while separating order, repetition, and restrictions.", 40, 4, 4, 1),
  topic("cat-qa-modern-probability", "cat-qa", "cat-qa-modern-math", "probability", "Probability", "Define a complete sample space before calculating conditional chances.", 40, 4, 4, 2, ["cat-qa-modern-pnc"]),
  topic("cat-qa-modern-sets", "cat-qa", "cat-qa-modern-math", "sets", "Sets and Venn reasoning", "Represent membership relationships and count overlaps cleanly.", 30, 3, 2, 3, ["cat-qa-modern-pnc"]),
]

export const catSyllabusCatalog: CatSyllabusCatalog = {
  id: CAT_CATALOG_ID,
  examCode: "cat",
  version: CAT_CATALOG_VERSION,
  label: "CAT preparation taxonomy · 2026.1",
  disclaimer: "This is a structured preparation taxonomy, not a claim of an official or exhaustive CAT syllabus. It may evolve as the product's content model matures.",
  sections: catSections,
  groups: catTopicGroups,
  topics: catTopics,
}

export function getCatTopic(topicId: string) {
  return catTopics.find((topicItem) => topicItem.id === topicId)
}

export function getCatSection(sectionId: string) {
  return catSections.find((section) => section.id === sectionId)
}
