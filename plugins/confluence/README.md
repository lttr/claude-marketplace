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

A site has thousands of pages and a handful that are alive. The skill is a cached answer to "where is anything": per site, which space matters, which page the current work lives under, and links to the main branches. Reading it costs one file read; a blind search costs Rovo credits and usually returns the 2021 archive.

A reference holds only what stays true for years — ids, keys, naming conventions. Team lists and what people are writing about _right now_ are not cached; the skill computes them from a scoped CQL query, which is free. References are written by hand and not regenerated.

One reference file per site.

Beyond orientation the skill covers the small habits that keep a wiki tidy: it locates the user's personal space for drafts, picks and names a parent before creating any page instead of dropping it at the space root, quotes last-modified dates and warns on old hits, reports stale subtrees for archive-or-merge decisions on request, and lists the user's own pages so forgotten drafts surface.

For a site without a reference, or when a page id in one is gone, the skill orients live: rank spaces by last-modified via CQL, then walk down to the branch that carries the traffic.

## Who uses it

`aiwork:triage` enriches a ticket from connected doc sources in its research step, and Confluence is one of them. Nothing hard-codes this plugin — the skill detects whatever wiki tools are connected and falls back to local `docs/` when none are.

## Install

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install confluence@lttr-claude-marketplace --scope local
```

It used to ship inside `dev-azdo`. If you installed it for the Confluence search alone, install this instead.
