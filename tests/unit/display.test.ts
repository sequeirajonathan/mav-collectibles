import { describe, expect, it } from "vitest";
import { tidyProductName } from "@lib/catalog/display";

describe("tidyProductName", () => {
  it.each([
    ["Pokemon TCG- Scarlet Ex Booster Pack (JPN)", "Pokémon TCG - Scarlet Ex Booster Pack (JPN)"],
    [" Pokemon Scale World Johto Region 14", "Pokémon Scale World Johto Region 14"],
    ["Dragon Ball Super -Blazing Aura Booster Box", "Dragon Ball Super - Blazing Aura Booster Box"],
    ["Dragon Shield -  Matte Night Bu (100)", "Dragon Shield - Matte Night Bu (100)"],
    ["CGC 9 Squirtle 170\\165", "CGC 9 Squirtle 170/165"],
    ["Dragon Ball Super TCG : Mythic Booster", "Dragon Ball Super TCG: Mythic Booster"],
    ["GLC NIght Pokemon League - ", "GLC NIght Pokémon League"],
  ])("%s", (input, expected) => {
    expect(tidyProductName(input)).toBe(expected);
  });

  it("leaves set codes and hyphenated words alone", () => {
    expect(tidyProductName("Resurgence Booster (RB-01) Spider-Man X-Y 174/172")).toBe("Resurgence Booster (RB-01) Spider-Man X-Y 174/172");
  });
});
