# TODO

## Cloudflare Bypass for bioRxiv Full Text

### Problem

bioRxiv's `www.biorxiv.org` domain is protected by Cloudflare Managed Challenge (with CAPTCHA). All programmatic attempts to fetch JATS XML full text are blocked. medRxiv works fine.

### Tested Approaches (all failed)

| Method | Result |
|--------|--------|
| Node.js fetch with various User-Agents | 403 / Cloudflare challenge HTML |
| `apify/rag-web-browser` | 403 blocked |
| `lentic_clockss/stealth-web-scraper` (Camoufox + residential proxy + capsolver) | CF challenge unsolvable (error 1002) |
| `neatrat/cloudflare-scraper` | Requires paid rental |
| `ecomscrape/cloudflare-web-scraper` | Requires paid subscription ($15/mo) |
| DOI content negotiation | Only returns CrossRef metadata XML |
| Europe PMC fullTextXML | Not available for preprints |

### Remaining Options

1. **AWS S3 bucket** (`s3://biorxiv-src-monthly`) — bioRxiv's official programmatic full text access. Requester-pays, needs AWS credentials. Monthly XML dump, not real-time per-paper access.

2. **FlareSolverr** (self-hosted Docker) — open-source Cloudflare bypass proxy. Maintenance burden, may break when CF updates.

3. **Paid Cloudflare bypass service** — e.g. ScrapingBee, Scrappey, ZenRows. Adds external dependency and cost.

4. **Accept current state** — bioRxiv: metadata + abstract only. medRxiv: full text. For published bioRxiv papers, try PMC as secondary source.

### Current Status

The MCP server works correctly:
- bioRxiv → metadata + abstract (100% reliable)
- medRxiv → metadata + full text (100% reliable)
- `fullTextError` field explains when full text is unavailable
