import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Removed cardProduct seeding since the model/table no longer exists

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
      date: new Date('2023-12-15T19:00:00.000Z'),
      description: 'Join us for our monthly Pokémon Trading Card Game championship! Great prizes for top players.',
      imageSrc: '/images/pokemon-event.jpg',
      imageAlt: 'Pokémon Trading Card Game Championship',
      link: '/events/pokemon-championship',
      enabled: true,
      order: 0,
    },
  });

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

  await prisma.featureFlag.upsert({
    where: { name: 'showYouTubeVideo' },
    update: {},
    create: {
      name: 'showYouTubeVideo',
      description: 'Controls visibility of the YouTube video on the homepage',
      enabled: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { name: 'showVideoPlayer' },
    update: {},
    create: {
      name: 'showVideoPlayer',
      description: 'Controls visibility of the direct streaming video player on the homepage',
      enabled: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { name: 'showDirectStreaming' },
    update: {},
    create: {
      name: 'showDirectStreaming',
      description: 'Controls visibility of direct streaming video on the homepage',
      enabled: false,
    },
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
