-- AlterTable
ALTER TABLE `heart_transactions` ADD COLUMN `balance` INTEGER NULL,
    ADD COLUMN `productId` VARCHAR(191) NULL,
    ADD COLUMN `purchaseDate` DATETIME(3) NULL,
    ADD COLUMN `transactionId` VARCHAR(191) NULL;
