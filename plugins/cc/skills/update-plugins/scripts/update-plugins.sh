#!/usr/bin/env bash
# Update the plugin installs given on stdin, each from its own project dir.
# Input: rows of check-plugins.sh's "installs" table
#   (status, scope, plugin, installed, latest, project), tab-separated.
# Example: check-plugins.sh | awk -F'\t' '$1 == "outdated" && $2 == "user"' | update-plugins.sh
# Does not refresh marketplaces.
set -u

ok=0 failed=()
while IFS=$'\t' read -r _status scope plugin _installed _latest project <&3; do
  dir=${project:-$HOME} # user scope has no project dir
  echo "== $scope  $plugin  $dir"
  if (cd "$dir" && claude plugin update "$plugin" --scope "$scope"); then
    ok=$((ok + 1))
  else
    failed+=("$scope  $plugin  $dir")
  fi
done 3<&0

echo
echo "updated: $ok"
for f in "${failed[@]}"; do echo "FAILED: $f"; done
[ "${#failed[@]}" = 0 ]
