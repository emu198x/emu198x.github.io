import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boardProfiles, browserPlayerFor} from '../src/lib/browser-player.js';
import {loadSiteData} from '../src/lib/site-data.js';
import {bootScreenshots} from '../src/data/boot-screenshots.js';

const family = (id, ids) => ({id, aliases: [], variants: ids.map(id => ({id}))});

test('a physical board selects its exact published profile', () => {
  const entry = family('msx2', ['sony-hb-f1']);
  assert.deepEqual(browserPlayerFor('sony-hb-f1', [entry]), {entry, variant: 'sony-hb-f1'});
  const philips = family('msx2', ['philips-vg-8235']);
  assert.deepEqual(browserPlayerFor('philips-vg-8235-00', [philips]), {entry: philips, variant: 'philips-vg-8235'});
});

test('a pinned player missing the board never substitutes a family default', () => {
  assert.equal(browserPlayerFor('sony-hb-10p', [family('msx', ['microsoft-msx1-ntsc'])]), null);
  assert.equal(browserPlayerFor('sony-hb-f1', [family('msx', ['sony-hb-f1'])]), null);
  assert.equal(browserPlayerFor('nintendo-game-boy-color', [family('nintendo-game-boy', ['dmg'])]), null);
});

test('retired MSX identities cannot render an apparent machine player', () => {
  const catalog = [{id: 'msx', aliases: ['microsoft-msx1'], variants: []}];
  assert.equal(browserPlayerFor('microsoft-msx1', catalog), null);
  assert.equal(browserPlayerFor('microsoft-msx2', catalog), null);
});

test('board mappings and capture claims join the actual flagship registry', () => {
  const {fleet} = loadSiteData();
  assert.ok(fleet.length > 0);
  const ids = new Set(fleet.map(entry => entry.machineId));
  assert.equal(new Set(boardProfiles.map(([id]) => id)).size, boardProfiles.length);
  for (const [id] of boardProfiles) assert.ok(ids.has(id), `unknown board ${id}`);
  for (const capture of bootScreenshots) assert.ok(ids.has(capture.machineId), `unknown capture ${capture.id}`);
  for (const id of ['microsoft-msx1', 'microsoft-msx2', 'sord-m5', 'coleco-colecovision', 'commodore-vic-20', 'spectravideo-svi-328']) assert.ok(!ids.has(id), `retired aggregate ${id}`);
  const sony = bootScreenshots.find(entry => entry.machineId === 'sony-hb-f1');
  assert.ok(sony);
  assert.deepEqual(sony.capture.args.slice(0, 2), ['--model', 'sony-hb-f1']);
  assert.ok(!bootScreenshots.some(entry => entry.image === '/media/boot/msx1.png'));
});

test('regional Atari and ZX boards resolve only their own existing player profile', () => {
  for (const [id, familyId, variant] of boardProfiles.filter(([id]) => /^(atari-(2600|7800)|sinclair-zx8[01]|timex-ts1000)/.test(id))) {
    const entry = family(familyId, [variant]);
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant}, id);
    assert.equal(browserPlayerFor(id, [family(familyId, [])]), null, id);
  }
});
