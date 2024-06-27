CREATE TABLE events_fraxtal PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('FRAXTAL');
CREATE TABLE events_mode PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('MODE');

INSERT INTO "PrismaLastBlockSynced" ("category", "chain", "blockNumber") VALUES ('POOLS', 'FRAXTAL', 4708596), ('POOLS', 'MODE', 8110317) ON CONFLICT ("category", "chain") DO NOTHING;
