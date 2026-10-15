import type { ExamConfig, ExamId } from './types';
import { catConfig } from './cat';
import { neetConfig } from './neet';
import { jeeMainConfig } from './jee-main';
import { jeeAdvConfig } from './jee-adv';
import { upscConfig } from './upsc';
import { gateConfig } from './gate';
import { clatConfig } from './clat';

export const EXAM_REGISTRY: Record<ExamId, ExamConfig> = {
  cat: catConfig,
  neet: neetConfig,
  jee_main: jeeMainConfig,
  jee_adv: jeeAdvConfig,
  upsc: upscConfig,
  gate: gateConfig,
  clat: clatConfig,
};

export const DEFAULT_EXAM_ID: ExamId = 'cat';

export function isExamId(id: ExamId | string | null | undefined): id is ExamId {
  return typeof id === 'string' && id in EXAM_REGISTRY;
}

export function getExamConfig(id: ExamId | string | null | undefined): ExamConfig {
  if (!isExamId(id)) {
    return EXAM_REGISTRY[DEFAULT_EXAM_ID];
  }
  return EXAM_REGISTRY[id];
}

export function getAllExams(): ExamConfig[] {
  return Object.values(EXAM_REGISTRY);
}
