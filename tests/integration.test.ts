/**
 * Integration tests — require live bioRxiv/medRxiv API access.
 * Run manually: npx vitest run --config vitest.integration.config.ts
 *
 * These tests are excluded from the default `npm test` run.
 */
import { describe, it, expect } from 'vitest';
import { BiorxivClient } from '../src/client.js';
import { biorxivPaper } from '../src/tools/paper.js';

const BIORXIV_DOI = '10.1101/2024.01.02.573835';
const MEDRXIV_DOI = '10.1101/2024.01.02.24300715';

describe('Integration: biorxivPaper', () => {
  it('fetches bioRxiv paper metadata and abstract', async () => {
    const client = new BiorxivClient();
    const result = await biorxivPaper(client, { doi: BIORXIV_DOI, server: 'biorxiv' });

    expect(result.doi).toBe(BIORXIV_DOI);
    expect(result.title).toBeTruthy();
    expect(result.authors).toBeTruthy();
    expect(result.abstract.length).toBeGreaterThan(50);
    expect(result.category).toBeTruthy();
    // bioRxiv full text is blocked by Cloudflare — fullText may be null
    if (result.fullText) {
      expect(result.fullText.length).toBeGreaterThan(500);
    } else {
      expect(result.fullTextError).toBeTruthy();
    }
  }, 30000);

  it('fetches medRxiv paper with full text', async () => {
    const client = new BiorxivClient();
    const result = await biorxivPaper(client, { doi: MEDRXIV_DOI, server: 'medrxiv' });

    expect(result.doi).toBeTruthy();
    expect(result.title).toBeTruthy();
    expect(result.abstract.length).toBeGreaterThan(50);
    // medRxiv XML is accessible
    expect(result.fullText).not.toBeNull();
    expect(result.fullText!.length).toBeGreaterThan(500);
    expect(result.fullText).toContain('##');
  }, 30000);

  it('throws on non-existent DOI', async () => {
    const client = new BiorxivClient();

    await expect(
      biorxivPaper(client, { doi: '10.1101/0000.00.00.000000', server: 'biorxiv' }),
    ).rejects.toThrow();
  }, 15000);
});
