#!/usr/bin/env bash
# Резервное копирование базы данных: сжатый дамп в формате custom + ротация (храним 7 последних)
set -euo pipefail

DB_URL="${DATABASE_URL:?Укажите DATABASE_URL}"
DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP:-7}"

mkdir -p "$DIR"
FILE="$DIR/taskman_$(date +%Y%m%d_%H%M%S).dump"

pg_dump --format=custom --compress=9 --no-owner --file="$FILE" "$DB_URL"
pg_restore --list "$FILE" > /dev/null   # проверяем, что архив читается
echo "Backup created: $FILE ($(du -h "$FILE" | cut -f1))"

ls -1t "$DIR"/taskman_*.dump | tail -n +$((KEEP + 1)) | xargs -r rm --
