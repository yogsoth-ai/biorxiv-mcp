import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: true,
  trimValues: false,
});

const SKIP_TAGS = new Set(['fig', 'table-wrap', 'supplementary-material']);

export function parseJatsToText(xml: string): string {
  try {
    const parsed = parser.parse(xml);
    const body = findByTag(parsed, 'body');
    if (!body) return '';
    return extractSections(body, 2).trim();
  } catch {
    return '';
  }
}

function extractSections(nodes: any[], headingLevel: number): string {
  const parts: string[] = [];

  for (const node of nodes) {
    const tag = getTag(node);
    if (!tag) {
      continue;
    }

    if (tag === 'sec') {
      parts.push(extractSection(node['sec'], headingLevel));
    } else if (tag === 'p') {
      const text = extractInlineText(node['p']);
      if (text) parts.push(text);
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function extractSection(children: any[], headingLevel: number): string {
  const parts: string[] = [];
  const prefix = '#'.repeat(headingLevel);

  for (const node of children) {
    const tag = getTag(node);
    if (!tag) continue;

    if (SKIP_TAGS.has(tag)) continue;

    if (tag === 'title') {
      const title = extractInlineText(node['title']);
      if (title) parts.push(`${prefix} ${title}`);
    } else if (tag === 'p') {
      const text = extractInlineText(node['p']);
      if (text) parts.push(text);
    } else if (tag === 'sec') {
      parts.push(extractSection(node['sec'], headingLevel + 1));
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function extractInlineText(nodes: any[]): string {
  if (!nodes || !Array.isArray(nodes)) return '';

  const texts: string[] = [];
  for (const node of nodes) {
    if ('#text' in node) {
      texts.push(String(node['#text']));
    } else {
      const tag = getTag(node);
      if (tag && !SKIP_TAGS.has(tag)) {
        texts.push(extractInlineText(node[tag]));
      }
    }
  }
  return texts.join('');
}

function getTag(node: any): string | null {
  if (!node || typeof node !== 'object') return null;
  for (const key of Object.keys(node)) {
    if (key !== '#text' && key !== ':@') return key;
  }
  return null;
}

function findByTag(nodes: any[], tag: string): any[] | null {
  for (const node of nodes) {
    if (node[tag]) return node[tag];
    for (const key of Object.keys(node)) {
      if (key === '#text' || key === ':@') continue;
      const children = node[key];
      if (Array.isArray(children)) {
        const found = findByTag(children, tag);
        if (found) return found;
      }
    }
  }
  return null;
}
