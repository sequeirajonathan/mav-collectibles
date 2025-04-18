/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_productId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Inventory";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "PriceHistory";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "CardProduct" (
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

    CONSTRAINT "CardProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardProduct_slug_key" ON "CardProduct"("slug");
