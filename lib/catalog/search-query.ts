import vocabulary from "@const/search-vocabulary.json";

/**
 * Turns what a customer typed into search terms, ranks results so name
 * matches come first, and suggests a correction for misspelled words.
 * Pure functions: shared by the Square and fixture catalog sources.
 */

/** Shorthand collectors type → the words used in product names. */
const SYNONYMS: Record<string, string[]> = {
  etb: ["elite", "trainer", "box"],
  etbs: ["elite", "trainer", "box"],
  bb: ["booster", "box"],
  toploaders: ["toploader"],
  toploader: ["toploader"],
  loaders: ["loader"],
  playmats: ["playmat"],
  slabs: ["graded"],
  slab: ["graded"],
  mtg: ["magic"],
  dbs: ["dragon", "ball"],
  ygo: ["yu", "gi", "oh"],
  op: ["one", "piece"],
};

/** Words too common to help narrow a search. */
const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "for", "with", "card", "cards", "tcg"]);

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "Booster Packs" → "pack": product names use the singular, and matching is by prefix. */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith("es") && /(x|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** The words to search for: accents and punctuation removed, shorthand expanded, plurals trimmed. */
export function searchTerms(query: string): string[] {
  const words = fold(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const terms: string[] = [];
  for (let i = 0; i < words.length; i++) {
    // "top loaders" → "toploader"
    if (words[i] === "top" && /^loaders?$/.test(words[i + 1] ?? "")) {
      terms.push("toploader");
      i++;
      continue;
    }
    const expanded = SYNONYMS[words[i]] ?? [singular(words[i])];
    for (const term of expanded) if (!terms.includes(term)) terms.push(term);
  }
  const useful = terms.filter((t) => !STOP_WORDS.has(t));
  return useful.length > 0 ? useful : terms;
}

/** A query needs at least one word of 3+ characters (or a number such as "151") to mean anything. */
export function isSearchable(query: string): boolean {
  return searchTerms(query).some((t) => t.length >= 3 || /^\d{2,}$/.test(t));
}

/** Square accepts up to three keywords of 3+ characters: send the most specific ones. */
export function squareKeywords(terms: string[]): string[] {
  return [...terms]
    .filter((t) => t.length >= 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

/**
 * How well a product matches, higher is better:
 *   4  every term is a whole word in the name ("ex" in "Charizard ex")
 *   3  every term starts a word in the name ("ex" in "Exclusive")
 *   2  every term appears somewhere in the name
 *   1  some terms are in the name
 *   0  matched only through its description
 * Small bonuses when the terms appear together as a phrase, and when the name
 * starts with the first term.
 */
export function relevance(name: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const folded = fold(name);
  const words = folded.split(/[^a-z0-9]+/).filter(Boolean);
  // Product names use plurals too ("Sleeves"); compare on the singular.
  const singulars = words.map(singular);
  const isWord = (t: string) => singulars.includes(t) || words.includes(t);
  const startsWord = (t: string) => words.some((w) => w.startsWith(t));
  const inName = terms.filter((t) => folded.includes(t)).length;
  let score = 0;
  if (terms.every(isWord)) score = 4;
  else if (terms.every(startsWord)) score = 3;
  else if (inName === terms.length) score = 2;
  else if (inName > 0) score = 1;
  if (score === 0) return 0;
  if (terms.length > 1 && singulars.join(" ").includes(terms.join(" "))) score += 0.5;
  if (words[0]?.startsWith(terms[0])) score += 0.25;
  return score;
}

/** Sorts best match first; ties fall back to the chosen name order. */
export function byRelevance<T extends { name: string }>(items: T[], terms: string[], sort: "name_asc" | "name_desc"): T[] {
  const direction = sort === "name_desc" ? -1 : 1;
  return items
    .map((item) => ({ item, score: relevance(item.name, terms) }))
    .sort((a, b) => b.score - a.score || direction * a.item.name.localeCompare(b.item.name))
    .map((entry) => entry.item);
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

const VOCABULARY = Object.entries(vocabulary as Record<string, number>);

/**
 * A corrected query for misspellings ("charzard" → "charizard"), or null when
 * every word is already one the catalog uses or nothing close exists. Words
 * come from product names (const/search-vocabulary.json).
 */
export function suggestQuery(query: string): string | null {
  const terms = searchTerms(query);
  let changed = false;
  const fixed = terms.map((term) => {
    if (term.length < 4 || /\d/.test(term)) return term;
    if (VOCABULARY.some(([word]) => word.startsWith(term))) return term;
    const max = term.length <= 5 ? 1 : 2;
    let best: { word: string; distance: number; count: number } | null = null;
    for (const [word, count] of VOCABULARY) {
      // Same first letter: people rarely get that one wrong, and it avoids odd swaps.
      if (word[0] !== term[0]) continue;
      const distance = editDistance(term, word, max);
      if (distance > max) continue;
      if (!best || distance < best.distance || (distance === best.distance && count > best.count)) best = { word, distance, count };
    }
    if (!best) return term;
    changed = true;
    return best.word;
  });
  return changed ? fixed.join(" ") : null;
}
