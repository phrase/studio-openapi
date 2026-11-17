import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const METHODS = ['get', 'put', 'post', 'delete', 'patch'];

// Identifiers of Studio's inner workings; an API caller never needs them, so they must not appear in the spec.
export const INTERNAL_FIELDS = [
  'accountId',
  'accountUid',
  'organizationId',
  'organizationUid',
  'identityId',
  'identityUid',
  'owner',
  'username',
];

// `example` (one value, also an array) and `examples` (named values) both hold sample data a caller reads.
const IN_EXAMPLE = /\/examples?(\/|\[|$)/;
const OPERATION_ID = /^[a-z][A-Za-z0-9]+$/;

function checkOperation(path, method, operation, problems) {
  const where = `${method.toUpperCase()} ${path}`;
  for (const field of ['summary', 'description', 'operationId']) {
    if (!operation[field]) problems.push(`${where}: missing ${field}`);
  }
  if (operation.operationId && !OPERATION_ID.test(operation.operationId)) {
    problems.push(`${where}: operationId "${operation.operationId}" must be camelCase`);
  }
  if (!operation.tags?.length) problems.push(`${where}: missing tags`);
  if (!operation.security?.length) problems.push(`${where}: missing security`);
  if (operation.security?.some((requirement) => Object.keys(requirement ?? {}).length === 0)) {
    problems.push(`${where}: security has an anonymous alternative`);
  }

  const codes = Object.keys(operation.responses ?? {});
  if (!codes.some((code) => /^[23]/.test(code))) problems.push(`${where}: no success or redirect response`);
  if (!codes.some((code) => code.startsWith('4'))) problems.push(`${where}: no 4xx response`);
  if (operation.security?.length && !codes.includes('401')) problems.push(`${where}: missing 401 response`);

  for (const parameter of operation.parameters ?? []) {
    if (!parameter.description) problems.push(`${where}: parameter "${parameter.name}" has no description`);
  }
  for (const [code, response] of Object.entries(operation.responses ?? {})) {
    if (!response.description) problems.push(`${where}: response ${code} has no description`);
    if (!code.startsWith('2')) continue;
    for (const [mediaType, media] of Object.entries(response.content ?? {})) {
      if (media.example === undefined && media.examples === undefined) {
        problems.push(`${where}: ${code} ${mediaType} response has no example`);
      }
    }
  }
}

function walk(node, location, problems) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, `${location}[${index}]`, problems));
    return;
  }
  if (node === null || typeof node !== 'object') return;

  if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
    for (const [name, schema] of Object.entries(node.properties)) {
      if (INTERNAL_FIELDS.includes(name)) problems.push(`${location}/properties/${name}: internal field in a schema`);
      const isReference = schema && (schema.$ref || schema.allOf || schema.oneOf || schema.anyOf);
      if (!isReference && !schema?.description) problems.push(`${location}/properties/${name}: missing description`);
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (INTERNAL_FIELDS.includes(key) && IN_EXAMPLE.test(location)) {
      problems.push(`${location}/${key}: internal field in an example`);
    }
    walk(value, `${location}/${key}`, problems);
  }
}

/** Returns the list of rule violations of a bundled OpenAPI document. */
export function checkSpec(spec) {
  const problems = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      if (item[method]) checkOperation(path, method, item[method], problems);
    }
  }
  for (const [name, scheme] of Object.entries(spec.components?.securitySchemes ?? {})) {
    if (!scheme.description) problems.push(`securityScheme ${name}: missing description`);
  }
  walk(spec, '#', problems);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const spec = JSON.parse(readFileSync(join(repoRoot, 'schemas', 'projects.json'), 'utf8'));
  const problems = checkSpec(spec);
  if (problems.length > 0) {
    console.error(`${problems.length} spec rule violation(s):`);
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exitCode = 1;
  } else {
    console.log('Spec rules: no violations.');
  }
}
