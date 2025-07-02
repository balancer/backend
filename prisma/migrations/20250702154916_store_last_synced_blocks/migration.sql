INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'MAINNET', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MAINNET' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'MAINNET', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MAINNET' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'MAINNET', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MAINNET' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'MAINNET', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MAINNET' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'BASE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'BASE' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'BASE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'BASE' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'BASE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'BASE' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'BASE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'BASE' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'ARBITRUM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ARBITRUM' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'ARBITRUM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ARBITRUM' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'ARBITRUM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ARBITRUM' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'ARBITRUM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ARBITRUM' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'GNOSIS', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'GNOSIS' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'GNOSIS', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'GNOSIS' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'GNOSIS', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'GNOSIS' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'GNOSIS', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'GNOSIS' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'SONIC', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SONIC' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'SONIC', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SONIC' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'SONIC', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SONIC' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'SONIC', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SONIC' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'FANTOM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FANTOM' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'FANTOM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FANTOM' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'FANTOM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FANTOM' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'FANTOM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FANTOM' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'OPTIMISM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'OPTIMISM' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'OPTIMISM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'OPTIMISM' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'OPTIMISM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'OPTIMISM' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'OPTIMISM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'OPTIMISM' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'MODE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MODE' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'MODE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MODE' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'MODE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MODE' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'MODE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'MODE' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'FRAXTAL', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FRAXTAL' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'FRAXTAL', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FRAXTAL' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'FRAXTAL', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FRAXTAL' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'FRAXTAL', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'FRAXTAL' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'POLYGON', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'POLYGON' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'POLYGON', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'POLYGON' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'POLYGON', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'POLYGON' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'POLYGON', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'POLYGON' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'ZKEVM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ZKEVM' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'ZKEVM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ZKEVM' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'ZKEVM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ZKEVM' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'ZKEVM', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'ZKEVM' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'AVALANCHE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'AVALANCHE' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'AVALANCHE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'AVALANCHE' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'AVALANCHE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'AVALANCHE' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'AVALANCHE', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'AVALANCHE' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V2', 'SEPOLIA', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SEPOLIA' AND "protocolVersion" = 2 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V2', 'SEPOLIA', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SEPOLIA' AND "protocolVersion" = 2 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'JOIN_EXITS_V3', 'SEPOLIA', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SEPOLIA' AND "protocolVersion" = 3 AND (type = 'JOIN' OR type = 'EXIT') ORDER BY "blockNumber" DESC LIMIT 1;

INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT 'SWAPS_V3', 'SEPOLIA', "blockNumber"
FROM "PartitionedPoolEvent"
WHERE chain = 'SEPOLIA' AND "protocolVersion" = 3 AND type = 'SWAP' ORDER BY "blockNumber" DESC LIMIT 1;
