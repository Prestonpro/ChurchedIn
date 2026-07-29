-- CreateEnum
CREATE TYPE "MeetingFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "MentorMeetingPlan" (
    "id" TEXT NOT NULL,
    "frequency" "MeetingFrequency" NOT NULL,
    "dayOfWeek" INTEGER,
    "time" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "connectionId" TEXT NOT NULL,

    CONSTRAINT "MentorMeetingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorMeetingPlan_connectionId_key" ON "MentorMeetingPlan"("connectionId");

-- AddForeignKey
ALTER TABLE "MentorMeetingPlan" ADD CONSTRAINT "MentorMeetingPlan_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "MentorConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
