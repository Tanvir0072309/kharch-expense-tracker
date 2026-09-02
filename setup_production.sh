#!/bin/bash

echo "========================================="
echo "PRODUCTION SETUP - COMPLETE BACKEND"
echo "========================================="

# ==========================================
# 1. API SCALING (3 INSTANCES)
# ==========================================
echo "=== 1. SETUP API SCALING ==="

# Docker swarm init
docker swarm init 2>/dev/null || echo "Swarm already initialized"

# docker-compose.yml update for scaling
cat > docker-compose-production.yml << 'COMPOSE'
version: '3.8'

services:
  # ============ API CLUSTER ============
  api:
    image: kharch-api:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
    environment:
      PORT: 5000
      SHARD_0_HOST: shard-1-primary
      SHARD_0_PORT: 5432
      SHARD_0_DB: kharch
      SHARD_0_USER: postgres
      SHARD_0_PASSWORD: tanvir@7860
      SHARD_1_HOST: shard-2-primary
      SHARD_1_PORT: 5432
      SHARD_1_DB: kharch
      SHARD_1_USER: postgres
      SHARD_1_PASSWORD: tanvir@7860
      SHARD_2_HOST: shard-3-primary
      SHARD_2_PORT: 5432
      SHARD_2_DB: kharch
      SHARD_2_USER: postgres
      SHARD_2_PASSWORD: tanvir@7860
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: tanvir@7860
    networks:
      - kharch_network

  # ============ PGBOUNCER ============
  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      DB_HOST: shard-1-primary
      DB_USER: postgres
      DB_PASSWORD: tanvir@7860
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 50
    ports:
      - "6432:5432"
    networks:
      - kharch_network

  # ============ REDIS CLUSTER ============
  redis:
    image: redis:8-alpine
    command: redis-server --requirepass tanvir@7860 --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - kharch_network

  # ============ MONITORING ============
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - kharch_network

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - kharch_network

networks:
  kharch_network:
    external: true
COMPOSE

echo "✅ Production compose file created"

# ==========================================
# 2. MONITORING SETUP
# ==========================================
echo ""
echo "=== 2. SETUP MONITORING ==="

mkdir -p monitoring

cat > monitoring/prometheus.yml << 'PROM'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:5000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['shard-1-primary:5432', 'shard-2-primary:5432', 'shard-3-primary:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
PROM

echo "✅ Monitoring configured"

# ==========================================
# 3. BACKUP SETUP
# ==========================================
echo ""
echo "=== 3. SETUP BACKUP ==="

mkdir -p backups

cat > backup.sh << 'BACKUP'
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
BACKUP

chmod +x backup.sh

# Cron job for daily backup
echo "0 2 * * * /backup.sh" | crontab -

echo "✅ Backup automation configured"

# ==========================================
# 4. REDIS CACHING SETUP
# ==========================================
echo ""
echo "=== 4. SETUP REDIS CACHING ==="

cat > server/src/middleware/cache.js << 'CACHE'
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD
});

client.connect().catch(console.error);

const cache = (duration = 60) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await client.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            res.sendResponse = res.json;
            res.json = (body) => {
                client.setEx(key, duration, JSON.stringify(body));
                res.sendResponse(body);
            };
            
            next();
        } catch (err) {
            next();
        }
    };
};

module.exports = cache;
CACHE

echo "✅ Redis caching middleware created"

# ==========================================
# 5. RATE LIMITING SETUP
# ==========================================
echo ""
echo "=== 5. SETUP RATE LIMITING ==="

cat > server/src/middleware/rateLimit.js << 'RATE'
const rateLimit = (options = {}) => {
    const windowMs = options.windowMs || 60000; // 1 minute
    const max = options.max || 100; // 100 requests per minute
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        
        if (recentRequests.length >= max) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        
        recentRequests.push(now);
        requests.set(key, recentRequests);
        next();
    };
};

module.exports = rateLimit;
RATE

echo "✅ Rate limiting added"

echo ""
echo "========================================="
echo "SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Services added:"
echo "✅ 3 API instances"
echo "✅ PgBouncer"
echo "✅ Redis caching"
echo "✅ Prometheus monitoring"
echo "✅ Grafana dashboards"
echo "✅ Automated backups"
echo "✅ Rate limiting"
echo ""
echo "Next steps:"
echo "1. docker stack deploy -c docker-compose-production.yml kharch"
echo "2. Access Grafana: http://localhost:3000"
echo "3. Access Prometheus: http://localhost:9090"
