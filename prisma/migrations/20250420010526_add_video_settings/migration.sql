-- CreateTable
CREATE TABLE "VideoSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "src" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'application/x-mpegURL',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "poster" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT 'Live Stream',
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoSettings_pkey" PRIMARY KEY ("id")
);
