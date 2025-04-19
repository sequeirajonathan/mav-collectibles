/*
  Warnings:

  - Made the column `playlistId` on table `YouTubeSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "YouTubeSettings" ALTER COLUMN "id" SET DEFAULT '1',
ALTER COLUMN "playlistId" SET NOT NULL,
ALTER COLUMN "playlistId" SET DEFAULT '';
