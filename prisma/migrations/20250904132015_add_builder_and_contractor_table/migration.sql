-- CreateTable
CREATE TABLE `Builder` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyCode` VARCHAR(191) NOT NULL,
    `abn` VARCHAR(20) NULL,
    `phone` VARCHAR(30) NULL,
    `address` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `supervisorRate` DECIMAL(10, 2) NULL,
    `tieHandRate` DECIMAL(10, 2) NULL,
    `tonnageRate` DECIMAL(10, 2) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Builder_companyCode_key`(`companyCode`),
    INDEX `Builder_name_idx`(`name`),
    INDEX `Builder_companyCode_idx`(`companyCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuilderLocation` (
    `id` VARCHAR(191) NOT NULL,
    `builderId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BuilderLocation_builderId_idx`(`builderId`),
    UNIQUE INDEX `BuilderLocation_builderId_label_key`(`builderId`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contractor` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NULL,
    `hourlyRate` DECIMAL(10, 2) NOT NULL,
    `abn` VARCHAR(20) NULL,
    `bankName` VARCHAR(191) NULL,
    `bsb` VARCHAR(10) NULL,
    `accountNo` VARCHAR(32) NULL,
    `phone` VARCHAR(30) NULL,
    `homeAddress` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `experience` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contractor_userId_key`(`userId`),
    UNIQUE INDEX `Contractor_email_key`(`email`),
    UNIQUE INDEX `Contractor_nickname_key`(`nickname`),
    INDEX `Contractor_nickname_idx`(`nickname`),
    INDEX `Contractor_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BuilderLocation` ADD CONSTRAINT `BuilderLocation_builderId_fkey` FOREIGN KEY (`builderId`) REFERENCES `Builder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contractor` ADD CONSTRAINT `Contractor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
