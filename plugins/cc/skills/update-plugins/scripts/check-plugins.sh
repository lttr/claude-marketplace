#!/usr/bin/env bash
# Read-only report: which marketplaces are behind their remote and which
# plugin installs (any scope) are older than the version in the local
# marketplace clone. Changes nothing. Needs bash 3.2+, git and jq.
set -u

plugins=${CLAUDE_CODE_PLUGIN_CACHE_DIR:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins}
latest="" # lines of plugin@marketplace <US> newest version in the local clone
us=$'\x1f'

# Fail fast instead of hanging on an unreachable remote or an auth prompt.
export GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh} -o ConnectTimeout=10 -o BatchMode=yes"

echo "# marketplaces"
echo -e "name\tlast_updated\tstatus"
while IFS=$'\t' read -r name dir updated <&3; do
  status="not a git clone"
  if git -C "$dir" rev-parse --git-dir >/dev/null 2>&1; then
    local_sha=$(git -C "$dir" rev-parse HEAD)
    branch=$(git -C "$dir" rev-parse --abbrev-ref '@{u}' 2>/dev/null | sed 's|^[^/]*/||')
    remote_sha=$(git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 -C "$dir" \
      ls-remote origin "${branch:-HEAD}" 2>/dev/null | head -1 | cut -f1)
    if [ -z "$remote_sha" ]; then status="remote unreachable"
    elif [ "$remote_sha" = "$local_sha" ]; then status="up to date"
    else status="behind remote"
    fi
  fi
  echo -e "$name\t${updated%%T*}\t$status"

  # Version from the marketplace entry, else from the plugin's own plugin.json.
  mf="$dir/.claude-plugin/marketplace.json"
  [ -f "$mf" ] || continue
  while IFS="$us" read -r pname pver psrc; do
    if [ -z "$pver" ] && [[ "$psrc" == ./* ]]; then
      pver=$(jq -r '.version // empty' "$dir/$psrc/.claude-plugin/plugin.json" 2>/dev/null)
    fi
    latest+="$pname@$name$us${pver:-?}"$'\n'
  done < <(jq -r '.plugins[] | "\(.name)\u001f\(.version // "")\u001f\(.source | strings)"' "$mf")
done 3< <(jq -r 'to_entries[] | "\(.key)\t\(.value.installLocation)\t\(.value.lastUpdated // "")"' "$plugins/known_marketplaces.json")

echo
echo "# installs"
echo -e "status\tscope\tplugin\tinstalled\tlatest\tproject"
while IFS=$'\t' read -r status scope plugin version newest project; do
  [ -n "$project" ] && [ ! -d "$project" ] && status="dir missing"
  echo -e "$status\t$scope\t$plugin\t$version\t$newest\t$project"
done < <(jq -r --arg latest "$latest" '
  # "1.10.0" -> [1, 10, 0] so versions compare numerically
  def v: split(".") | map(tonumber? // .);
  ($latest | split("\n") | map(select(. != "") | split("\u001f") | {key: .[0], value: .[1]}) | from_entries) as $l
  | .plugins | to_entries[] | .key as $p | .value[]
  | $l[$p] as $n
  | (if $n == null then "not in marketplace"
     elif $n == "?" then "latest unknown"
     elif $n == .version then "current"
     elif ($n | v) > (.version | v) then "outdated"
     else "ahead of clone" end) as $status
  | [$status, .scope, $p, .version, ($n // "-"), (.projectPath // "")] | @tsv' "$plugins/installed_plugins.json") | sort
