-- CreateTable
CREATE TABLE `Docket` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `builderId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `scheduleNo` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `siteManagerName` VARCHAR(191) NULL,
    `siteManagerSignatureUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Docket_date_idx`(`date`),
    INDEX `Docket_builderId_locationId_date_idx`(`builderId`, `locationId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocketEntry` (
    `id` VARCHAR(191) NOT NULL,
    `docketId` VARCHAR(191) NOT NULL,
    `contractorId` VARCHAR(191) NOT NULL,
    `tonnageHours` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `dayLabourHours` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocketEntry_docketId_idx`(`docketId`),
    INDEX `DocketEntry_contractorId_idx`(`contractorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocketMedia` (
    `id` VARCHAR(191) NOT NULL,
    `docketId` VARCHAR(191) NOT NULL,
    `type` ENUM('PHOTO', 'VIDEO') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Docket` ADD CONSTRAINT `Docket_builderId_fkey` FOREIGN KEY (`builderId`) REFERENCES `Builder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Docket` ADD CONSTRAINT `Docket_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `BuilderLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Docket` ADD CONSTRAINT `Docket_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocketEntry` ADD CONSTRAINT `DocketEntry_docketId_fkey` FOREIGN KEY (`docketId`) REFERENCES `Docket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocketEntry` ADD CONSTRAINT `DocketEntry_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `Contractor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocketMedia` ADD CONSTRAINT `DocketMedia_docketId_fkey` FOREIGN KEY (`docketId`) REFERENCES `Docket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
