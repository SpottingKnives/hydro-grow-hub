#!/usr/bin/env bash
# Lightweight database health check.
#
# Reports, for every table in the `public` schema:
#   - whether Row-Level Security is enabled
#   - the number of RLS policies attached
#   - whether the ownership enforcement trigger is present
#   - whether a `user_id` ownership column exists
#
# Requires the standard Supabase PG* env vars to be set (PGHOST/PGUSER/PGDATABASE/PGPASSWORD/PGPORT)
# or a PG connection string in DATABASE_URL.
#
# Usage:
#   ./scripts/db-health-check.sh                # text table
#   ./scripts/db-health-check.sh --markdown     # markdown report (writeable to docs / PRs)

set -euo pipefail

FORMAT="${1:-text}"

SQL=$(cat <<'SQL'
WITH tables AS (
  SELECT c.oid, c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
policy_counts AS (
  SELECT schemaname, tablename, count(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
),
ownership_triggers AS (
  SELECT tgrelid, tgname
  FROM pg_trigger
  WHERE NOT tgisinternal
    AND tgname IN ('enforce_user_id_ownership', 'enforce_environment_parameters_ownership')
),
user_id_cols AS (
  SELECT table_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'user_id'
)
SELECT
  t.table_name,
  t.rls_enabled,
  COALESCE(pc.policy_count, 0) AS policy_count,
  EXISTS (SELECT 1 FROM ownership_triggers ot WHERE ot.tgrelid = t.oid) AS has_ownership_trigger,
  EXISTS (SELECT 1 FROM user_id_cols u WHERE u.table_name = t.table_name) AS has_user_id_column,
  CASE
    WHEN NOT t.rls_enabled THEN 'FAIL: RLS disabled'
    WHEN COALESCE(pc.policy_count, 0) = 0 THEN 'FAIL: no policies'
    WHEN NOT EXISTS (SELECT 1 FROM ownership_triggers ot WHERE ot.tgrelid = t.oid) THEN 'WARN: no ownership trigger'
    ELSE 'OK'
  END AS status
FROM tables t
LEFT JOIN policy_counts pc ON pc.tablename = t.table_name
ORDER BY t.table_name;
SQL
)

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed or not in PATH" >&2
  exit 1
fi

if [ "$FORMAT" = "--markdown" ] || [ "$FORMAT" = "markdown" ]; then
  echo "# Database health report"
  echo
  echo "_Generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")_"
  echo
  echo "| Table | RLS | Policies | Ownership trigger | user_id column | Status |"
  echo "| ----- | --- | -------- | ----------------- | -------------- | ------ |"
  psql -At -F '|' -c "$SQL" | \
    awk -F'|' '{ printf "| %s | %s | %s | %s | %s | %s |\n", $1, $2, $3, $4, $5, $6 }'
else
  psql -P pager=off -c "$SQL"
fi

# Exit non-zero if any table reports FAIL — useful as a CI safety net.
if psql -At -c "$SQL" | grep -qE '\|FAIL: '; then
  echo
  echo "One or more tables failed health checks (RLS or policies missing)." >&2
  exit 2
fi