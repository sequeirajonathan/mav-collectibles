import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.cardProduct.deleteMany(); // Clear previous seed

  await prisma.cardProduct.createMany({
    data: [
      {
        slug: 'charizard-ex-obsidian-flames',
        name: 'Charizard ex - Obsidian Flames',
        setName: 'Obsidian Flames',
        imageFront: 'https://images.pokemontcg.io/sv03/125_hires.png',
        imageBack: 'https://images.pokemontcg.io/sv03/125.png',
        price: 59.99,
        marketPrice: 62.5,
        quantity: 4,
        rarity: 'Ultra Rare',
        printing: 'Holo',
        language: 'English',
        releaseDate: new Date('2023-08-11'),
        cardType: 'Pokémon',
        tcgplayerId: 123456
      },
      {
        slug: 'pikachu-v-celebrations',
        name: 'Pikachu V - Celebrations',
        setName: 'Celebrations',
        imageFront: 'https://images.pokemontcg.io/swsh45/001_hires.png',
        imageBack: 'https://images.pokemontcg.io/swsh45/001.png',
        price: 12.99,
        marketPrice: 13.5,
        quantity: 12,
        rarity: 'Rare',
        printing: 'Holo',
        language: 'English',
        releaseDate: new Date('2021-10-08'),
        cardType: 'Pokémon',
        tcgplayerId: 654321
      },
      {
        slug: 'mewtwo-v-union-premium',
        name: 'Mewtwo V-UNION Premium Collection',
        setName: 'Promo Box',
        imageFront: 'https://images.pokemontcg.io/swsh45/mewtwo_hires.png',
        imageBack: 'https://images.pokemontcg.io/swsh45/mewtwo.png',
        price: 29.99,
        marketPrice: 31.0,
        quantity: 8,
        rarity: 'Promo',
        printing: 'Mixed',
        language: 'English',
        releaseDate: new Date('2022-01-01'),
        cardType: 'Pokémon',
        tcgplayerId: 987654
      }
    ]
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
