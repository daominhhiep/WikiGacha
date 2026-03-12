-- CreateTable
CREATE TABLE `Player` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `credits` INTEGER NOT NULL DEFAULT 100,
    `level` INTEGER NOT NULL DEFAULT 1,
    `xp` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Player_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `wikiUrl` VARCHAR(191) NOT NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL,
    `hp` INTEGER NOT NULL,
    `atk` INTEGER NOT NULL,
    `def` INTEGER NOT NULL,
    `pageViews` INTEGER NOT NULL,
    `languageCount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `acquiredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Inventory_playerId_idx`(`playerId`),
    INDEX `Inventory_cardId_idx`(`cardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Battle` (
    `id` VARCHAR(191) NOT NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NULL,
    `winnerId` VARCHAR(191) NULL,
    `log` JSON NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Battle_player1Id_idx`(`player1Id`),
    INDEX `Battle_player2Id_idx`(`player2Id`),
    INDEX `Battle_winnerId_idx`(`winnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Battle` ADD CONSTRAINT `Battle_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Battle` ADD CONSTRAINT `Battle_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Battle` ADD CONSTRAINT `Battle_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
