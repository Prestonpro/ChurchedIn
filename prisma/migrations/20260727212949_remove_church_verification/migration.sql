-- DropForeignKey
ALTER TABLE "ChurchVouch" DROP CONSTRAINT "ChurchVouch_churchId_fkey";

-- DropForeignKey
ALTER TABLE "ChurchVouch" DROP CONSTRAINT "ChurchVouch_userId_fkey";

-- AlterTable
ALTER TABLE "Church" DROP COLUMN "verificationStatus";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "isPastor";

-- DropTable
DROP TABLE "ChurchVouch";

-- DropEnum
DROP TYPE "VerificationStatus";

