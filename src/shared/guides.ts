/** 1 = anyone, 2 = some tools and care, 3 = a free afternoon or a weekend. */
export type Difficulty = 1 | 2 | 3;
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Involved' };

/** What every workshop's guides have in common. */
export interface GuideBase {
  id: string;
  title: string;
  /** Extra search words for the guide index. */
  aliases: string[];
  difficulty: Difficulty;
  /** Hands-on time range. */
  minutes: [number, number];
  /** Money saved, as a sentence fragment. */
  savings?: string;
  tools: string[];
  supplies: string[];
  summary: string;
  steps: string[];
  cautions?: string[];
  links?: { label: string; url: string }[];
  /** YouTube search words. */
  query: string;
  /** Shown in the quick-fix bar. */
  featured?: boolean;
}
