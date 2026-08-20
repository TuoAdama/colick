#!/usr/bin/env bash
set -Eeuo pipefail

release_dir=${1:?release directory is required}
current_link=${2:?current link is required}
compose_project=${3:?Compose project name is required}
ghcr_user=${4:?GHCR user is required}
shift 4
health_urls=("$@")

IFS= read -r ghcr_token
if [[ -z "$ghcr_token" ]]; then
  echo "GHCR token is empty" >&2
  exit 1
fi

chmod 600 "$release_dir/.runtime.env" "$release_dir/.release.env"
previous_release=""
if [[ -L "$current_link" ]]; then
  previous_release=$(readlink -f "$current_link")
fi

printf '%s' "$ghcr_token" | docker login ghcr.io --username "$ghcr_user" --password-stdin >/dev/null
unset ghcr_token
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

check_urls() {
  local url attempt
  for url in "${health_urls[@]}"; do
    for attempt in {1..12}; do
      if curl --fail --silent --show-error --max-time 10 "$url" >/dev/null; then
        break
      fi
      if [[ $attempt -eq 12 ]]; then
        echo "Health check failed: $url" >&2
        return 1
      fi
      sleep 5
    done
  done
}

compose_up() {
  local target=$1
  docker compose \
    -p "$compose_project" \
    --env-file "$target/.release.env" \
    -f "$target/compose.yml" \
    up -d --wait --wait-timeout 120
}

cd "$release_dir"
docker compose -p "$compose_project" --env-file .release.env -f compose.yml pull

deployment_modified=true
if compose_up "$release_dir" && check_urls; then
  next_link="${current_link}.next"
  ln -sfn "$release_dir" "$next_link"
  mv -Tf "$next_link" "$current_link"
  echo "Release activated: $release_dir"
  exit 0
fi

docker compose -p "$compose_project" --env-file .release.env -f compose.yml logs --no-color >deployment.log 2>&1 || true
echo "Deployment failed; logs kept in $release_dir/deployment.log" >&2

if [[ "$deployment_modified" == true && -n "$previous_release" && -d "$previous_release" ]]; then
  echo "Rolling back to $previous_release" >&2
  if compose_up "$previous_release" && check_urls; then
    echo "Rollback succeeded; the failed deployment remains marked as failed" >&2
  else
    echo "Rollback failed" >&2
  fi
else
  echo "No previous release is available; rollback was not possible" >&2
fi

exit 1
