import { Category, CategoryGroup } from '@interfaces';

// Extend base category to include Square metadata
export interface SquareCategory extends Category {
  squareId: string;
  squareCategory: string;
}

// --- Main TCG Categories ---
export const CATEGORY_MAPPING: Record<string, SquareCategory> = {
  "Pokemon TCG": {
    displayName: "Pokémon",
    routeName: "pokemon",
    squareCategory: "Pokemon TCG",
    squareId: "JLGE7O4IOUUW36IB6ZJYWKUU",
  },
  "Dragon Ball Super TCG": {
    displayName: "Dragon Ball",
    routeName: "dragonball",
    squareCategory: "Dragon Ball Super TCG",
    squareId: "CQ3NSXZ4V3Q5ZHCMS4WS3YP6",
  },
  "One Piece Card Game": {
    displayName: "One Piece",
    routeName: "onepiece",
    squareCategory: "One Piece Card Game",
    squareId: "B6KGCQABXQDHFISWSRBS4QHF",
  },
  "Yu-Gi-Oh": {
    displayName: "Yu-Gi-Oh!",
    routeName: "yugioh",
    squareCategory: "Yu-Gi-Oh",
    squareId: "PLVAPCRCS4TJYIBC7CDALXYK",
  },
  "Magic The Gathering": {
    displayName: "Magic",
    routeName: "magic",
    squareCategory: "Magic The Gathering",
    squareId: "LXZB7FOIRUA2YASQFGDHL2EF",
  },
  "Weiss Schwarz": {
    displayName: "Weiss Schwarz",
    routeName: "weiss",
    squareCategory: "Weiss Schwarz",
    squareId: "LQFRABCCR6DAFY4PSUWMO224",
  },
  "Digimon": {
    displayName: "Digimon",
    routeName: "digimon",
    squareCategory: "Digimon",
    squareId: "SGHRJGTL6NRQZ7KZ2MUTK2YA",
  },
  "Metazoo": {
    displayName: "Metazoo",
    routeName: "metazoo",
    squareCategory: "Metazoo",
    squareId: "ZIAZS6CHBXSSNYAZZFYHVXNL",
  },
  "Union Arena": {
    displayName: "Union Arena",
    routeName: "union",
    squareCategory: "Union Arena",
    squareId: "4VRRPJ3MOQWD2SOCVTV6YD2X",
  },
  "Uni Verses": {
    displayName: "Uni Verses",
    routeName: "universe",
    squareCategory: "Uni Verses",
    squareId: "RWSUXUIFXXKHNGE4IZMECBBU",
  },
  "Lorcana": {
    displayName: "Lorcana",
    routeName: "lorcana",
    squareCategory: "Lorcana",
    squareId: "ULPV5UD3L5JKS52EYP7F64NX",
  },
  "Flesh & Blood TCG": {
    displayName: "Flesh & Blood",
    routeName: "fleshblood",
    squareCategory: "Flesh & Blood TCG",
    squareId: "Z4TJ2BADGYQJSUPJUH2Y3422",
  },
  "STAR WARS UNLIMITED": {
    displayName: "Star Wars",
    routeName: "starwars",
    squareCategory: "STAR WARS UNLIMITED",
    squareId: "VTABJTWESVYYHE5SXAH4NKJE",
  },
  "Grand Archive": {
    displayName: "Grand Archive",
    routeName: "grandarchive",
    squareCategory: "Grand Archive",
    squareId: "5LEDQBMCJINSREERRQL4J2SG",
  },
  "Soul masters Tcg": {
    displayName: "Soul Masters",
    routeName: "soulmasters",
    squareCategory: "Soul masters Tcg",
    squareId: "GESEFRWGMQAWUAGSEDQ2WMLB",
  },
};

// --- Collectibles ---
export const COLLECTIBLES_MAPPING: Record<string, SquareCategory> = {
  "Figures": {
    displayName: "Figures",
    routeName: "figures",
    squareCategory: "Figures",
    squareId: "HEUDTMZDNG5LLI3ZSCCC2KIL",
  },
  "Funko": {
    displayName: "Funko",
    routeName: "funko",
    squareCategory: "Funko",
    squareId: "DMXYKGGPUSSZZBZMRC5LNLPV",
  },
  "Plushies": {
    displayName: "Plushies",
    routeName: "plushies",
    squareCategory: "Plushies",
    squareId: "Y3HB2FYHP74AAKQ3MNMOQRYU",
  },
  "TOYS": {
    displayName: "Toys",
    routeName: "toys",
    squareCategory: "TOYS",
    squareId: "Y5QMJDVTICGYS63MD5G3MIXA",
  },
  "Bandai Namco": {
    displayName: "Bandai",
    routeName: "bandai",
    squareCategory: "Bandai Namco",
    squareId: "2WGAXPFOCVU6E3YCKLENXCBZ",
  },
  "Square Enix": {
    displayName: "Square Enix",
    routeName: "squareenix",
    squareCategory: "Square Enix",
    squareId: "2UYGU6IBT5CC2XHPOFISKRDC",
  },
};

// --- Supplies & Grading ---
export const SUPPLIES_MAPPING: Record<string, SquareCategory> = {
  "Hobby Supplies": {
    displayName: "Supplies",
    routeName: "supplies",
    squareCategory: "Hobby Supplies",
    squareId: "5PVJ4PTPSZQOWQAPNX2ABSZY",
  },
  "PSA SERVICE": {
    displayName: "PSA Service",
    routeName: "psa",
    squareCategory: "PSA SERVICE",
    squareId: "POBB6MGCLVUC2DPPTPMLBLIL",
  },
  "Graded Guard": {
    displayName: "Graded Guard",
    routeName: "gradedguard",
    squareCategory: "Graded Guard",
    squareId: "6RZANZZZ62FG33XW6AMMC5OI",
  },
  "Graded Cards Slabs": {
    displayName: "Graded Cards",
    routeName: "gradedcards",
    squareCategory: "Graded Cards Slabs",
    squareId: "SSTM2PVN2UEFTH72HLUBI7TI",
  },
};

// --- Events ---
export const EVENTS_MAPPING: Record<string, SquareCategory> = {
  "WHEEL SPIN": {
    displayName: "Wheel Spin",
    routeName: "wheelspin",
    squareCategory: "WHEEL SPIN",
    squareId: "T2CGZVNJAQXDNS6ZTOC3ULGC",
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