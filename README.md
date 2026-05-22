# @yogsoth-ai/biorxiv-mcp

MCP server for fetching bioRxiv and medRxiv preprint metadata and full text by DOI.

## What it does

Given a DOI, returns structured metadata (title, authors, abstract, category, license, etc.) plus the full paper text parsed from JATS XML into clean markdown-style plain text suitable for LLM consumption.

- **bioRxiv**: metadata + abstract always available; full text best-effort (www.biorxiv.org has Cloudflare protection)
- **medRxiv**: metadata + full text reliably available

## Tools

### `paper`

Fetch a preprint by DOI.

**Parameters:**
- `doi` (string, required) — bioRxiv/medRxiv DOI (e.g. `10.1101/2024.01.02.573835`)
- `server` (enum: `biorxiv` | `medrxiv`, default: `biorxiv`) — which preprint server to query

**Returns:** JSON with `doi`, `title`, `authors`, `authorCorresponding`, `institution`, `date`, `version`, `category`, `license`, `abstract`, `fullText`, `fullTextError`, `published`

## Setup

```json
{
  "mcpServers": {
    "@yogsoth-ai/biorxiv-mcp": {
      "command": "node",
      "args": ["--import", "tsx/esm", "<path-to>/biorxiv-mcp/src/server.ts"]
    }
  }
}
```

## Development

```bash
npm install
npm test              # unit tests (mocked, fast)
npm run test:integration  # live API tests (requires network)
```

## Known limitations

bioRxiv's www subdomain is protected by Cloudflare's managed challenge, which blocks programmatic JATS XML fetching. The server gracefully degrades: metadata and abstract are always returned, but `fullText` may be `null` for bioRxiv papers (with `fullTextError` explaining why). medRxiv does not have this restriction.

## License

Apache-2.0
