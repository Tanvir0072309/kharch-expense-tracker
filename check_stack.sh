#!/bin/bash
# Layer-by-layer health check for the Kharch stack.
# Run this from the project root: ./check_stack.sh
# It tells you EXACTLY which layer is broken instead of guessing.

set -uo pipefail
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass() { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${YELLOW}[..]${NC} $1"; }

echo "===================================================="
echo " 1. Container status (docker compose ps)"
echo "===================================================="
docker compose ps

echo
echo "===================================================="
echo " 2. etcd (Patroni's coordination store)"
echo "===================================================="
if docker compose exec -T etcd etcdctl endpoint health >/tmp/etcd.log 2>&1; then
  pass "etcd is healthy"
else
  fail "etcd is NOT healthy — nothing else can work until this is fixed"
  cat /tmp/etcd.log
fi

echo
echo "===================================================="
echo " 3. Patroni cluster state per shard (who is leader?)"
echo "===================================================="
for shard in 1 2 3; do
  echo "--- shard-$shard ---"
  if docker compose exec -T postgres-$shard curl -s http://localhost:8008/cluster 2>/tmp/patroni$shard.log; then
    echo
  else
    fail "shard-$shard Patroni REST API not responding"
    cat /tmp/patroni$shard.log
  fi
done

echo
echo "===================================================="
echo " 4. Postgres primaries reachable directly"
echo "===================================================="
for shard in 1 2 3; do
  if docker compose exec -T postgres-$shard pg_isready -h 127.0.0.1 -p 5432 >/tmp/pg$shard.log 2>&1; then
    pass "postgres-$shard (primary) is accepting connections"
  else
    fail "postgres-$shard (primary) is NOT ready"
    cat /tmp/pg$shard.log
  fi
done

echo
echo "===================================================="
echo " 5. PgBouncer"
echo "===================================================="
if docker compose exec -T pgbouncer pg_isready -h 127.0.0.1 -p 6432 -U kharch_user -d kharch_shard0 >/tmp/pgb.log 2>&1; then
  pass "pgbouncer is reachable"
else
  fail "pgbouncer is NOT reachable"
  cat /tmp/pgb.log
fi

echo
echo "===================================================="
echo " 6. Redis"
echo "===================================================="
if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-}" ping 2>/dev/null | grep -q PONG; then
  pass "redis responded PONG"
else
  fail "redis did NOT respond PONG"
fi

echo
echo "===================================================="
echo " 7. API instances (internal health endpoint)"
echo "===================================================="
for api in api1 api2 api3; do
  if docker compose exec -T "$api" node -e "require('http').get('http://localhost:5000/', r => process.exit(r.statusCode===200?0:1))" 2>/tmp/$api.log; then
    pass "$api health endpoint returned 200"
  else
    fail "$api health endpoint did NOT return 200"
    docker compose logs --tail=30 "$api"
  fi
done

echo
echo "===================================================="
echo " 8. HAProxy -> API (the thing your phone actually hits)"
echo "===================================================="
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -qE "200|503"; then
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
  if [ "$code" = "200" ]; then
    pass "http://localhost:8080/ returned 200 — backend is reachable from THIS machine"
    info "If the app still fails on your phone, the problem is EXPO_PUBLIC_API_BASE_URL in client/.env (localhost vs LAN IP), not the backend."
  else
    fail "http://localhost:8080/ returned $code"
  fi
else
  fail "http://localhost:8080/ is not reachable at all — haproxy container likely never started (check step 1 above for 'unhealthy' or missing containers)"
fi

echo
echo "Done. Fix issues top-to-bottom — a failure early in the list usually causes every failure below it."
