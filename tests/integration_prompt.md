# biorxiv-mcp Integration Test

This test validates the biorxiv-mcp server works end-to-end in a Claude Code session, using Semantic Scholar to discover DOIs and then fetching full text via biorxiv-mcp.

## Test Steps

### 1. Discover preprint DOIs via Semantic Scholar

Use the `semantic-scholar` MCP's `relevanceSearch` tool to find recent bioRxiv/medRxiv papers:

```
Search for: "protein language model" with year filter "2024-"
```

From the results, pick 2-3 papers that have DOIs starting with `10.1101/` (these are bioRxiv/medRxiv preprints).

### 2. Fetch bioRxiv paper

Use the `biorxiv` MCP's `paper` tool with one of the bioRxiv DOIs found above:

```
doi: <a 10.1101/... DOI from step 1>
server: biorxiv
```

**Expected:** Returns metadata (title, authors, abstract, category). Full text may be null due to Cloudflare restrictions — this is acceptable. The `fullTextError` field should explain why.

### 3. Fetch medRxiv paper

Use the `biorxiv` MCP's `paper` tool with a known medRxiv DOI:

```
doi: 10.1101/2024.01.02.24300715
server: medrxiv
```

**Expected:** Returns metadata AND full text. The `fullText` field should contain markdown-formatted paper content with section headers (`##`).

### 4. Verify full text quality (medRxiv)

Check that the medRxiv full text:
- Contains section headers (lines starting with `##`)
- Has substantial content (>500 characters)
- Reads as coherent scientific text

## Pass Criteria

- [ ] Semantic Scholar returns papers with `10.1101/` DOIs
- [ ] bioRxiv paper tool returns valid metadata and abstract
- [ ] medRxiv paper tool returns full text with section structure
- [ ] No crashes or unhandled errors
