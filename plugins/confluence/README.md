# confluence

The Atlassian MCP server, packaged on its own. No skills, no commands — installing the plugin connects the server, and any skill that looks for connected doc sources finds it.

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

## Who uses it

`aiwork:triage` enriches a ticket from connected doc sources in its research step, and Confluence is one of them. Nothing hard-codes this plugin — the skill detects whatever wiki tools are connected and falls back to local `docs/` when none are.

## Install

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install confluence@lttr-claude-marketplace --scope local
```

It used to ship inside `dev-azdo`. If you installed it for the Confluence search alone, install this instead.
