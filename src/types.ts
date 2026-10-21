/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Identity {
  name: string;
  position: string;
}

export interface Cognitive {
  raw_score: string;
  iq: string;
  category: string;
  description: string;
  match_percentage: number;
}

export interface CvEvaluation {
  summary: string;
  match_percentage: number;
  pros: string[];
  cons: string[];
}

export type AspectPriority = 'kritikal' | 'pendukung' | 'risiko';

export interface PapiAspect {
  aspect_name: string;
  code: string;
  score: string;
  ideal_score: string;
  interpretation: string;
  match_percentage: number;
  fit: string;
  relevance_reason: string;
  // Diisi oleh kode (src/lib/papi-scoring.ts), bukan oleh AI:
  fit_level?: 1 | 2 | 3 | 4 | 5;
  direction?: 'within' | 'below' | 'above';
  priority?: AspectPriority;
  weight?: number;
  unreadable?: boolean;
}

export interface Analysis {
  strengths: string[];
  risks: string[];
}

export interface Conclusion {
  total_job_fit_percentage: number;
  status: string;
  notes: string;
}

export interface CostDetail {
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  totalRupiah: number;
}

export interface JobProfileAspect {
  code: string;
  name: string;
  ideal_range: string;
  reason: string;
  priority?: AspectPriority;
}

export interface JobProfile {
  id: string;
  positionName: string;
  roleSummary: string;
  papiAspects: JobProfileAspect[];
  codesString: string;
  createdAt: number;
}

export interface PsychogramData {
  identity: Identity;
  cognitive: Cognitive;
  cv_evaluation: CvEvaluation;
  papi: PapiAspect[];
  papi_summary?: { weighted_match: number; knockouts: string[] };
  analysis: Analysis;
  conclusion: Conclusion;
  costs?: CostDetail[];
  translatedData?: {
    en?: {
      cognitive: Cognitive;
      cv_evaluation: CvEvaluation;
      papi: PapiAspect[];
      analysis: Analysis;
      conclusion: Conclusion;
    }
  };
}

export interface CandidatePair {
  id: string;
  name: string;
  psikotesFile: File;
  cvFile: File | null;
}

