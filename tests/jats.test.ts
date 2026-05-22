import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJatsToText } from '../src/jats.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(resolve(__dirname, '../fixtures/sample.xml'), 'utf-8');

describe('parseJatsToText', () => {
  it('extracts section headings and paragraphs', () => {
    const text = parseJatsToText(fixture);
    expect(text).toContain('## Introduction');
    expect(text).toContain('## Results');
    expect(text).toContain('## Discussion');
  });

  it('strips inline markup (italic, bold, xref, sup, sub)', () => {
    const text = parseJatsToText(fixture);
    expect(text).toContain('This is the first paragraph');
    expect(text).toContain('bold text');
    expect(text).toContain('superscript');
    expect(text).not.toContain('<italic>');
    expect(text).not.toContain('<xref');
    expect(text).not.toContain('<bold>');
  });

  it('handles nested subsections', () => {
    const text = parseJatsToText(fixture);
    expect(text).toContain('### Subsection A');
    expect(text).toContain('Nested section content');
  });

  it('skips figures and tables', () => {
    const text = parseJatsToText(fixture);
    expect(text).not.toContain('Figure 1');
    expect(text).not.toContain('This figure should be skipped');
    expect(text).not.toContain('Table 1');
  });

  it('preserves paragraph separation', () => {
    const text = parseJatsToText(fixture);
    expect(text).toContain('introduction.\n\nThis paragraph has');
  });

  it('returns empty string for invalid XML', () => {
    const text = parseJatsToText('not xml at all');
    expect(text).toBe('');
  });

  it('returns empty string for XML without body', () => {
    const text = parseJatsToText('<?xml version="1.0"?><article><front/></article>');
    expect(text).toBe('');
  });
});
