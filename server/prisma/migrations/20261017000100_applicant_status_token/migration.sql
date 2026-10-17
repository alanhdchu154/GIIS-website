-- Additive applicant status-token fields for Application.
-- Nullable and backward-compatible: the backend can be deployed before or after
-- the frontend in either direction and existing rows will simply have NULL values.
-- No backfill is required or performed.
ALTER TABLE "Application"
  ADD COLUMN "statusTokenHash" TEXT,
  ADD COLUMN "statusTokenIssuedAt" TIMESTAMP(3),
  ADD COLUMN "statusTokenRotatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Application_statusTokenHash_key" ON "Application"("statusTokenHash");
