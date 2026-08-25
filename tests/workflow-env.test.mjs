import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// EMU198X_SOURCE_ROOT was set on the build step alone, so the test step ran
// without it and fell back to `process.cwd()/../emu198x` — a path that does
// not exist on a runner, where the flagship is checked out at
// $GITHUB_WORKSPACE/emu198x-source. Every pull request failed at "Run tests"
// and never reached the build, the sweep or the deploy.
//
// Per-step env is what made that possible: a step either carries the copy or
// it silently gets the wrong root. One job-level definition removes the
// choice, and these gates hold it there — a step-level copy reintroduces the
// per-step decision even when the copy itself is correct.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = join(ROOT, '.github/workflows/pages.yml');
const VARIABLE = 'EMU198X_SOURCE_ROOT';

const source = readFileSync(WORKFLOW, 'utf8');
const lines = source.split('\n');

// Enough YAML to answer "at what indent does this key live, and inside which
// job". A real parser would need a dependency, and the question is shallow:
// job keys sit at four spaces under `  <job>:`, step keys deeper still.
function indentOf(line) {
  return line.length - line.trimStart().length;
}

function blockOf(header, indent) {
  const start = lines.findIndex((line) => indentOf(line) === indent && line.trim() === header);
  assert.notEqual(start, -1, `${WORKFLOW} has no ${header} at indent ${indent}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (indentOf(line) <= indent) {
      end = i;
      break;
    }
  }
  return { start, end, lines: lines.slice(start + 1, end) };
}

test('the flagship checkout path is set once, at job level', () => {
  const build = blockOf('build:', 2);
  const jobKeys = build.lines.filter((line) => indentOf(line) === 4 && /^\s*\S+:/.test(line));
  assert.ok(
    jobKeys.some((line) => line.trim() === 'env:'),
    'the build job has no job-level env: block',
  );

  const env = blockOf('env:', 4);
  assert.ok(
    env.lines.some((line) => line.trim().startsWith(`${VARIABLE}:`)),
    `the job-level env: block does not set ${VARIABLE}`,
  );

  // Set once, so no step can be reached that has not inherited it. A second
  // mention is a second decision, and the failure this test exists for was a
  // step that was not part of the first one.
  const mentions = lines.filter((line) => line.includes(VARIABLE));
  assert.equal(
    mentions.length,
    1,
    `${VARIABLE} is named ${mentions.length} times; a job-level definition is named once`,
  );
});

test('the source root points at the checkout the workflow actually makes', () => {
  const env = blockOf('env:', 4);
  const setting = env.lines.find((line) => line.trim().startsWith(`${VARIABLE}:`));
  const value = setting.slice(setting.indexOf(':') + 1).trim();

  // The value has to name the directory the flagship is checked out into,
  // not merely be present: a job-level variable pointing at the wrong path
  // fails the same way, one step later.
  const checkoutPath = lines
    .filter((line) => line.trim().startsWith('path:'))
    .map((line) => line.split(':')[1].trim());
  assert.ok(checkoutPath.length > 0, 'no checkout step names a path');
  assert.ok(
    checkoutPath.some((path) => value.includes(path)),
    `${VARIABLE} is ${value}, which names none of the checkout paths ${checkoutPath.join(', ')}`,
  );
  assert.match(value, /github\.workspace/);
});

test('every step that loads the flagship data runs inside that job', () => {
  // The variable is inherited, not passed, so the guarantee is positional:
  // the steps that need it have to live in the job that defines it. A test
  // step moved to a job of its own would compile fine and fail on a runner.
  const build = blockOf('build:', 2);
  const steps = build.lines.filter((line) => line.trim().startsWith('run:')).join('\n');
  assert.match(steps, /npm test/);
  assert.match(steps, /npm run build/);
  assert.match(steps, /npm run a11y/);
});
