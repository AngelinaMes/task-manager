#!/usr/bin/env bash
# Восстановление базы из дампа: scripts/restore.sh backups/taskman_YYYYMMDD_HHMMSS.dump
set -euo pipefail

FILE="${1:?Укажите файл дампа}"
DB_URL="${DATABASE_URL:?Укажите DATABASE_URL}"

pg_restore --clean --if-exists --no-owner --single-transaction --dbname="$DB_URL" "$FILE"
echo "Restored from $FILE"
