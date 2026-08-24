import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readEvidence } from '../src/lib/evidence.js';

function fixture(body) {
  const root = mkdtempSync(join(tmpdir(), 'ev-'));
  mkdirSync(join(root, 'docs', 'status'), { recursive: true });
  writeFileSync(join(root, 'docs', 'status', 'current-system-usability.md'), body);
  return root;
}

const TABLE = `# Current system usability

Prose that is not a table.

| Machine | Ships from | Own crates | Shared crates | Issues | Milestone |
|---|---|---|---|---|---|
| \`acorn-atom\` | \`emu198x-acorn-atom\` | 4 | 9 | [system:atom](https://x/issues) | [Acorn Atom 100%](https://x/ms) |
`;

test('reads a row into evidence', () => {
  const evidence = readEvidence(fixture(TABLE));
  assert.deepEqual(evidence.get('acorn-atom'), {
    ownCrates: 4,
    sharedCrates: 9,
    issuesUrl: 'https://x/issues',
    milestoneUrl: 'https://x/ms',
  });
});

test('a file with no table fails', () => {
  assert.throws(() => readEvidence(fixture('# Nothing\n')), /no evidence table/);
});

test('a row with a non-numeric count fails and names the machine', () => {
  const broken = TABLE.replace('| 4 | 9 |', '| many | 9 |');
  assert.throws(() => readEvidence(fixture(broken)), /acorn-atom/);
});
