import { describe, expect, it } from "vitest";
import { pickGroup, pickProduct, type TcgGroup, type TcgProduct } from "../../scripts/images/tcg-match";

const groups: TcgGroup[] = [
  { groupId: 1, name: "SV: Scarlet & Violet 151", abbreviation: "MEW" },
  { groupId: 2, name: "SV07: Stellar Crown", abbreviation: "SCR" },
  { groupId: 3, name: "SV-P Promotional Cards", abbreviation: null },
  { groupId: 4, name: "Modern Horizons", abbreviation: "MH1" },
  { groupId: 5, name: "Modern Horizons 3", abbreviation: "MH3" },
];

const products: TcgProduct[] = [
  { productId: 10, name: "Charizard ex - 183/165", number: "183/165" },
  { productId: 11, name: "Charizard ex - 199/165", number: "199/165" },
  { productId: 12, name: "Charizard ex - 006/165", number: "006/165" },
  { productId: 13, name: "Pikachu", number: null },
  { productId: 14, name: "Pikachu (Master Ball Pattern)", number: null },
];

describe("pickGroup", () => {
  it("uses the set code at the end of the name", () => {
    expect(pickGroup("Charizard ex - 183/165 - SV: Scarlet & Violet 151 (MEW)", groups)?.groupId).toBe(1);
    expect(pickGroup("Kozilek's Command R0011 - Modern Horizons 3 (MH3)", groups)?.groupId).toBe(5);
  });
  it("falls back to the longest set name in the item name", () => {
    expect(pickGroup("Lacey - 172/142 - SV07: Stellar Crown", groups)?.groupId).toBe(2);
    expect(pickGroup("Eladamri's Call 197/254 - Modern Horizons 3", groups)?.groupId).toBe(5);
  });
  it("returns null when no set is named", () => {
    expect(pickGroup("Charizard VSTAR- 174/172- NM", groups)).toBeNull();
    expect(pickGroup("Jolteon (Master Ball Pattern) 051/187", groups)).toBeNull();
  });
});

describe("pickProduct", () => {
  it("matches on card name and collector number", () => {
    expect(pickProduct("Charizard ex - 183/165 - SV: Scarlet & Violet 151 (MEW)", products)?.productId).toBe(10);
    expect(pickProduct("Charizard ex 199/165 MEW", products)?.productId).toBe(11);
    expect(pickProduct("Charizard ex - 6/165 (MEW)", products)?.productId).toBe(12);
  });
  it("finds the number wherever it sits and prefers the most specific name", () => {
    const set: TcgProduct[] = [
      { productId: 30, name: "Celebi V", number: "001/264" },
      { productId: 31, name: "Celebi V (Alternate Full Art)", number: "245/264" },
    ];
    expect(pickProduct("Celebi V 245/264(Alternate Full Art) - Fusion Strike (SWSH08)", set)?.productId).toBe(31);
  });
  it("doesn't confuse 16/195 with 116/195", () => {
    const set: TcgProduct[] = [{ productId: 40, name: "Radiant Tsareena", number: "16/195" }];
    expect(pickProduct("Radiant Tsareena 016/195 - Silver Tempest", set)?.productId).toBe(40);
    expect(pickProduct("Radiant Tsareena 116/195 - Silver Tempest", set)).toBeNull();
  });
  it("won't guess between printings when the number is missing or different", () => {
    expect(pickProduct("Charizard ex - SV: Scarlet & Violet 151 (MEW)", products)).toBeNull();
    expect(pickProduct("Charizard ex - 201/165 (MEW)", products)).toBeNull();
  });
  it("accepts an exact, unique product name without a number", () => {
    const set: TcgProduct[] = [
      { productId: 50, name: "Mew V", number: "113/264" },
      { productId: 51, name: "Mew VMAX", number: "114/264" },
      { productId: 52, name: "Magnemite", number: "68/236" },
      { productId: 53, name: "Magnemite (Secret)", number: "242/236" },
    ];
    expect(pickProduct("Mew VMAX - SWSH08: Fusion Strike (SWSH08)", set)?.productId).toBe(51);
    expect(pickProduct("Magnemite (Secret) - SM - Cosmic Eclipse (SM12)", set)?.productId).toBe(53);
    expect(pickProduct("Pikachu (Master Ball Pattern)", products)?.productId).toBe(14);
  });
  it("doesn't match a different card that only shares a word", () => {
    expect(pickProduct("Detective Pikachu - 098/SV-P", [{ productId: 20, name: "Pikachu", number: "010/018" }])).toBeNull();
    expect(pickProduct("Charizard - 4/102", products)).toBeNull();
    // Same card name, but the item names a different printing's number.
    expect(pickProduct("Detective Pikachu - 098/SV-P - SV-P Promotional Cards", [{ productId: 21, name: "Detective Pikachu", number: "10/18" }])).toBeNull();
  });
});
