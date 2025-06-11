/*
  Warnings:

  - You are about to drop the `printer_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "print_jobs" ADD COLUMN     "copies" INTEGER DEFAULT 1;

-- DropTable
DROP TABLE "printer_settings";
