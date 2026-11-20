import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { checkSpec } from './check-spec-rules.mjs';

const cleanOperation = () => ({
  summary: 'List things',
  description: 'Lists the things you can use.',
  operationId: 'listThings',
  tags: ['Things'],
  security: [{ apiKeyAuth: [] }],
  parameters: [{ name: 'page', in: 'query', description: 'Page number.' }],
  responses: {
    200: { description: 'OK', content: { 'application/json': { example: { id: '1' } } } },
    401: { description: 'Unauthorized' },
  },
});

const specWith = (operation, extra = {}) => ({
  paths: { '/v1/things': { get: operation } },
  components: { securitySchemes: { apiKeyAuth: { description: 'Key.' } } },
  ...extra,
});

test('a complete operation passes', () => {
  assert.deepEqual(checkSpec(specWith(cleanOperation())), []);
});

test('flags an anonymous security alternative, which lets a caller in without a key', () => {
  const operation = { ...cleanOperation(), security: [{ apiKeyAuth: [] }, {}] };
  assert.match(checkSpec(specWith(operation)).join('\n'), /security has an anonymous alternative/);
});

test('checks every HTTP method of a path, not only the common ones', () => {
  for (const method of ['head', 'options', 'trace']) {
    const operation = cleanOperation();
    delete operation.security;
    const spec = { ...specWith(operation), paths: { '/v1/things': { [method]: operation } } };
    assert.match(checkSpec(spec).join('\n'), /missing security/, method);
  }
});

test('flags a missing description, summary and operationId', () => {
  const operation = cleanOperation();
  delete operation.description;
  delete operation.summary;
  delete operation.operationId;
  const problems = checkSpec(specWith(operation));
  assert.equal(problems.filter((problem) => /missing (description|summary|operationId)/.test(problem)).length, 3);
});

test('flags an operationId that is not camelCase', () => {
  const operation = { ...cleanOperation(), operationId: 'list_things' };
  assert.match(checkSpec(specWith(operation))[0], /camelCase/);
});

test('flags a missing 4xx and 401 response and a missing example', () => {
  const operation = cleanOperation();
  operation.responses = { 200: { description: 'OK', content: { 'application/json': {} } } };
  const problems = checkSpec(specWith(operation)).join('\n');
  assert.match(problems, /no 4xx response/);
  assert.match(problems, /missing 401 response/);
  assert.match(problems, /has no example/);
});

test('flags a parameter and a security scheme without description', () => {
  const operation = cleanOperation();
  operation.parameters = [{ name: 'page', in: 'query' }];
  const problems = checkSpec(specWith(operation, { components: { securitySchemes: { apiKeyAuth: {} } } })).join('\n');
  assert.match(problems, /parameter "page" has no description/);
  assert.match(problems, /securityScheme apiKeyAuth: missing description/);
});

test('flags schema properties without description but accepts references', () => {
  const spec = specWith(cleanOperation(), {
    components: {
      securitySchemes: { apiKeyAuth: { description: 'Key.' } },
      schemas: {
        Thing: { type: 'object', properties: { id: { type: 'string' }, owner: { $ref: '#/components/schemas/Other' } } },
      },
    },
  });
  const problems = checkSpec(spec).join('\n');
  assert.match(problems, /Thing\/properties\/id: missing description/);
  assert.doesNotMatch(problems, /properties\/owner: missing description/);
});

test('flags internal fields in a singular example and in an example that is a list', () => {
  const operation = cleanOperation();
  operation.responses[200].content['application/json'] = {
    schema: { type: 'object', description: 'Thing.', example: { accountId: 'private' } },
    example: [{ organizationId: 'org-1' }],
  };
  const problems = checkSpec(specWith(operation)).join('\n');
  assert.match(problems, /accountId: internal field in an example/);
  assert.match(problems, /organizationId: internal field in an example/);
});

test('flags internal fields in schemas and in examples', () => {
  const operation = cleanOperation();
  operation.responses[200].content['application/json'] = {
    schema: { type: 'object', properties: { accountId: { type: 'string', description: 'Account.' } } },
    examples: { sample: { value: { organizationId: 'org-1' } } },
  };
  const problems = checkSpec(specWith(operation)).join('\n');
  assert.match(problems, /properties\/accountId: internal field in a schema/);
  assert.match(problems, /organizationId: internal field in an example/);
});

test('the published spec follows every rule', () => {
  const spec = JSON.parse(readFileSync(new URL('../schemas/projects.json', import.meta.url), 'utf8'));
  assert.deepEqual(checkSpec(spec), []);
});
