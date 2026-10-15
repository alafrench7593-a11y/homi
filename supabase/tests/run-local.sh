#!/usr/bin/env bash
# Applique les migrations + seed sur un PostgreSQL 16 éphémère, puis exécute
# les tests de sécurité (RLS) et de logique métier.
# Usage : npm run db:test         (nécessite les binaires PostgreSQL 16)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGPORT_TEST:-54329}"
WORK="$(mktemp -d)"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then RUN_AS=(runuser -u postgres --); chown postgres "$WORK"; fi

cleanup() { "${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUN_AS[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust --locale=C.UTF-8 >/dev/null
"${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -d postgres -c "create database toietmoi" >/dev/null
DB=("${PSQL[@]}" -d toietmoi)

echo "→ Émulation Supabase"
"${DB[@]}" -f "$ROOT/supabase/tests/supabase_shim.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ Migration $(basename "$f")"
  "${DB[@]}" -f "$f" >/dev/null
done
echo "→ Données de développement"
"${DB[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null

STATUS=0
for t in "$ROOT"/supabase/tests/sql/*.sql; do
  echo "→ Tests $(basename "$t")"
  if ! "${DB[@]}" -f "$t"; then STATUS=1; fi
done
exit $STATUS
