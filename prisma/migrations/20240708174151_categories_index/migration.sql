-- CreateIndex
CREATE INDEX "PrismaPool_categories_idx" ON "PrismaPool" USING GIN ("categories" array_ops);
