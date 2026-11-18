/** 1 = anyone, 2 = some tools and care, 3 = a free afternoon or a weekend. */
export type Difficulty = 1 | 2 | 3;
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Involved' };

/** What every workshop's guides have in common. `S` is the workshop's spot ids (its clickable parts or areas). */
export interface GuideBase<S extends string = string> {
  id: string;
  title: string;
  /** Spots this guide is listed under. The first is where it lives. */
  spots: [S, ...S[]];
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

/** A workshop's guides, looked up by id and by spot. */
export interface GuideBook<S extends string, G extends GuideBase<S>> {
  all: G[];
  byId: Map<string, G>;
  /** A spot's guides, in book order. */
  forSpot(spot: S): G[];
}

export function guideBook<S extends string, G extends GuideBase<S>>(all: G[]): GuideBook<S, G> {
  const bySpot = new Map<S, G[]>();
  for (const g of all) {
    for (const s of g.spots) {
      const list = bySpot.get(s);
      if (list) list.push(g);
      else bySpot.set(s, [g]);
    }
  }
  return { all, byId: new Map(all.map((g) => [g.id, g])), forSpot: (spot) => bySpot.get(spot) ?? [] };
}
