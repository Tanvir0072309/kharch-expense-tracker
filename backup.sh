#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup all shards
for shard in 1 2 3; do
    echo "Backing up shard $shard..."
    docker exec kharch-patroni-shard-${shard}-primary \
        pg_dump -U postgres kharch > ${BACKUP_DIR}/shard_${shard}_${DATE}.sql
done

# Compress backups
tar -czf ${BACKUP_DIR}/full_backup_${DATE}.tar.gz ${BACKUP_DIR}/*.sql
rm ${BACKUP_DIR}/*.sql

echo "Backup completed: full_backup_${DATE}.tar.gz"
