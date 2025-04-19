/*
  Warnings:

  - You are about to drop the `AlertBanner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CardProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeatureFlag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeaturedEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `YouTubeSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AlertBanner";

-- DropTable
DROP TABLE "CardProduct";

-- DropTable
DROP TABLE "FeatureFlag";

-- DropTable
DROP TABLE "FeaturedEvent";

-- DropTable
DROP TABLE "YouTubeSettings";

-- CreateTable
CREATE TABLE "card_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setName" TEXT,
    "imageFront" TEXT NOT NULL,
    "imageBack" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "marketPrice" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL,
    "rarity" TEXT,
    "printing" TEXT,
    "language" TEXT,
    "releaseDate" TIMESTAMP(3),
    "cardType" TEXT,
    "tcgplayerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_banners" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#E6B325',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "bulletPoints" TEXT[],
    "link" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_settings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "playlistId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_products_slug_key" ON "card_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");
