import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Bundles the modular source in spec/ into one OpenAPI document, the artifact the developer hub publishes. */
export function bundleTo(outputPath) {
  execFileSync(
    join(repoRoot, 'node_modules', '.bin', 'redocly'),
    ['bundle', join(repoRoot, 'spec', 'openapi.json'), '--output', outputPath, '--ext', 'json'],
    { cwd: repoRoot, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  const bundled = readFileSync(outputPath, 'utf8');
  if (!bundled.endsWith('\n')) {
    writeFileSync(outputPath, `${bundled}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = join(repoRoot, 'schemas', 'projects.json');
  bundleTo(output);
  console.log(`Bundled spec/openapi.json into ${output}`);
}
