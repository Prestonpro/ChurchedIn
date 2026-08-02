-- CreateTable
CREATE TABLE "RideOffer" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volunteerId" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,

    CONSTRAINT "RideOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideOfferClaim" (
    "id" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rideOfferId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "RideOfferClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideOffer_churchId_date_idx" ON "RideOffer"("churchId", "date");

-- CreateIndex
CREATE INDEX "RideOffer_volunteerId_idx" ON "RideOffer"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "RideOfferClaim_rideOfferId_studentId_key" ON "RideOfferClaim"("rideOfferId", "studentId");

-- CreateIndex
CREATE INDEX "RideOfferClaim_studentId_idx" ON "RideOfferClaim"("studentId");

-- AddForeignKey
ALTER TABLE "RideOffer" ADD CONSTRAINT "RideOffer_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOffer" ADD CONSTRAINT "RideOffer_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOfferClaim" ADD CONSTRAINT "RideOfferClaim_rideOfferId_fkey" FOREIGN KEY ("rideOfferId") REFERENCES "RideOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideOfferClaim" ADD CONSTRAINT "RideOfferClaim_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
