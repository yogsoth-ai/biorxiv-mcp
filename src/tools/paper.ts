import { BiorxivClient, isBiorxivError } from '../client.js';
import { parseJatsToText } from '../jats.js';

export interface PaperArgs {
  doi: string;
  server: 'biorxiv' | 'medrxiv';
}

export interface PaperResult {
  doi: string;
  title: string;
  authors: string;
  authorCorresponding: string;
  institution: string;
  date: string;
  version: string;
  category: string;
  license: string;
  abstract: string;
  fullText: string | null;
  fullTextError?: string;
  published: string | null;
}

export async function biorxivPaper(client: BiorxivClient, args: PaperArgs): Promise<PaperResult> {
  const details = await client.getDetails(args.server, args.doi);

  if (isBiorxivError(details)) {
    throw new Error(details.error + (details.message ? `: ${details.message}` : ''));
  }

  const collection = (details as any).collection;
  if (!collection || collection.length === 0) {
    throw new Error('not_found: no results for DOI ' + args.doi);
  }

  const entry = collection[0];

  let fullText: string | null = null;
  let fullTextError: string | undefined;

  if (entry.jatsxml) {
    const xml = await client.fetchXml(entry.jatsxml);
    if (xml) {
      const parsed = parseJatsToText(xml);
      fullText = parsed || null;
      if (!parsed) fullTextError = 'JATS XML parsed but no body content found';
    } else {
      fullTextError = 'Full text XML unavailable (bioRxiv restricts programmatic access; medRxiv full text is accessible)';
    }
  } else {
    fullTextError = 'No JATS XML URL in metadata';
  }

  const published = entry.published && entry.published !== 'NA' ? entry.published : null;

  return {
    doi: entry.doi,
    title: entry.title,
    authors: entry.authors,
    authorCorresponding: entry.author_corresponding,
    institution: entry.author_corresponding_institution,
    date: entry.date,
    version: entry.version,
    category: entry.category,
    license: entry.license,
    abstract: entry.abstract,
    fullText,
    fullTextError,
    published,
  };
}
