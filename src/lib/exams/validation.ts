import type { ExamConfig, SectionAttempt, TopicStatus } from './types';
import { STATUS_ORDER } from './types';

export function isTopicStatus(value: string): value is TopicStatus {
  return STATUS_ORDER.includes(value as TopicStatus);
}

export function validateMockAttempts(
  examConfig: ExamConfig,
  sectionAttempts: SectionAttempt[],
  percentile: number | null,
): string | null {
  if (!sectionAttempts.length) {
    return 'Add at least one section result before saving the mock.';
  }

  if (percentile !== null && (!Number.isFinite(percentile) || percentile < 0 || percentile > 100)) {
    return 'Percentile must be between 0 and 100.';
  }

  for (const section of examConfig.sections) {
    const attemptsForSection = sectionAttempts.filter((attempt) => attempt.section === section.code);
    const configuredQuestionTypes = new Set(section.questionTypes.map((questionType) => questionType.id));
    const seenQuestionTypes = new Set<string>();

    for (const attempt of attemptsForSection) {
      if (!configuredQuestionTypes.has(attempt.questionTypeId)) {
        return `Unsupported question type in ${section.code}.`;
      }
      if (seenQuestionTypes.has(attempt.questionTypeId)) {
        return `Duplicate question type in ${section.code}.`;
      }
      seenQuestionTypes.add(attempt.questionTypeId);

      if (
        !Number.isInteger(attempt.attempts) ||
        !Number.isInteger(attempt.correct) ||
        attempt.attempts < 0 ||
        attempt.correct < 0
      ) {
        return 'Attempts and correct answers must be non-negative whole numbers.';
      }

      if (attempt.correct > attempt.attempts) {
        return 'Correct answers cannot exceed attempts.';
      }
    }

    const sectionAttemptsTotal = attemptsForSection.reduce((total, attempt) => total + attempt.attempts, 0);
    if (sectionAttemptsTotal > section.maxQuestions) {
      return `${section.code} cannot have more than ${section.maxQuestions} attempts.`;
    }
  }

  const configuredSections = new Set(examConfig.sections.map((section) => section.code));
  if (sectionAttempts.some((attempt) => !configuredSections.has(attempt.section))) {
    return 'The mock contains an unsupported section.';
  }

  const score = examConfig.scoringFormula(sectionAttempts);
  if (!Number.isFinite(score) || score > examConfig.totalMaxMarks) {
    return `The calculated score cannot exceed ${examConfig.totalMaxMarks}.`;
  }

  return null;
}
