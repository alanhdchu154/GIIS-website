-- Existing-account-safe staff RBAC rollout.
-- Existing AdminUser rows were the only administrators before RBAC, so they are
-- explicitly promoted once. New rows remain inactive/read-only until invited.
ALTER TABLE "AdminUser"
  ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'support_read_only',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AdminUser"
SET "role" = 'owner', "isActive" = true;

CREATE TABLE "StaffInvite" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "displayName" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT NOT NULL DEFAULT 'invite',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "invitedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");
CREATE INDEX "StaffInvite_email_idx" ON "StaffInvite"("email");
CREATE INDEX "StaffInvite_expiresAt_idx" ON "StaffInvite"("expiresAt");
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StaffAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorAdminId" TEXT NOT NULL,
  "targetAdminId" TEXT,
  "targetEmail" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffAuditLog_actorAdminId_createdAt_idx" ON "StaffAuditLog"("actorAdminId", "createdAt");
CREATE INDEX "StaffAuditLog_targetAdminId_createdAt_idx" ON "StaffAuditLog"("targetAdminId", "createdAt");
CREATE INDEX "StaffAuditLog_targetEmail_createdAt_idx" ON "StaffAuditLog"("targetEmail", "createdAt");
ALTER TABLE "StaffAuditLog" ADD CONSTRAINT "StaffAuditLog_actorAdminId_fkey"
  FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffAuditLog" ADD CONSTRAINT "StaffAuditLog_targetAdminId_fkey"
  FOREIGN KEY ("targetAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlacementDecision"
  ADD COLUMN "principalApproverId" TEXT;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_principalApproverId_fkey"
  FOREIGN KEY ("principalApproverId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TransferCreditEvaluation"
  ADD COLUMN "principalApproverEmail" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "principalApproverId" TEXT;
ALTER TABLE "TransferCreditEvaluation" ADD CONSTRAINT "TransferCreditEvaluation_principalApproverId_fkey"
  FOREIGN KEY ("principalApproverId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
