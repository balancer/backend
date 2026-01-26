-- Events partition
CREATE TABLE events_monad PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('MONAD');