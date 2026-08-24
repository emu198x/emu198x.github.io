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

test('a row whose link label contains ] parses correctly', () => {
  const withBracket = TABLE.replace('[system:atom]', '[foo]bar]');
  const evidence = readEvidence(fixture(withBracket));
  assert.deepEqual(evidence.get('acorn-atom'), {
    ownCrates: 4,
    sharedCrates: 9,
    issuesUrl: 'https://x/issues',
    milestoneUrl: 'https://x/ms',
  });
});

test('a row whose URL contains ) parses correctly', () => {
  const withParen = TABLE.replace('https://x/issues', 'https://x/issues?q=foo)bar');
  const evidence = readEvidence(fixture(withParen));
  assert.equal(evidence.get('acorn-atom').issuesUrl, 'https://x/issues?q=foo)bar');
});

test('a CRLF file parses correctly', () => {
  const crlf = TABLE.replace(/\n/g, '\r\n');
  const evidence = readEvidence(fixture(crlf));
  assert.equal(evidence.size, 1);
  assert.ok(evidence.has('acorn-atom'));
});

test('a row with trailing spaces parses correctly', () => {
  const trailing = TABLE.replace(
    '| [Acorn Atom 100%](https://x/ms) |',
    '| [Acorn Atom 100%](https://x/ms) |  '
  );
  const evidence = readEvidence(fixture(trailing));
  assert.ok(evidence.has('acorn-atom'));
});

test('a data row that cannot be parsed throws and names the machine', () => {
  const broken = TABLE.replace('[system:atom](https://x/issues)', 'broken[link');
  assert.throws(() => readEvidence(fixture(broken)), /acorn-atom/);
});

test('missing file throws with path', () => {
  const root = mkdtempSync(join(tmpdir(), 'ev-'));
  assert.throws(() => readEvidence(root), /current-system-usability\.md/);
});
