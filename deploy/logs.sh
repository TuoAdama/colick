#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage: ./logs.sh [service] [--follow] [--since <duration>] [--lines <count>] [--level <level>] [--archive]

Services: back-office (default), front-office, postgres, redis
Levels: TRACE, DEBUG, INFO, WARN, ERROR

--archive reads the persistent back-office files and cannot be combined with --since.
USAGE
}

fail() {
  echo "Error: $*" >&2
  usage >&2
  exit 2
}

service=back-office
follow=false
since=""
lines=200
level=""
archive=false
service_set=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --follow|-f)
      follow=true
      shift
      ;;
    --since)
      [[ $# -ge 2 && -n "$2" ]] || fail "--since requires a value"
      since=$2
      shift 2
      ;;
    --lines|-n)
      [[ $# -ge 2 && "$2" =~ ^[1-9][0-9]*$ ]] || fail "--lines requires a positive integer"
      lines=$2
      shift 2
      ;;
    --level)
      [[ $# -ge 2 && -n "$2" ]] || fail "--level requires a value"
      level=$(printf '%s' "$2" | tr '[:lower:]' '[:upper:]')
      shift 2
      ;;
    --archive)
      archive=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --*)
      fail "unknown option: $1"
      ;;
    *)
      [[ "$service_set" == false ]] || fail "only one service can be selected"
      service=$1
      service_set=true
      shift
      ;;
  esac
done

case "$service" in
  back-office|front-office|postgres|redis) ;;
  *) fail "unknown service: $service" ;;
esac

if [[ -n "$level" ]]; then
  case "$level" in
    TRACE|DEBUG|INFO|WARN|ERROR) ;;
    *) fail "unknown level: $level" ;;
  esac
fi

if [[ "$archive" == true ]]; then
  [[ "$service" == back-office ]] || fail "--archive is only available for back-office"
  [[ -z "$since" ]] || fail "--archive cannot be combined with --since"
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
release_env="$script_dir/.release.env"
compose_file="$script_dir/compose.yml"
[[ -r "$release_env" ]] || fail "missing release metadata: $release_env"
[[ -r "$compose_file" ]] || fail "missing Compose file: $compose_file"

compose_project=$(sed -n 's/^COMPOSE_PROJECT_NAME=//p' "$release_env" | tail -n 1)
[[ -n "$compose_project" ]] || fail "COMPOSE_PROJECT_NAME is missing from $release_env"

compose=(docker compose -p "$compose_project" --env-file "$release_env" -f "$compose_file")

stream_logs() {
  if [[ "$archive" == true ]]; then
    if [[ "$follow" == true ]]; then
      "${compose[@]}" exec -T back-office tail -n "$lines" -F /app/logs/preprod.log
    else
      "${compose[@]}" exec -T back-office sh -c \
        'for file in /app/logs/preprod.*.log /app/logs/preprod.log; do [ -f "$file" ] && cat "$file"; done' \
        | tail -n "$lines"
    fi
    return
  fi

  local args=(logs --no-color --no-log-prefix --tail "$lines")
  [[ -z "$since" ]] || args+=(--since "$since")
  [[ "$follow" == false ]] || args+=(--follow)
  args+=("$service")
  "${compose[@]}" "${args[@]}"
}

if [[ -n "$level" ]]; then
  stream_logs | awk -v target="$level" '
    index($0, " " target " ") { print; fflush() }
  '
else
  stream_logs
fi
