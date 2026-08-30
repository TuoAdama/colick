#!/usr/bin/env bash
set -Eeuo pipefail

release_dir=${1:?release directory is required}
current_link=${2:?current link is required}
compose_project=${3:?Compose project name is required}
ghcr_user=${4:?GHCR user is required}
shift 4
health_urls=("$@")
successful_release_limit=3
success_marker=.deployment-success

IFS= read -r ghcr_token
if [[ -z "$ghcr_token" ]]; then
  echo "GHCR token is empty" >&2
  exit 1
fi

chmod 600 "$release_dir/.runtime.env" "$release_dir/.release.env"
rm -f "$release_dir/$success_marker"
printf '%s\n' 'Deployment attempt started; application logs will be captured on failure.' \
  >"$release_dir/deployment.log"
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

prune_successful_releases() {
  local releases_dir current_release candidate item
  local retained_count index previous_index cleanup_failed
  local -a successful_releases

  releases_dir=$(dirname "$release_dir")
  [[ -d "$releases_dir" ]] || return 0

  current_release=""
  if [[ -L "$current_link" ]]; then
    current_release=$(readlink -f "$current_link" 2>/dev/null || true)
  fi

  successful_releases=()
  while IFS= read -r -d '' candidate; do
    if [[ -f "$candidate/$success_marker" || ! -f "$candidate/deployment.log" ]]; then
      successful_releases+=("$candidate")
    fi
  done < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -print0)

  if ((${#successful_releases[@]} == 0)); then
    return 0
  fi

  # Sort newest first without relying on GNU-specific stat or find options.
  for ((index = 1; index < ${#successful_releases[@]}; index++)); do
    item=${successful_releases[index]}
    previous_index=$((index - 1))
    while ((previous_index >= 0)) && [[ "$item" -nt "${successful_releases[previous_index]}" ]]; do
      successful_releases[previous_index + 1]=${successful_releases[previous_index]}
      previous_index=$((previous_index - 1))
    done
    successful_releases[previous_index + 1]=$item
  done

  retained_count=0
  if [[ -n "$current_release" && "$(dirname "$current_release")" == "$releases_dir" ]]; then
    retained_count=1
  fi

  cleanup_failed=false
  for candidate in "${successful_releases[@]}"; do
    if [[ -n "$current_release" && "$candidate" == "$current_release" ]]; then
      continue
    fi
    if ((retained_count < successful_release_limit)); then
      retained_count=$((retained_count + 1))
      continue
    fi
    if [[ "$(dirname "$candidate")" != "$releases_dir" ]]; then
      echo "Refusing to remove release outside $releases_dir: $candidate" >&2
      cleanup_failed=true
      continue
    fi
    if rm -rf -- "$candidate"; then
      echo "Old successful release removed: $candidate"
    else
      echo "Failed to remove old successful release: $candidate" >&2
      cleanup_failed=true
    fi
  done

  [[ "$cleanup_failed" == false ]]
}

prune_releases_with_warning() {
  if ! prune_successful_releases; then
    echo "Warning: release retention cleanup did not complete" >&2
  fi
}

cd "$release_dir"
if ! docker compose -p "$compose_project" --env-file .release.env -f compose.yml pull; then
  echo "Image pull failed; no containers were modified" >&2
  echo "Image pull failed; no containers were modified" >>deployment.log
  prune_releases_with_warning
  exit 1
fi

deployment_modified=true
if compose_up "$release_dir" && check_urls; then
  rm -f "$release_dir/deployment.log"
  touch "$release_dir/$success_marker"
  next_link="${current_link}.next"
  ln -sfn "$release_dir" "$next_link"
  mv -Tf "$next_link" "$current_link"
  echo "Release activated: $release_dir"
  prune_releases_with_warning
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

prune_releases_with_warning
exit 1
