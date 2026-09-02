#!/bin/bash

echo "=== STEP 1: Clean shard-2 and shard-3 directories ==="
sudo rm -rf infrastructure/patroni/shard-2
sudo rm -rf infrastructure/patroni/shard-3

echo "=== STEP 2: Create new directories ==="
mkdir -p infrastructure/patroni/shard-2
mkdir -p infrastructure/patroni/shard-3

echo "=== STEP 3: Fix ownership ==="
sudo chown -R $USER:$USER infrastructure/patroni/shard-2 infrastructure/patroni/shard-3

echo "=== STEP 4: Copy config files from shard-1 ==="
cp infrastructure/patroni/shard-1/patroni-primary.yml infrastructure/patroni/shard-2/patroni-primary.yml
cp infrastructure/patroni/shard-1/patroni-replica.yml infrastructure/patroni/shard-2/patroni-replica.yml
cp infrastructure/patroni/shard-1/patroni-primary.yml infrastructure/patroni/shard-3/patroni-primary.yml
cp infrastructure/patroni/shard-1/patroni-replica.yml infrastructure/patroni/shard-3/patroni-replica.yml

echo "=== STEP 5: Modify shard-2 configs ==="
sed -i 's/kharch-shard-1/kharch-shard-2/g' infrastructure/patroni/shard-2/patroni-primary.yml
sed -i 's/shard-1-primary/shard-2-primary/g' infrastructure/patroni/shard-2/patroni-primary.yml
sed -i 's/shard-1-node-1/shard-2-node-1/g' infrastructure/patroni/shard-2/patroni-primary.yml
sed -i 's/kharch-shard-1/kharch-shard-2/g' infrastructure/patroni/shard-2/patroni-replica.yml
sed -i 's/shard-1-primary/shard-2-primary/g' infrastructure/patroni/shard-2/patroni-replica.yml
sed -i 's/shard-1-node-1/shard-2-node-1/g' infrastructure/patroni/shard-2/patroni-replica.yml

echo "=== STEP 6: Modify shard-3 configs ==="
sed -i 's/kharch-shard-1/kharch-shard-3/g' infrastructure/patroni/shard-3/patroni-primary.yml
sed -i 's/shard-1-primary/shard-3-primary/g' infrastructure/patroni/shard-3/patroni-primary.yml
sed -i 's/shard-1-node-1/shard-3-node-1/g' infrastructure/patroni/shard-3/patroni-primary.yml
sed -i 's/kharch-shard-1/kharch-shard-3/g' infrastructure/patroni/shard-3/patroni-replica.yml
sed -i 's/shard-1-primary/shard-3-primary/g' infrastructure/patroni/shard-3/patroni-replica.yml
sed -i 's/shard-1-node-1/shard-3-node-1/g' infrastructure/patroni/shard-3/patroni-replica.yml

echo "=== STEP 7: Fix passwords ==="
find infrastructure/patroni/shard-2 infrastructure/patroni/shard-3 -name "*.yml" -exec sed -i 's/password: ${POSTGRES_PASSWORD}/password: "tanvir@7860"/g' {} \;

echo "=== STEP 8: Remove old containers ==="
docker compose down

echo "=== STEP 9: Remove old volumes ==="
docker volume rm kharch_postgres_2_data kharch_postgres_2_replica_data kharch_postgres_3_data kharch_postgres_3_replica_data 2>/dev/null || true

echo "=== STEP 10: Start everything ==="
docker compose up -d

echo "=== STEP 11: Wait ==="
sleep 60

echo "=== STEP 12: Check status ==="
docker compose ps

echo "=== DONE ==="
