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

export interface PapiAspect {
  aspect_name: string;
  code: string;
  score: string;
  interpretation: string;
  match_percentage: number;
  fit: string;
  relevance_reason: string;
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

export interface PsychogramData {
  identity: Identity;
  cognitive: Cognitive;
  cv_evaluation: CvEvaluation;
  papi: PapiAspect[];
  analysis: Analysis;
  conclusion: Conclusion;
}
