import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BiorxivClient, isBiorxivError } from '../src/client.js';

describe('BiorxivClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches JSON from the API base', async () => {
    const mockResponse = {
      messages: [{ status: 'ok', count: 1, total: '1' }],
      collection: [{ doi: '10.1101/2024.01.01.000000', title: 'Test' }],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const client = new BiorxivClient();
    const result = await client.getDetails('biorxiv', '10.1101/2024.01.01.000000');

    expect(isBiorxivError(result)).toBe(false);
    expect((result as any).collection[0].doi).toBe('10.1101/2024.01.01.000000');
  });

  it('returns error on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    const client = new BiorxivClient();
    const result = await client.getDetails('biorxiv', '10.1101/0000.00.00.000000');

    expect(isBiorxivError(result)).toBe(true);
    expect((result as any).status).toBe(404);
  });

  it('retries on 429 with backoff', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messages: [{ status: 'ok' }], collection: [] }), { status: 200 }),
      );

    const client = new BiorxivClient();
    const result = await client.getDetails('biorxiv', '10.1101/2024.01.01.000000');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(isBiorxivError(result)).toBe(false);
  });

  it('fetches raw text (for XML)', async () => {
    const xml = '<article><body><p>Hello</p></body></article>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(xml, { status: 200 }),
    );

    const client = new BiorxivClient();
    const result = await client.fetchXml('https://www.biorxiv.org/content/early/2024/01/01/2024.01.01.000000.source.xml');

    expect(result).toBe(xml);
  });

  it('returns null for XML fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    const client = new BiorxivClient();
    const result = await client.fetchXml('https://www.biorxiv.org/bad-url');

    expect(result).toBeNull();
  });
});
