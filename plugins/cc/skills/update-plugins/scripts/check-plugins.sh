#!/usr/bin/env bash
# Read-only report: which marketplaces are behind their remote and which
# plugin installs (any scope) are older than the version in the local
# marketplace clone. Changes nothing.
set -u

plugins=~/.claude/plugins
declare -A latest # plugin@marketplace -> newest version in the local clone

echo "# marketplaces"
echo -e "name\tlast_updated\tstatus"
while IFS=$'\t' read -r name dir updated <&3; do
  status="not a git clone"
  if git -C "$dir" rev-parse --git-dir >/dev/null 2>&1; then
    local_sha=$(git -C "$dir" rev-parse HEAD)
    branch=$(git -C "$dir" rev-parse --abbrev-ref '@{u}' 2>/dev/null | sed 's|^[^/]*/||')
    remote_sha=$(timeout 20 git -C "$dir" ls-remote origin "${branch:-HEAD}" 2>/dev/null | head -1 | cut -f1)
    if [ -z "$remote_sha" ]; then status="remote unreachable"
    elif [ "$remote_sha" = "$local_sha" ]; then status="up to date"
    else status="behind remote"
    fi
  fi
  echo -e "$name\t${updated%%T*}\t$status"

  # Version from the marketplace entry, else from the plugin's own plugin.json.
  mf="$dir/.claude-plugin/marketplace.json"
  [ -f "$mf" ] || continue
  while IFS=$'\x1f' read -r pname pver psrc; do
    if [ -z "$pver" ] && [[ "$psrc" == ./* ]]; then
      pver=$(jq -r '.version // empty' "$dir/$psrc/.claude-plugin/plugin.json" 2>/dev/null)
    fi
    latest["$pname@$name"]=${pver:-?}
  done < <(jq -r '.plugins[] | "\(.name)\u001f\(.version // "")\u001f\(.source | strings)"' "$mf")
done 3< <(jq -r 'to_entries[] | "\(.key)\t\(.value.installLocation)\t\(.value.lastUpdated // "")"' "$plugins/known_marketplaces.json")

echo
echo "# installs"
echo -e "status\tscope\tplugin\tinstalled\tlatest\tproject"
while IFS=$'\t' read -r scope plugin version project; do
  newest=${latest[$plugin]:-}
  if [ -n "$project" ] && [ ! -d "$project" ]; then status="dir missing"
  elif [ -z "$newest" ]; then status="not in marketplace"
  elif [ "$newest" = "?" ]; then status="latest unknown"
  elif [ "$newest" = "$version" ]; then status="current"
  elif [ "$(printf '%s\n%s\n' "$version" "$newest" | sort -V | tail -1)" = "$newest" ]; then status="outdated"
  else status="ahead of clone"
  fi
  echo -e "$status\t$scope\t$plugin\t$version\t${newest:--}\t$project"
done < <(jq -r '.plugins | to_entries[] | .key as $p | .value[]
                | "\(.scope)\t\($p)\t\(.version)\t\(.projectPath // "")"' "$plugins/installed_plugins.json") | sort
