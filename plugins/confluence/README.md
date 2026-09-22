# confluence

The Atlassian MCP server plus one skill. Installing the plugin connects the server, and any skill that looks for connected doc sources finds it.

## What ships

`.mcp.json` registers the hosted HTTP server:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

First use opens an OAuth flow in the browser. Pick the Confluence site you want; the grant is per site, and a site admin may need to authorize the app once for the whole org.

### `confluence:wiki-map`

A site has thousands of pages and a handful that are alive. The skill is a cached answer to "where is anything": per site, which spaces still get edited, which subtree inside them carries the work, the team page ids under it, and links to the main branches. Reading it costs one file read; a blind search costs Rovo credits and usually returns the 2021 archive.

A reference holds structure only — ids, keys, tree shape, naming conventions. What people are writing about _right now_ is not cached; the skill computes it from a scoped CQL query, which is free. The rule is that anything needing an update more than once a quarter stays out of the plugin.

One reference file per site.

Beyond orientation the skill covers the small habits that keep a wiki tidy: it locates the user's personal space for drafts, picks and names a parent before creating any page instead of dropping it at the space root, quotes last-modified dates and warns on old hits, reports stale subtrees for archive-or-merge decisions on request, and lists the user's own pages so forgotten drafts surface.

`confluence:wiki-map refresh` rebuilds a map, or builds one for a site that has none. The recipe lives in `references/refresh.md`: rank spaces by last-modified via CQL, separate steady work from a one-off bulk edit, then walk down to the branch that carries the traffic. It is a prescription with jq snippets rather than a script — the data only comes through MCP tools, and large results land in a file the MCP layer writes for you.

Structure drifts slowly. Each map carries a `Mapped on` date; past ~6 months, or as soon as a page it names is gone, refresh.

## Who uses it

`aiwork:triage` enriches a ticket from connected doc sources in its research step, and Confluence is one of them. Nothing hard-codes this plugin — the skill detects whatever wiki tools are connected and falls back to local `docs/` when none are.

## Install

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install confluence@lttr-claude-marketplace --scope local
```

It used to ship inside `dev-azdo`. If you installed it for the Confluence search alone, install this instead.
