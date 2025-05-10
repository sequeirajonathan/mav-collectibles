import { CategoryGroup } from "@interfaces";

export interface SquareCategory {
  displayName: string;
  slug: string;
  squareCategoryId: string;
}

// --- Main TCG Categories ---
export const CATEGORY_MAPPING: Record<string, SquareCategory> = {
  pokemon: {
    displayName: "Pokémon",
    slug: "pokemon",
    squareCategoryId: "JLGE7O4IOUUW36IB6ZJYWKUU",
  },
  dragonball: {
    displayName: "Dragon Ball",
    slug: "dragonball",
    squareCategoryId: "CQ3NSXZ4V3Q5ZHCMS4WS3YP6",
  },
  onepiece: {
    displayName: "One Piece",
    slug: "onepiece",
    squareCategoryId: "B6KGCQABXQDHFISWSRBS4QHF",
  },
  yugioh: {
    displayName: "Yu-Gi-Oh!",
    slug: "yugioh",
    squareCategoryId: "PLVAPCRCS4TJYIBC7CDALXYK",
  },
  magic: {
    displayName: "Magic",
    slug: "magic",
    squareCategoryId: "LXZB7FOIRUA2YASQFGDHL2EF",
  },
  weiss: {
    displayName: "Weiss Schwarz",
    slug: "weiss",
    squareCategoryId: "LQFRABCCR6DAFY4PSUWMO224",
  },
  digimon: {
    displayName: "Digimon",
    slug: "digimon",
    squareCategoryId: "SGHRJGTL6NRQZ7KZ2MUTK2YA",
  },
  metazoo: {
    displayName: "Metazoo",
    slug: "metazoo",
    squareCategoryId: "ZIAZS6CHBXSSNYAZZFYHVXNL",
  },
  union: {
    displayName: "Union Arena",
    slug: "union",
    squareCategoryId: "4VRRPJ3MOQWD2SOCVTV6YD2X",
  },
  universe: {
    displayName: "Uni Verses",
    slug: "universe",
    squareCategoryId: "RWSUXUIFXXKHNGE4IZMECBBU",
  },
  lorcana: {
    displayName: "Lorcana",
    slug: "lorcana",
    squareCategoryId: "ULPV5UD3L5JKS52EYP7F64NX",
  },
  fleshblood: {
    displayName: "Flesh & Blood",
    slug: "fleshblood",
    squareCategoryId: "Z4TJ2BADGYQJSUPJUH2Y3422",
  },
  starwars: {
    displayName: "Star Wars",
    slug: "starwars",
    squareCategoryId: "VTABJTWESVYYHE5SXAH4NKJE",
  },
  grandarchive: {
    displayName: "Grand Archive",
    slug: "grandarchive",
    squareCategoryId: "5LEDQBMCJINSREERRQL4J2SG",
  },
  soulmasters: {
    displayName: "Soul Masters",
    slug: "soulmasters",
    squareCategoryId: "GESEFRWGMQAWUAGSEDQ2WMLB",
  },
};

// --- Collectibles ---
export const COLLECTIBLES_MAPPING: Record<string, SquareCategory> = {
  figures: {
    displayName: "Figures",
    slug: "figures",
    squareCategoryId: "HEUDTMZDNG5LLI3ZSCCC2KIL",
  },
  funko: {
    displayName: "Funko",
    slug: "funko",
    squareCategoryId: "DMXYKGGPUSSZZBZMRC5LNLPV",
  },
  plushies: {
    displayName: "Plushies",
    slug: "plushies",
    squareCategoryId: "Y3HB2FYHP74AAKQ3MNMOQRYU",
  },
  toys: {
    displayName: "Toys",
    slug: "toys",
    squareCategoryId: "Y5QMJDVTICGYS63MD5G3MIXA",
  },
  bandai: {
    displayName: "Bandai",
    slug: "bandai",
    squareCategoryId: "2WGAXPFOCVU6E3YCKLENXCBZ",
  },
  squareenix: {
    displayName: "Square Enix",
    slug: "squareenix",
    squareCategoryId: "2UYGU6IBT5CC2XHPOFISKRDC",
  },
};

// --- Supplies & Grading ---
export const SUPPLIES_MAPPING: Record<string, SquareCategory> = {
  supplies: {
    displayName: "Supplies",
    slug: "supplies",
    squareCategoryId: "5PVJ4PTPSZQOWQAPNX2ABSZY",
  },
  psa: {
    displayName: "PSA Service",
    slug: "psa",
    squareCategoryId: "POBB6MGCLVUC2DPPTPMLBLIL",
  },
  gradedguard: {
    displayName: "Graded Guard",
    slug: "gradedguard",
    squareCategoryId: "6RZANZZZ62FG33XW6AMMC5OI",
  },
  gradedcards: {
    displayName: "Graded Cards",
    slug: "gradedcards",
    squareCategoryId: "SSTM2PVN2UEFTH72HLUBI7TI",
  },
};

// --- Events ---
export const EVENTS_MAPPING: Record<string, SquareCategory> = {
  wheelspin: {
    displayName: "Wheel Spin",
    slug: "wheelspin",
    squareCategoryId: "T2CGZVNJAQXDNS6ZTOC3ULGC",
  },
};

// --- Grouped for Navigation/Filtering ---
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "TCG",
    categories: Object.values(CATEGORY_MAPPING),
  },
  {
    name: "Collectibles",
    categories: Object.values(COLLECTIBLES_MAPPING),
  },
  {
    name: "Supplies & Grading",
    categories: Object.values(SUPPLIES_MAPPING),
  },
  {
    name: "Events",
    categories: Object.values(EVENTS_MAPPING),
  },
];

export const CATEGORY_GROUP_SLUGS: Record<string, string[]> = {
  tcg: Object.values(CATEGORY_MAPPING).map((cat) => cat.squareCategoryId),
  collectibles: Object.values(COLLECTIBLES_MAPPING).map(
    (cat) => cat.squareCategoryId
  ),
  supplies: Object.values(SUPPLIES_MAPPING).map((cat) => cat.squareCategoryId),
  events: Object.values(EVENTS_MAPPING).map((cat) => cat.squareCategoryId),
};
