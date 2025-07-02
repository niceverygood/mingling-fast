-- AlterTable
ALTER TABLE `chats` ADD COLUMN `personaId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
