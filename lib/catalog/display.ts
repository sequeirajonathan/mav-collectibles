/**
 * Tidies a product name for display. Names are typed by hand at the register,
 * so spacing and punctuation vary; the stored name is never changed.
 */
export function tidyProductName(name: string): string {
  return name
    .replace(/\\/g, "/")
    .replace(/\bPokemon\b/gi, "Pokémon")
    // "TCG- Name", "Name -Set", "Name  -  Set" → "Name - Set" (leaves "BT-01" and "X-Y" alone).
    .replace(/\s+-\s*|\s*-\s+/g, " - ")
    .replace(/\s*:\s+/g, ": ")
    .replace(/\s+/g, " ")
    .replace(/^[\s-]+|[\s-]+$/g, "");
}
