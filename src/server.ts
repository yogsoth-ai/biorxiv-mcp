#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { BiorxivClient } from './client.js';
import { biorxivPaper } from './tools/paper.js';

const server = new McpServer({
  name: '@yogsoth-ai/biorxiv-mcp',
  version: '1.0.0',
});

const client = new BiorxivClient();

server.tool(
  'paper',
  'Fetch bioRxiv/medRxiv preprint metadata and full text by DOI. Returns structured metadata plus the full paper text parsed from JATS XML.',
  {
    doi: z.string().describe('bioRxiv/medRxiv DOI (e.g. 10.1101/2024.01.01.573876)'),
    server: z.enum(['biorxiv', 'medrxiv']).default('biorxiv').describe('Preprint server to query'),
  },
  async (args) => {
    try {
      const result = await biorxivPaper(client, {
        doi: args.doi,
        server: args.server,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e.message}\n`);
  process.exit(1);
});
