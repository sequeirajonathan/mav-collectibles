import { Category, CategoryGroup } from '@interfaces';

// Mapping of Square categories to route-friendly names
export const CATEGORY_MAPPING: Record<string, Category> = {
  "Pokemon TCG": {
    displayName: "Pokémon",
    routeName: "pokemon",
    squareCategory: "Pokemon TCG"
  },
  "Dragon Ball Super TCG": {
    displayName: "Dragon Ball",
    routeName: "dragonball",
    squareCategory: "Dragon Ball Super TCG"
  },
  "One Piece Card Game": {
    displayName: "One Piece",
    routeName: "onepiece",
    squareCategory: "One Piece Card Game"
  },
  "Yu-Gi-Oh": {
    displayName: "Yu-Gi-Oh!",
    routeName: "yugioh",
    squareCategory: "Yu-Gi-Oh"
  },
  "Magic The Gathering": {
    displayName: "Magic",
    routeName: "magic",
    squareCategory: "Magic The Gathering"
  },
  "Weiss Schwarz": {
    displayName: "Weiss Schwarz",
    routeName: "weiss",
    squareCategory: "Weiss Schwarz"
  },
  "Digimon": {
    displayName: "Digimon",
    routeName: "digimon",
    squareCategory: "Digimon"
  },
  "Metazoo": {
    displayName: "Metazoo",
    routeName: "metazoo",
    squareCategory: "Metazoo"
  },
  "Union Arena": {
    displayName: "Union Arena",
    routeName: "union",
    squareCategory: "Union Arena"
  },
  "Uni Verses": {
    displayName: "Uni Verses",
    routeName: "universe",
    squareCategory: "Uni Verses"
  },
  "Lorcana": {
    displayName: "Lorcana",
    routeName: "lorcana",
    squareCategory: "Lorcana"
  },
  "Flesh & Blood TCG": {
    displayName: "Flesh & Blood",
    routeName: "fleshblood",
    squareCategory: "Flesh & Blood TCG"
  },
  "STAR WARS UNLIMITED": {
    displayName: "Star Wars",
    routeName: "starwars",
    squareCategory: "STAR WARS UNLIMITED"
  },
  "Grand Archive": {
    displayName: "Grand Archive",
    routeName: "grandarchive",
    squareCategory: "Grand Archive"
  }
};

// Collectibles and Figures
export const COLLECTIBLES_MAPPING: Record<string, Category> = {
  "Figures": {
    displayName: "Figures",
    routeName: "figures",
    squareCategory: "Figures"
  },
  "Funko": {
    displayName: "Funko",
    routeName: "funko",
    squareCategory: "Funko"
  },
  "Plushies": {
    displayName: "Plushies",
    routeName: "plushies",
    squareCategory: "Plushies"
  },
  "TOYS": {
    displayName: "Toys",
    routeName: "toys",
    squareCategory: "TOYS"
  },
  "Bandai Namco": {
    displayName: "Bandai",
    routeName: "bandai",
    squareCategory: "Bandai Namco"
  },
  "Square Enix": {
    displayName: "Square Enix",
    routeName: "squareenix",
    squareCategory: "Square Enix"
  }
};

// Grading and Supplies
export const SUPPLIES_MAPPING: Record<string, Category> = {
  "Hobby Supplies": {
    displayName: "Supplies",
    routeName: "supplies",
    squareCategory: "Hobby Supplies"
  },
  "Graded Guard": {
    displayName: "Graded Guard",
    routeName: "gradedguard",
    squareCategory: "Graded Guard"
  },
  "Graded Cards Slabs": {
    displayName: "Graded Cards",
    routeName: "gradedcards",
    squareCategory: "Graded Cards Slabs"
  }
};

// Organized category groups for navigation
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "Trading Card Games",
    categories: Object.values(CATEGORY_MAPPING)
  },
  {
    name: "Collectibles",
    categories: Object.values(COLLECTIBLES_MAPPING)
  },
  {
    name: "Supplies & Grading",
    categories: Object.values(SUPPLIES_MAPPING)
  }
]; 