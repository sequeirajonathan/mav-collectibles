import { CategoryGroup } from "@interfaces";

interface SquareCategory {
  displayName: string;
  slug: string;
  squareCategoryId: string;
}

// --- Main TCG Categories ---
export const CATEGORY_MAPPING: Record<string, SquareCategory> = {
  pokemon: {
    displayName: "Pokémon TCG",
    slug: "pokemon",
    squareCategoryId: "JLGE7O4IOUUW36IB6ZJYWKUU",
  },
  dragonball: {
    displayName: "Dragon Ball Super TCG",
    slug: "dragonball",
    squareCategoryId: "CQ3NSXZ4V3Q5ZHCMS4WS3YP6",
  },
  onepiece: {
    displayName: "One Piece Card Game",
    slug: "onepiece",
    squareCategoryId: "B6KGCQABXQDHFISWSRBS4QHF",
  },
  yugioh: {
    displayName: "Yu-Gi-Oh!",
    slug: "yugioh",
    squareCategoryId: "PLVAPCRCS4TJYIBC7CDALXYK",
  },
  magic: {
    displayName: "Magic The Gathering",
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
    displayName: "Flesh & Blood TCG",
    slug: "fleshblood",
    squareCategoryId: "Z4TJ2BADGYQJSUPJUH2Y3422",
  },
  starwars: {
    displayName: "Star Wars Unlimited",
    slug: "starwars",
    squareCategoryId: "VTABJTWESVYYHE5SXAH4NKJE",
  },
  grandarchive: {
    displayName: "Grand Archive",
    slug: "grandarchive",
    squareCategoryId: "5LEDQBMCJINSREERRQL4J2SG",
  },
  soulmasters: {
    displayName: "Soul Masters TCG",
    slug: "soulmasters",
    squareCategoryId: "GESEFRWGMQAWUAGSEDQ2WMLB",
  },
  pokemonsingles: {
    displayName: "Pokemon - Singles",
    slug: "pokemonsingles",
    squareCategoryId: "ZPLTFCCZRS3FENOS4324RK4E",
  },
  squareenix: {
    displayName: "Square Enix",
    slug: "squareenix",
    squareCategoryId: "2UYGU6IBT5CC2XHPOFISKRDC",
  },
  magicsingles: {
    displayName: "Magic - Singles",
    slug: "magicsingles",
    squareCategoryId: "NGKVLCPJP3KCNPDLFTDMQTNU",
  },
  onepiecesingles: {
    displayName: "One Piece - Singles",
    slug: "onepiecesingles",
    squareCategoryId: "QQS47L524ANFOBBRF2D6SESX",
  },
  gundam: {
    displayName: "Gundam Card Game",
    slug: "gundam",
    squareCategoryId: "BFW7GRSGGJBJWZUGG7KUDECG",
  },
  gundamsingles: {
    displayName: "Gundam - Singles",
    slug: "gundamsingles",
    squareCategoryId: "5WUAU7NFG4ERG3372BSS3MLH",
  },
  riftbound: {
    displayName: "Riftbound",
    slug: "riftbound",
    squareCategoryId: "YD2VF354ISLPOEUSCOXI6UBU",
  },
  riftboundsingles: {
    displayName: "Riftbound - Singles",
    slug: "riftboundsingles",
    squareCategoryId: "5TGTD7WPUKFIWBFAL3BFW474",
  },
  dragonballsingles: {
    displayName: "Dragon Ball Super - Singles",
    slug: "dragonballsingles",
    squareCategoryId: "4MUPRDYBMNOSTLOVEL7TDAYC",
  },
  kayou: {
    displayName: "Kayou",
    slug: "kayou",
    squareCategoryId: "XBZIXYRGMG7IEW4TZ62BBCRC",
  },
  hololive: {
    displayName: "hololive",
    slug: "hololive",
    squareCategoryId: "Y7YB3ZVBR7OMVVSM7QVSZXWO",
  },
  cyberpunk: {
    displayName: "Cyberpunk TCG",
    slug: "cyberpunk",
    squareCategoryId: "UT27M3NIJ4UBHJR4WNRY6TEJ",
  },
  mylittlepony: {
    displayName: "My Little Pony Card Game",
    slug: "mylittlepony",
    squareCategoryId: "P5SOUPU5A4D7PXJNSA4VCGFY",
  },
  godzilla: {
    displayName: "Godzilla CCG",
    slug: "godzilla",
    squareCategoryId: "GWWSFKEVE73YMN6KRUQ3Z2RX",
  },
  upperdeck: {
    displayName: "Upper Deck",
    slug: "upperdeck",
    squareCategoryId: "TFWS4HRNXN754MS4XOXH3ESN",
  },
  historicautographs: {
    displayName: "Historic Autographs",
    slug: "historicautographs",
    squareCategoryId: "O2FWHTIHBRGGZVY67HQHDPHD",
  },
};

// Not on the site on purpose: food and drinks, plushies (in-store only),
// "TCG Player" (order records), "League Tournaments & Play" (event entries),
// "Psa Submission" (customer grading orders) and uncategorized items.
// lib/catalog/visibility.ts hides everything that isn't mapped here.

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
  toys: {
    displayName: "Toys",
    slug: "toys",
    squareCategoryId: "Y5QMJDVTICGYS63MD5G3MIXA",
  },
  bandai: {
    displayName: "Bandai Namco",
    slug: "bandai",
    squareCategoryId: "2WGAXPFOCVU6E3YCKLENXCBZ",
  },
  warhammer: {
    displayName: "Warhammer",
    slug: "warhammer",
    squareCategoryId: "Z3AWPKEXIN67IDNOKDHPNDDN",
  },
  blindbox: {
    displayName: "Blind Boxes",
    slug: "blindbox",
    squareCategoryId: "TGPKVNWRJFIGW62G7UC5AC22",
  },
  beyblade: {
    displayName: "Beyblade X",
    slug: "beyblade",
    squareCategoryId: "JIPD374HBCITPZYM2SA3P375",
  },
  dnd: {
    displayName: "Dungeons & Dragons",
    slug: "dnd",
    squareCategoryId: "2HL3F6YAGBPLTO2VAF44LI6E",
  },
  loungefly: {
    displayName: "Loungefly",
    slug: "loungefly",
    squareCategoryId: "TLUKD2E5H6IBGDDHZBDDPZH4",
  },
  lego: {
    displayName: "LEGO",
    slug: "lego",
    squareCategoryId: "A54XSEGLMO3REDGUAHNMWFXN",
  },
  videogames: {
    displayName: "Video Games",
    slug: "videogames",
    squareCategoryId: "YTNN3DVBI25PMTIC5C462IDU",
  },
  gamingsystems: {
    displayName: "Gaming Systems",
    slug: "gamingsystems",
    squareCategoryId: "ZPYQGLLBGE4CZ265FANV7B4M",
  },
  comics: {
    displayName: "Marvel Comics",
    slug: "comics",
    squareCategoryId: "W4ABQUJXOFNZGQSVDFXCBGMY",
  },
  mavmerch: {
    displayName: "MAV Merch",
    slug: "mavmerch",
    squareCategoryId: "6YVXJCIP6MDSPZI6VBYXH3AB",
  },
};

// --- Supplies & Grading ---
export const SUPPLIES_MAPPING: Record<string, SquareCategory> = {
  supplies: {
    displayName: "Hobby Supplies",
    slug: "supplies",
    squareCategoryId: "5PVJ4PTPSZQOWQAPNX2ABSZY",
  },
  psa: {
    displayName: "PSA Graded Slabs",
    slug: "psa",
    squareCategoryId: "POBB6MGCLVUC2DPPTPMLBLIL",
  },
  beckett: {
    displayName: "Beckett Graded Slabs",
    slug: "beckett",
    squareCategoryId: "E4QEHP25KV63OP5BVG6BAWN5",
  },
  cgc: {
    displayName: "CGC Graded Slabs",
    slug: "cgc",
    squareCategoryId: "QWH464QRNC725KULVO6XJAP5",
  },
  tag: {
    displayName: "Tag Graded Slabs",
    slug: "tag",
    squareCategoryId: "BDXDK3UHNCYVGDP7XTXEGGGV",
  },
  gradedguard: {
    displayName: "Graded Guard",
    slug: "gradedguard",
    squareCategoryId: "6RZANZZZ62FG33XW6AMMC5OI",
  },
  dice: {
    displayName: "Dice",
    slug: "dice",
    squareCategoryId: "NMNP2OPWMLH7FC4BJ7XM2A2T",
  },
  manamoon: {
    displayName: "Mana Moon Deck Boxes",
    slug: "manamoon",
    squareCategoryId: "VUVSICIWIUGTVRV6UM37O2EH",
  },
  vaultx: {
    displayName: "Vault X",
    slug: "vaultx",
    squareCategoryId: "YR653WFRWM3NUPODELOBJDP2",
  },
  paints: {
    displayName: "Paints & Brushes",
    slug: "paints",
    squareCategoryId: "NRCG6EHIYYYRH2DMTOVRWDY7",
  },
  paragonforge: {
    displayName: "Paragon Forge Bags",
    slug: "paragonforge",
    squareCategoryId: "J6NRXZTSKW73JZC4IIOFSH4O",
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
];

export const CATEGORY_GROUP_SLUGS: Record<string, string[]> = {
  tcg: Object.values(CATEGORY_MAPPING).map((cat) => cat.squareCategoryId),
  collectibles: Object.values(COLLECTIBLES_MAPPING).map(
    (cat) => cat.squareCategoryId
  ),
  supplies: Object.values(SUPPLIES_MAPPING).map((cat) => cat.squareCategoryId),
};
