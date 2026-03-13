/*
  Warnings:

  - The values [COMMON,UNCOMMON,RARE,EPIC,LEGENDARY] on the enum `Card_rarity` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Card` ADD COLUMN `category` ENUM('HISTORY', 'SCIENCE', 'ART', 'GEOGRAPHY', 'ENTERTAINMENT') NULL,
    ADD COLUMN `popularity` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `quality` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `tier` ENUM('COMMON', 'RARE', 'SUPER_RARE', 'SPEC_SUPER_RARE') NULL,
    MODIFY `imageUrl` TEXT NULL,
    MODIFY `wikiUrl` TEXT NOT NULL,
    MODIFY `rarity` ENUM('C', 'UC', 'R', 'SR', 'SSR', 'UR', 'LR') NOT NULL;

-- AlterTable
ALTER TABLE `Player` ADD COLUMN `avatarUrl` TEXT NULL,
    ADD COLUMN `eloRating` INTEGER NOT NULL DEFAULT 1200,
    ADD COLUMN `googleId` VARCHAR(191) NULL,
    ADD COLUMN `lastLogin` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `matchesPlayed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pityCounter` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Mission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rewardCredits` INTEGER NOT NULL,
    `type` ENUM('DAILY', 'LIFETIME') NOT NULL,
    `criteria` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `playerId` VARCHAR(191) NOT NULL,
    `missionId` INTEGER NOT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `isClaimed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `UserMission_playerId_idx`(`playerId`),
    INDEX `UserMission_missionId_idx`(`missionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trophy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Trophy_playerId_idx`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `channel` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',

    INDEX `ChatMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PvPMatch` (
    `id` VARCHAR(191) NOT NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NOT NULL,
    `status` ENUM('MATCHMAKING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'MATCHMAKING',
    `winnerId` VARCHAR(191) NULL,
    `logs` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PvPMatch_player1Id_idx`(`player1Id`),
    INDEX `PvPMatch_player2Id_idx`(`player2Id`),
    INDEX `PvPMatch_winnerId_idx`(`winnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Player_googleId_key` ON `Player`(`googleId`);

-- AddForeignKey
ALTER TABLE `UserMission` ADD CONSTRAINT `UserMission_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMission` ADD CONSTRAINT `UserMission_missionId_fkey` FOREIGN KEY (`missionId`) REFERENCES `Mission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trophy` ADD CONSTRAINT `Trophy_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PvPMatch` ADD CONSTRAINT `PvPMatch_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PvPMatch` ADD CONSTRAINT `PvPMatch_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PvPMatch` ADD CONSTRAINT `PvPMatch_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
