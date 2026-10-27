#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { searchItems } from '../integrations/skills/leibox/scripts/leibox.mjs';
export { searchItems };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'public/ai/catalog.json');
export const CLI_HELP = {
  name: 'leibox',
  readOnly: true,
  output: 'JSON',
  commands: {
    list: 'List component metadata.',
    'search <query>': 'Search by English/Chinese names, descriptions, slug, framework or renderer; combine words to narrow results.',
    'show <slug>': 'Read component API metadata, framework source URLs, dependencies and source provider.',
    help: 'Show this help. --help and -h are also accepted.',
  },
  examples: ['node scripts/collection-cli.mjs search 玻璃', 'node scripts/collection-cli.mjs show glass-folder'],
  exitCodes: { 0: 'Success', 1: 'Catalog/read error', 2: 'Invalid arguments', 3: 'No matching entries or unknown slug' },
  installation: 'This local catalog CLI is read-only. The installed LeiBox Skill includes a standalone helper for downloading the selected source.',
};

class CliError extends Error {
  constructor(code, message, status) { super(message); this.code = code; this.status = status; }
}
export async function run(args) {
  const [command = 'help', ...values] = args;
  if (['help', '--help', '-h'].includes(command)) {
    if (values.length) throw new CliError('INVALID_ARGUMENTS', 'Help does not accept arguments.', 2);
    return CLI_HELP;
  }
  if (!['list', 'search', 'show'].includes(command)) throw new CliError('UNKNOWN_COMMAND', `Unknown command: ${command}. Use --help.`, 2);
  if (command === 'list' && values.length) throw new CliError('INVALID_ARGUMENTS', 'list does not accept arguments.', 2);
  if (command === 'search' && !values.join(' ').trim()) throw new CliError('INVALID_ARGUMENTS', 'search requires a non-empty query.', 2);
  if (command === 'show' && (values.length !== 1 || !/^[a-z]+(?:-[a-z]+)*$/.test(values[0]))) throw new CliError('INVALID_ARGUMENTS', 'show requires a catalog slug, for example glass-folder.', 2);
  const catalog = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  if (command === 'list') return { schemaVersion: catalog.schemaVersion, count: catalog.items.length, items: catalog.items };
  if (command === 'search') {
    const query = values.join(' ');
    const items = searchItems(catalog.items, query);
    if (!items.length) throw new CliError('NO_RESULTS', `No catalog entries match: ${query}`, 3);
    return { schemaVersion: catalog.schemaVersion, query, count: items.length, items };
  }
  const item = catalog.items.find(entry => entry.slug === values[0]);
  if (!item) throw new CliError('UNKNOWN_SLUG', `Unknown component slug: ${values[0]}`, 3);
  return JSON.parse(await fs.readFile(path.join(ROOT, 'public/ai/components', `${item.slug}.json`), 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.stdout.write(`${JSON.stringify(await run(process.argv.slice(2)), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.code && error.status ? error.code : 'CATALOG_UNAVAILABLE', message: error.status ? error.message : 'Could not read the AI catalog. Run npm run ai:catalog from the repository.', readOnly: true })}\n`);
    process.exitCode = error.status ?? 1;
  }
}
