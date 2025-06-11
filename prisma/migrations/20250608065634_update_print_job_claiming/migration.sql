/*
  Warnings:

  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "user_profiles";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "label_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "last_tried_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_settings" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "printer_name" TEXT NOT NULL,
    "paper_size" TEXT NOT NULL,
    "orientation" TEXT NOT NULL,
    "color_mode" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "printer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "printer_settings_agent_id_key" ON "printer_settings"("agent_id");
