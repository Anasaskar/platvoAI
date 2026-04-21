DO $$
BEGIN
    CREATE TYPE "public"."FileProcessingStatus" AS ENUM ('pending', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imagekitFileId" TEXT NOT NULL,
    "imagekitUrl" TEXT NOT NULL,
    "extractedText" TEXT,
    "status" "public"."FileProcessingStatus" NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "files_userId_idx" ON "public"."files"("userId");
CREATE INDEX IF NOT EXISTS "files_status_idx" ON "public"."files"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'files_userId_fkey'
    ) THEN
        ALTER TABLE "public"."files"
        ADD CONSTRAINT "files_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
