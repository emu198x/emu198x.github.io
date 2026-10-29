import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('registry spelling is exempt while ordinary American prose still fails', () => {
  const dir = mkdtempSync(join(tmpdir(), '198x-site-prose-'));
  const path = join(dir, 'control.html');
  try {
    writeFileSync(path, '<html><head><title>Nintendo Game Boy Color</title></head><body><p>nintendo-game-boy-color</p><p>The color is blue.</p></body></html>');
    const report = JSON.parse(execFileSync('vale', ['--config', join(process.cwd(), '.vale.ini'), '--output=JSON', path], {encoding: 'utf8'}));
    const alerts = Object.values(report).flat();
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].Check, 'House198x.BritishEnglish');
    assert.equal(alerts[0].Match, 'color');
  } finally {
    rmSync(dir, {recursive: true});
  }
});
