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

if [ -n "${EXPORT_DEMO_JSON:-}" ]; then
  echo "→ Export du contenu de démonstration vers $EXPORT_DEMO_JSON"
  "${DB[@]}" -At -c "select jsonb_pretty(jsonb_build_object(
    'content_categories', (select jsonb_agg(t order by position) from public.content_categories t),
    'articles', (select jsonb_agg(to_jsonb(t) - 'created_at' order by slug) from public.articles t where status = 'published'),
    'forums', (select jsonb_agg(t order by position) from public.forums t),
    'emergency_resources', (select jsonb_agg(t order by position) from public.emergency_resources t),
    'foods', (select jsonb_agg(to_jsonb(t) - 'created_at' order by name) from public.foods t),
    'baby_names', (select jsonb_agg(to_jsonb(t) - 'created_at' order by name) from public.baby_names t),
    'products', (select jsonb_agg(to_jsonb(t) - 'created_at') from public.products t),
    'product_recalls', (select jsonb_agg(to_jsonb(t) - 'created_at') from public.product_recalls t),
    'plan_limits', (select jsonb_agg(t) from public.plan_limits t)))" > "$EXPORT_DEMO_JSON"
  exit 0
fi

# Les tests 00 à 89 décrivent les règles d'avant le Premium strict (quotas de la version gratuite, etc.) :
# ils tournent avec le verrouillage désactivé. 90_premium_strict.sql le réactive et teste le modèle strict.
"${DB[@]}" -c "update public.premium_policy set strict = false" >/dev/null

STATUS=0
for t in "$ROOT"/supabase/tests/sql/*.sql; do
  echo "→ Tests $(basename "$t")"
  if ! "${DB[@]}" -f "$t"; then STATUS=1; fi
done
exit $STATUS
