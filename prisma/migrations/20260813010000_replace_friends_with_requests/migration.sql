-- Replaces the Friends/mentor-matching feature (MentorProfile,
-- MentorConnection, MentorMeetingPlan) with a generalized HelpRequest
-- system, and rekeys Conversation/Message onto it. Hand-written (not
-- CLI-generated) since `prisma migrate diff` produced an unsafe
-- drop-and-recreate-everything script against this schema in this
-- environment/version — verified precise column/constraint/index names
-- against the actual prior migration files instead of trusting that
-- output. Applies cleanly to the throwaway e2e_test schema first (see
-- CLAUDE.md's migration workflow) before it ever touches `public`.

-- CreateEnum
CREATE TYPE "RequestCategory" AS ENUM ('FURNITURE', 'FOOD', 'MENTORSHIP', 'HOUSING', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'OPEN', 'CLAIMED', 'DECLINED', 'COMPLETED', 'CANCELLED');

-- AlterTable: carry MentorProfile's rich fields forward onto User
ALTER TABLE "User" ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "openToMentorship" BOOLEAN NOT NULL DEFAULT true;

-- DataMigration: backfill the new User columns from MentorProfile
UPDATE "User" u SET
  "jobTitle" = mp."jobTitle",
  "company" = mp."company",
  "industry" = mp."industry",
  "languages" = mp."languages",
  "hobbies" = mp."hobbies",
  "interests" = mp."interests",
  "linkedinUrl" = mp."linkedinUrl",
  "facebookUrl" = mp."facebookUrl",
  "instagramUrl" = mp."instagramUrl",
  "openToMentorship" = mp."openToMentor"
FROM "MentorProfile" mp
WHERE mp."userId" = u."id";

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "category" "RequestCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "requesterId" TEXT NOT NULL,
    "claimerId" TEXT,
    "churchId" TEXT NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- DataMigration: backfill HelpRequest from MentorConnection, reusing the
-- same id so Conversation.connectionId can be repointed by a plain rename
-- further down instead of a join. churchId is resolved the same way the
-- old lazy-conversation-creation logic did (a church both people are
-- members of) — rows where no shared church exists are skipped, matching
-- that same code's silent no-op in that edge case.
INSERT INTO "HelpRequest" ("id", "category", "title", "description", "status", "createdAt", "respondedAt", "requesterId", "claimerId", "churchId")
SELECT
  mc."id",
  'MENTORSHIP'::"RequestCategory",
  'Mentorship',
  mc."message",
  CASE mc."status"
    WHEN 'PENDING' THEN 'PENDING'::"RequestStatus"
    WHEN 'ACCEPTED' THEN 'CLAIMED'::"RequestStatus"
    WHEN 'DECLINED' THEN 'DECLINED'::"RequestStatus"
    WHEN 'ENDED' THEN 'COMPLETED'::"RequestStatus"
  END,
  mc."createdAt",
  mc."respondedAt",
  mc."studentId",
  mc."mentorId",
  (
    SELECT m1."churchId" FROM "Membership" m1
    JOIN "Membership" m2 ON m1."churchId" = m2."churchId"
    WHERE m1."userId" = mc."studentId" AND m2."userId" = mc."mentorId"
    LIMIT 1
  )
FROM "MentorConnection" mc
WHERE EXISTS (
  SELECT 1 FROM "Membership" m1
  JOIN "Membership" m2 ON m1."churchId" = m2."churchId"
  WHERE m1."userId" = mc."studentId" AND m2."userId" = mc."mentorId"
);

-- CreateTable
CREATE TABLE "RequestMeetingPlan" (
    "id" TEXT NOT NULL,
    "frequency" "MeetingFrequency" NOT NULL,
    "dayOfWeek" INTEGER,
    "time" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "RequestMeetingPlan_pkey" PRIMARY KEY ("id")
);

-- DataMigration: backfill from MentorMeetingPlan — skips any row whose
-- connection wasn't migrated above (the same shared-church edge case).
INSERT INTO "RequestMeetingPlan" ("id", "frequency", "dayOfWeek", "time", "notes", "updatedAt", "requestId")
SELECT "id", "frequency", "dayOfWeek", "time", "notes", "updatedAt", "connectionId"
FROM "MentorMeetingPlan"
WHERE "connectionId" IN (SELECT "id" FROM "HelpRequest");

-- CreateIndex
CREATE UNIQUE INDEX "RequestMeetingPlan_requestId_key" ON "RequestMeetingPlan"("requestId");

-- CreateIndex
CREATE INDEX "HelpRequest_churchId_status_category_createdAt_idx" ON "HelpRequest"("churchId", "status", "category", "createdAt");

-- CreateIndex
CREATE INDEX "HelpRequest_requesterId_idx" ON "HelpRequest"("requesterId");

-- CreateIndex
CREATE INDEX "HelpRequest_claimerId_idx" ON "HelpRequest"("claimerId");

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMeetingPlan" ADD CONSTRAINT "RequestMeetingPlan_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HelpRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rekey Conversation off HelpRequest instead of MentorConnection. Drop the
-- old FK before renaming connectionId, since a FK's referenced table can't
-- be changed in place — the column itself keeps its values unchanged
-- (HelpRequest reused MentorConnection's ids above, so every existing
-- Conversation.connectionId already matches a HelpRequest.id).
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_connectionId_fkey";

ALTER TABLE "Conversation" RENAME COLUMN "connectionId" TO "requestId";
ALTER TABLE "Conversation" RENAME COLUMN "studentId" TO "requesterId";
ALTER TABLE "Conversation" RENAME COLUMN "mentorId" TO "claimerId";

ALTER INDEX "Conversation_connectionId_key" RENAME TO "Conversation_requestId_key";
ALTER INDEX "Conversation_studentId_lastMessageAt_idx" RENAME TO "Conversation_requesterId_lastMessageAt_idx";
ALTER INDEX "Conversation_mentorId_lastMessageAt_idx" RENAME TO "Conversation_claimerId_lastMessageAt_idx";

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HelpRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the old Friends/mentor-matching tables, in dependency order.
ALTER TABLE "MentorMeetingPlan" DROP CONSTRAINT "MentorMeetingPlan_connectionId_fkey";
DROP TABLE "MentorMeetingPlan";

ALTER TABLE "MentorConnection" DROP CONSTRAINT "MentorConnection_studentId_fkey";
ALTER TABLE "MentorConnection" DROP CONSTRAINT "MentorConnection_mentorId_fkey";
DROP TABLE "MentorConnection";

ALTER TABLE "MentorProfile" DROP CONSTRAINT "MentorProfile_userId_fkey";
DROP TABLE "MentorProfile";

-- DropEnum
DROP TYPE "ConnectionStatus";
