/*
  Warnings:

  - A unique constraint covering the columns `[impUid]` on the table `heart_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `heart_transactions` ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `heartAmount` INTEGER NULL,
    ADD COLUMN `impUid` VARCHAR(191) NULL,
    ADD COLUMN `merchantUid` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `refundedAt` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `heart_transactions_impUid_key` ON `heart_transactions`(`impUid`);
