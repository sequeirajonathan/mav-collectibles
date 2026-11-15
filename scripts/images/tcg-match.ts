/**
 * Matches a card as the shop named it in Square to a product in TCGplayer's
 * catalogue. Deliberately strict: a wrong photo is worse than no replacement,
 * so anything ambiguous returns null and staff still review every match.
 */
export interface TcgGroup {
  groupId: number;
  name: string;
  abbreviation: string | null;
}

export interface TcgProduct {
  productId: number;
  name: string;
  /** Collector number, when the product has one (e.g. "183/165"). */
  number: string | null;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The set a Square item name refers to: by "(CODE)" at the end, else by set name. */
export function pickGroup(itemName: string, groups: TcgGroup[]): TcgGroup | null {
  const code = itemName.match(/\(([A-Za-z0-9:-]{2,10})\)\s*$/)?.[1]?.toUpperCase();
  if (code) {
    const byCode = groups.filter((g) => g.abbreviation?.toUpperCase() === code);
    if (byCode.length === 1) return byCode[0];
  }
  const name = ` ${words(itemName)} `;
  const byName = groups
    .filter((g) => words(g.name).length >= 8 && name.includes(` ${words(g.name)} `))
    .sort((a, b) => b.name.length - a.name.length);
  if (!byName.length) return null;
  // Two different sets of the same (longest) name length would be a coin toss.
  return byName.length > 1 && byName[0].name.length === byName[1].name.length ? null : byName[0];
}

const tokens = (s: string) => words(s).split(" ").filter(Boolean).map((t) => t.replace(/^0+(?=\d)/, ""));

/** True when `needle` appears in `haystack` as a run of whole tokens ("16/195" in "… 016/195 …", not in "116/195"). */
function hasRun(haystack: string[], needle: string[]): boolean {
  if (!needle.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((t, j) => haystack[i + j] === t)) return true;
  }
  return false;
}

/** "Charizard ex - 183/165" → "Charizard ex" (TCGplayer appends the number to some names). */
const baseName = (p: TcgProduct) => p.name.split(" - ")[0];

/**
 * The product in a set that this item is, or null unless exactly one fits.
 *
 * 1. The collector number appears in the item name and every word of the
 *    product's name does too ("Celebi V 245/264 (Alternate Full Art)").
 * 2. Otherwise the item's card name is exactly one product's name
 *    ("Mew VMAX - Fusion Strike (SWSH08)" → "Mew VMAX", not "Mew V").
 */
export function pickProduct(itemName: string, products: TcgProduct[]): TcgProduct | null {
  const itemTokens = tokens(itemName);
  const itemSet = new Set(itemTokens);

  const byNumber = products
    .filter((p) => p.number && hasRun(itemTokens, tokens(p.number)) && tokens(baseName(p)).every((t) => itemSet.has(t)))
    .sort((a, b) => tokens(baseName(b)).length - tokens(baseName(a)).length);
  if (byNumber.length) {
    // Two equally specific products with this number: don't guess.
    return byNumber.length > 1 && tokens(baseName(byNumber[0])).length === tokens(baseName(byNumber[1])).length ? null : byNumber[0];
  }

  // No number to go on: the part before " - Set name" must be one product's exact name.
  // If the item states a number and nothing above matched it, it's a different printing.
  if (/\d\s*\/\s*[A-Za-z0-9-]*\w/.test(itemName)) return null;
  const cardName = words(itemName.split(" - ")[0]);
  const exact = products.filter((p) => words(baseName(p)) === cardName);
  return exact.length === 1 ? exact[0] : null;
}
