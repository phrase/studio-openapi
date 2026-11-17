import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleTo } from './bundle.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = mkdtempSync(join(tmpdir(), 'studio-openapi-'));

try {
  const fresh = join(tempDir, 'projects.json');
  bundleTo(fresh);
  const committed = readFileSync(join(repoRoot, 'schemas', 'projects.json'), 'utf8');
  if (readFileSync(fresh, 'utf8') !== committed) {
    console.error('schemas/projects.json is out of date with spec/. Run `npm run bundle` and commit the result.');
    process.exitCode = 1;
  } else {
    console.log('schemas/projects.json matches spec/.');
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
