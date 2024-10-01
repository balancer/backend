-- Rename column
alter table "PartitionedPoolEvent" rename column "vaultVersion" to "protocolVersion";
alter table "PrismaPool" rename column "vaultVersion" to "protocolVersion";
alter table "PrismaPoolSnapshot" rename column "vaultVersion" to "protocolVersion";

-- RenameIndex
ALTER INDEX "PartitionedPoolEvent_vaultVersion_idx" RENAME TO "PartitionedPoolEvent_protocolVersion_idx";

-- RenameIndex
ALTER INDEX "PrismaPoolSnapshot_vaultVersion_idx" RENAME TO "PrismaPoolSnapshot_protocolVersion_idx";
