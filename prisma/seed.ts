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

  // Create default feature flags
  await prisma.featureFlag.upsert({
    where: { name: 'showAlertBanner' },
    update: {},
    create: {
      name: 'showAlertBanner',
      description: 'Controls visibility of the alert banner at the top of the site',
      enabled: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { name: 'showFeaturedEvents' },
    update: {},
    create: {
      name: 'showFeaturedEvents',
      description: 'Controls visibility of featured events on the homepage',
      enabled: true,
    },
  });

  // Create default alert banner
  await prisma.alertBanner.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      message: 'Free shipping on orders $50 and up',
      code: 'FREESHIP50',
      backgroundColor: '#E6B325',
      textColor: '#000000',
      enabled: true,
    },
  });

  // Create a sample featured event
  await prisma.featuredEvent.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'Pokémon TCG Championship',
      date: 'December 15, 2023',
      description: 'Join us for our monthly Pokémon Trading Card Game championship! Great prizes for top players.',
      imageSrc: '/images/pokemon-event.jpg',
      imageAlt: 'Pokémon Trading Card Game Championship',
      bulletPoints: [
        'Date: December 15, 2023',
        'Time: 1:00 PM - 6:00 PM',
        'Entry Fee: $10',
        'Prizes: Booster packs and exclusive promos',
      ],
      link: '/events/pokemon-championship',
      enabled: true,
      order: 0,
    },
  });

  // Add this to your existing seed script
  await prisma.youTubeSettings.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      videoId: 'V8D_ELNVRko',
      title: 'Featured Video',
      autoplay: true,
      muted: true,
      playlistId: '',
    },
  });

  // Add this to your feature flags in the seed file
  await prisma.featureFlag.upsert({
    where: { name: 'showYouTubeVideo' },
    update: {},
    create: {
      name: 'showYouTubeVideo',
      description: 'Controls visibility of the YouTube video on the homepage',
      enabled: true,
    },
  });

  // Add this to your feature flags in the seed file
  await prisma.featureFlag.upsert({
    where: { name: 'showVideoPlayer' },
    update: {},
    create: {
      name: 'showVideoPlayer',
      description: 'Controls visibility of the direct streaming video player on the homepage',
      enabled: false,
    },
  });

  // Add this to your feature flags in the seed file
  await prisma.featureFlag.upsert({
    where: { name: 'showDirectStreaming' },
    update: {},
    create: {
      name: 'showDirectStreaming',
      description: 'Controls visibility of direct streaming video on the homepage',
      enabled: false,
    },
  });

  // Add a default video settings with a more reliable test stream
  await prisma.videoSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      src: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", // Akamai test stream
      type: "application/x-mpegURL",
      isLive: true,
      poster: "",
      title: "Test Stream",
      autoplay: true,
      muted: true
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
