-- CreateEnum
CREATE TYPE "RideRequestType" AS ENUM ('GENERAL', 'FIRST_VISIT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'COMMUNITY_VERIFIED', 'PASTOR_VERIFIED');

-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "denomination" TEXT,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "serviceTimes" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "isPastor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RideRequest" ADD COLUMN     "type" "RideRequestType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "ChurchVouch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "churchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChurchVouch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChurchVouch_churchId_userId_key" ON "ChurchVouch"("churchId", "userId");

-- AddForeignKey
ALTER TABLE "ChurchVouch" ADD CONSTRAINT "ChurchVouch_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchVouch" ADD CONSTRAINT "ChurchVouch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
