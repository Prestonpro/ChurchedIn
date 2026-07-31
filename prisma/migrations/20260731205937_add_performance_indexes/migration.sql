-- CreateIndex
CREATE INDEX "ChurchPartnership_partnerChurchId_idx" ON "ChurchPartnership"("partnerChurchId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Membership_churchId_idx" ON "Membership"("churchId");

-- CreateIndex
CREATE INDEX "Event_churchId_status_startsAt_idx" ON "Event"("churchId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Event_churchId_createdAt_idx" ON "Event"("churchId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "EventCohost_userId_idx" ON "EventCohost"("userId");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_status_idx" ON "EventRsvp"("userId", "status");

-- CreateIndex
CREATE INDEX "MentorConnection_mentorId_idx" ON "MentorConnection"("mentorId");

-- CreateIndex
CREATE INDEX "RideRequest_churchId_status_date_idx" ON "RideRequest"("churchId", "status", "date");

-- CreateIndex
CREATE INDEX "RideRequest_studentId_idx" ON "RideRequest"("studentId");

-- CreateIndex
CREATE INDEX "RideRequest_volunteerId_idx" ON "RideRequest"("volunteerId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

