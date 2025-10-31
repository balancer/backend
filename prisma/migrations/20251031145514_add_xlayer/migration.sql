-- AlterEnum
ALTER TYPE "Chain" ADD VALUE 'XLAYER';
-- Events partition
CREATE TABLE events_xlayer PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('XLAYER');