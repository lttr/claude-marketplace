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

A site has thousands of pages and a handful that are alive. The skill is a cached answer to "where is anything": per site, which spaces still get edited, which subtree inside them carries the work, what people are writing about right now, and links to the main branches. Reading it costs one file read; a blind search costs Rovo credits and usually returns the 2021 archive.

One reference file per site.

`confluence:wiki-map refresh` rebuilds a map, or builds one for a site that has none. The recipe lives in `references/refresh.md`: rank spaces by last-modified via CQL, separate steady work from a one-off bulk edit, then walk down to the branch that carries the traffic. It is a prescription with jq snippets rather than a script — the data only comes through MCP tools, and large results land in a file the MCP layer writes for you.

Maps go stale. Each carries a `Mapped on` date; past ~2 months, refresh.

## Who uses it

`aiwork:triage` enriches a ticket from connected doc sources in its research step, and Confluence is one of them. Nothing hard-codes this plugin — the skill detects whatever wiki tools are connected and falls back to local `docs/` when none are.

## Install

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install confluence@lttr-claude-marketplace --scope local
```

It used to ship inside `dev-azdo`. If you installed it for the Confluence search alone, install this instead.
