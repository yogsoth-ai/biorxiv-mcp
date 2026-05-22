import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BiorxivClient } from '../src/client.js';
import { biorxivPaper } from '../src/tools/paper.js';

describe('biorxivPaper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns metadata and full text for a valid DOI', async () => {
    const mockDetails = {
      messages: [{ status: 'ok', count: 1, total: '1' }],
      collection: [{
        doi: '10.1101/2024.01.01.573876',
        title: 'Test Paper Title',
        authors: 'Smith, J.; Doe, A.',
        author_corresponding: 'John Smith',
        author_corresponding_institution: 'MIT',
        date: '2024-01-01',
        version: '1',
        category: 'bioinformatics',
        license: 'cc_by',
        abstract: 'This is the abstract.',
        jatsxml: 'https://www.biorxiv.org/content/early/2024/01/01/2024.01.01.573876.source.xml',
        published: 'NA',
      }],
    };

    const mockXml = '<article><body><sec><title>Intro</title><p>Hello world.</p></sec></body></article>';

    const client = new BiorxivClient();
    vi.spyOn(client, 'getDetails').mockResolvedValueOnce(mockDetails);
    vi.spyOn(client, 'fetchXml').mockResolvedValueOnce(mockXml);

    const result = await biorxivPaper(client, { doi: '10.1101/2024.01.01.573876', server: 'biorxiv' });

    expect(result).toMatchObject({
      doi: '10.1101/2024.01.01.573876',
      title: 'Test Paper Title',
      authors: 'Smith, J.; Doe, A.',
      category: 'bioinformatics',
      published: null,
    });
    expect(result.fullText).toContain('## Intro');
    expect(result.fullText).toContain('Hello world.');
  });

  it('returns fullText as null when JATS XML is unavailable', async () => {
    const mockDetails = {
      messages: [{ status: 'ok', count: 1, total: '1' }],
      collection: [{
        doi: '10.1101/2024.01.01.573876',
        title: 'Test Paper',
        authors: 'Smith, J.',
        author_corresponding: 'John Smith',
        author_corresponding_institution: 'MIT',
        date: '2024-01-01',
        version: '1',
        category: 'genomics',
        license: 'cc_by',
        abstract: 'Abstract text.',
        jatsxml: 'https://www.biorxiv.org/content/early/2024/01/01/2024.01.01.573876.source.xml',
        published: 'NA',
      }],
    };

    const client = new BiorxivClient();
    vi.spyOn(client, 'getDetails').mockResolvedValueOnce(mockDetails);
    vi.spyOn(client, 'fetchXml').mockResolvedValueOnce(null);

    const result = await biorxivPaper(client, { doi: '10.1101/2024.01.01.573876', server: 'biorxiv' });

    expect(result.fullText).toBeNull();
    expect(result.fullTextError).toContain('unavailable');
  });

  it('throws on DOI not found', async () => {
    const client = new BiorxivClient();
    vi.spyOn(client, 'getDetails').mockResolvedValueOnce({
      error: 'not_found', status: 404, message: 'Not found',
    });

    await expect(
      biorxivPaper(client, { doi: '10.1101/0000.00.00.000000', server: 'biorxiv' }),
    ).rejects.toThrow('not_found');
  });

  it('maps published DOI when not NA', async () => {
    const mockDetails = {
      messages: [{ status: 'ok', count: 1, total: '1' }],
      collection: [{
        doi: '10.1101/2024.01.01.573876',
        title: 'Published Paper',
        authors: 'Smith, J.',
        author_corresponding: 'John Smith',
        author_corresponding_institution: 'MIT',
        date: '2024-01-01',
        version: '2',
        category: 'neuroscience',
        license: 'cc_by',
        abstract: 'Abstract.',
        jatsxml: 'https://www.biorxiv.org/test.xml',
        published: '10.1038/s41586-024-00000-0',
      }],
    };

    const client = new BiorxivClient();
    vi.spyOn(client, 'getDetails').mockResolvedValueOnce(mockDetails);
    vi.spyOn(client, 'fetchXml').mockResolvedValueOnce('<article><body><p>Text.</p></body></article>');

    const result = await biorxivPaper(client, { doi: '10.1101/2024.01.01.573876', server: 'biorxiv' });

    expect(result.published).toBe('10.1038/s41586-024-00000-0');
  });
});
