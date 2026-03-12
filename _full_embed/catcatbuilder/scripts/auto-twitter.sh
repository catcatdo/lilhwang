#!/usr/bin/env bash
set -euo pipefail

# Auto post to X(Twitter) via API v2.
# Required env vars:
# - X_BEARER_TOKEN
# Optional env vars:
# - X_API_BASE_URL (default: https://api.twitter.com)

usage() {
  cat <<'USAGE'
Usage:
  scripts/auto-twitter.sh --text "message"
  scripts/auto-twitter.sh --file ./tweet.txt
  scripts/auto-twitter.sh --text "message" --dry-run

Options:
  --text TEXT      Tweet text content
  --file PATH      Read tweet text from file
  --dry-run        Print payload only, do not send request
  -h, --help       Show this help
USAGE
}

TEXT=""
FILE_PATH=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --text)
      shift
      [[ $# -gt 0 ]] || { echo "[error] --text requires value" >&2; exit 1; }
      TEXT="$1"
      ;;
    --file)
      shift
      [[ $# -gt 0 ]] || { echo "[error] --file requires value" >&2; exit 1; }
      FILE_PATH="$1"
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[error] unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift

done

if [[ -n "$FILE_PATH" ]]; then
  [[ -f "$FILE_PATH" ]] || { echo "[error] file not found: $FILE_PATH" >&2; exit 1; }
  TEXT="$(cat "$FILE_PATH")"
fi

if [[ -z "$TEXT" ]]; then
  echo "[error] provide --text or --file" >&2
  exit 1
fi

if [[ ${#TEXT} -gt 280 ]]; then
  echo "[error] tweet exceeds 280 chars: ${#TEXT}" >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  DRY_JSON="$(printf '%s' "$TEXT" | python3 -c 'import json,sys; print(json.dumps({"text": sys.stdin.read()}, ensure_ascii=False))')"
  echo "[dry-run] payload: ${DRY_JSON}"
  exit 0
fi

if [[ -z "${X_BEARER_TOKEN:-}" ]]; then
  echo "[error] missing env var: X_BEARER_TOKEN" >&2
  exit 1
fi

API_BASE_URL="${X_API_BASE_URL:-https://api.twitter.com}"
TMP_BODY="$(mktemp)"
HTTP_CODE="$(
  curl -sS -o "$TMP_BODY" -w "%{http_code}" \
    -X POST "${API_BASE_URL}/2/tweets" \
    -H "Authorization: Bearer ${X_BEARER_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$(printf '{"text":%s}' "$(printf '%s' "$TEXT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")"
)"

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "[ok] tweet posted"
  cat "$TMP_BODY"
  echo
  rm -f "$TMP_BODY"
  exit 0
fi

echo "[error] API request failed: HTTP $HTTP_CODE" >&2
cat "$TMP_BODY" >&2
rm -f "$TMP_BODY"
exit 1
