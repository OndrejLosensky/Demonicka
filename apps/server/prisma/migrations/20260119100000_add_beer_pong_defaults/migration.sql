-- CreateTable (idempotent for 000_baseline)
CREATE TABLE IF NOT EXISTS "BeerPongDefaults" (
    "id" UUID NOT NULL,
    "beersPerPlayer" INTEGER NOT NULL DEFAULT 2,
    "timeWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "undoWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'KEEP_BEERS',
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BeerPongDefaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongDefaults_updatedBy_idx" ON "BeerPongDefaults"("updatedBy");

