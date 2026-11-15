import { describe, expect, it } from "vitest";
import { byRelevance, correctedTerms, isSearchable, relevance, searchTerms, squareKeywords, suggestQuery } from "@lib/catalog/search-query";

describe("search terms", () => {
  it("ignores case, accents and punctuation", () => {
    expect(searchTerms("Pokémon")).toEqual(["pokemon"]);
    expect(searchTerms("Charizard-ex")).toEqual(["charizard", "ex"]);
    expect(searchTerms("Monkey.D.Luffy")).toEqual(["monkey", "d", "luffy"]);
  });

  it("expands collector shorthand", () => {
    expect(searchTerms("etb")).toEqual(["elite", "trainer", "box"]);
    expect(searchTerms("top loaders")).toEqual(["toploader"]);
    expect(searchTerms("mtg booster")).toEqual(["magic", "booster"]);
  });

  it("trims plurals so they match singular product names", () => {
    expect(searchTerms("booster packs")).toEqual(["booster", "pack"]);
    expect(searchTerms("deck boxes")).toEqual(["deck", "box"]);
    expect(searchTerms("glass")).toEqual(["glass"]);
  });

  it("drops filler words but keeps a query made only of them", () => {
    expect(searchTerms("the charizard card")).toEqual(["charizard"]);
    expect(searchTerms("cards")).toEqual(["card"]);
  });

  it("knows when a query is too short to search", () => {
    expect(isSearchable("ch")).toBe(false);
    expect(isSearchable(" ")).toBe(false);
    expect(isSearchable("151")).toBe(true);
    expect(isSearchable("mew")).toBe(true);
  });

  it("sends Square its three most specific words", () => {
    expect(squareKeywords(searchTerms("one piece booster box english"))).toEqual(["booster", "english", "piece"]);
    expect(squareKeywords(searchTerms("mew ex"))).toEqual(["mew"]);
  });
});

describe("ranking", () => {
  const items = [
    { name: "Pokemon TCG: Obsidian Flames Booster Pack" }, // matched through its description
    { name: "Charizard ex - 125/197 - Obsidian Flames" },
    { name: "Pokemon - Charizard-Ex Fire Blast Box" },
    { name: "Radiant Charizard - 011/078" },
  ];

  it("puts products named after the search first", () => {
    const ranked = byRelevance(items, searchTerms("charizard ex"), "name_asc").map((i) => i.name);
    expect(ranked[0]).toBe("Charizard ex - 125/197 - Obsidian Flames");
    expect(ranked[1]).toBe("Pokemon - Charizard-Ex Fire Blast Box");
    expect(ranked.at(-1)).toBe("Pokemon TCG: Obsidian Flames Booster Pack");
  });

  it("scores full name matches above partial and description-only ones", () => {
    const terms = searchTerms("umbreon vmax");
    expect(relevance("Umbreon VMAX (Secret) - 214/203", terms)).toBeGreaterThan(relevance("Umbreon V - 094/203", terms));
    expect(relevance("Umbreon V - 094/203", terms)).toBeGreaterThan(relevance("Evolving Skies Booster Pack", terms));
  });

  it("keeps the chosen name order among equal matches", () => {
    const same = [{ name: "Pikachu B" }, { name: "Pikachu A" }];
    expect(byRelevance(same, ["pikachu"], "name_asc").map((i) => i.name)).toEqual(["Pikachu A", "Pikachu B"]);
    expect(byRelevance(same, ["pikachu"], "name_desc").map((i) => i.name)).toEqual(["Pikachu B", "Pikachu A"]);
  });
});

describe("spelling suggestions", () => {
  it("fixes common misspellings from the catalog's own words", () => {
    expect(suggestQuery("charzard")).toBe("charizard");
    expect(suggestQuery("pikachoo vmax")).toBe("pikachu vmax");
    expect(suggestQuery("umbrion")).toBe("umbreon");
  });

  it("leaves correct words, prefixes, numbers and nonsense alone", () => {
    expect(suggestQuery("charizard")).toBeNull();
    expect(suggestQuery("chari")).toBeNull();
    expect(suggestQuery("151")).toBeNull();
    expect(suggestQuery("zzzzqqqq")).toBeNull();
  });
});

describe("ranking fuzzy matches", () => {
  it("works out the intended word from the names that matched", () => {
    const names = ["APEX Sleeves - Charizard", "Charizard ex - 006/165", "Radiant Charizard", "Charmander - 004/165"];
    expect(correctedTerms(["charzard"], names)).toEqual(["charizard"]);
    expect(correctedTerms(["charzard", "ex"], names)).toEqual(["charizard", "ex"]);
    // Already a real word, or nothing close: left alone.
    expect(correctedTerms(["charizard"], names)).toEqual(["charizard"]);
    expect(correctedTerms(["zzzzzz"], names)).toEqual(["zzzzzz"]);
  });
});
