-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "company" TEXT,
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "linkedinUrl" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "careerGoals" TEXT,
ADD COLUMN     "graduationYear" TEXT,
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "major" TEXT;
