-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "lastSeenEventsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChurchPartnership" (
    "id" TEXT NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "requestingChurchId" TEXT NOT NULL,
    "partnerChurchId" TEXT NOT NULL,

    CONSTRAINT "ChurchPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChurchPartnership_requestingChurchId_partnerChurchId_key" ON "ChurchPartnership"("requestingChurchId", "partnerChurchId");

-- AddForeignKey
ALTER TABLE "ChurchPartnership" ADD CONSTRAINT "ChurchPartnership_requestingChurchId_fkey" FOREIGN KEY ("requestingChurchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchPartnership" ADD CONSTRAINT "ChurchPartnership_partnerChurchId_fkey" FOREIGN KEY ("partnerChurchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
