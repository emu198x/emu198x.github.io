import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boardProfiles, browserPlayerFor} from '../src/lib/browser-player.js';
import {loadSiteData} from '../src/lib/site-data.js';
import {bootScreenshots, captureTargets} from '../src/data/boot-screenshots.js';
import {existsSync} from 'node:fs';

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


test('XL/XE pages select the four stable family profile contracts', () => {
  const entry = family('atari-800xl', ['atari-800xl-ntsc', 'atari-800xl-pal', 'atari-130xe-ntsc', 'atari-130xe-pal']);
  for (const [board, variant] of [
    ['atari-800xl', 'atari-800xl-ntsc'],
    ['atari-800xl-pal', 'atari-800xl-pal'],
    ['atari-130xe-ntsc', 'atari-130xe-ntsc'],
    ['atari-130xe-pal', 'atari-130xe-pal'],
  ]) assert.deepEqual(browserPlayerFor(board, [entry]), {entry, variant}, board);
});

test('a player with only XL profiles cannot substitute one for an XE board', () => {
  const xlOnly = family('atari-800xl', ['atari-800xl-ntsc', 'atari-800xl-pal']);
  assert.equal(browserPlayerFor('atari-130xe-ntsc', [xlOnly]), null);
  assert.equal(browserPlayerFor('atari-130xe-pal', [xlOnly]), null);
});


test('Aquarius pages require the exact regional profile', () => {
  const entry = family('mattel-aquarius', ['mattel-aquarius', 'mattel-aquarius-pal']);
  assert.deepEqual(browserPlayerFor('mattel-aquarius', [entry]), {entry, variant: 'mattel-aquarius'});
  assert.deepEqual(browserPlayerFor('mattel-aquarius-pal', [entry]), {entry, variant: 'mattel-aquarius-pal'});
  assert.equal(browserPlayerFor('mattel-aquarius-pal', [family('mattel-aquarius', ['mattel-aquarius'])]), null);
});


test('Mega Drive boards select their existing market profiles', () => {
  const entry = family('sega-mega-drive', ['mega-drive-japan', 'genesis', 'mega-drive-europe']);
  for (const [id, variant] of [
    ['sega-mega-drive-japan', 'mega-drive-japan'],
    ['sega-genesis', 'genesis'],
    ['sega-mega-drive-europe', 'mega-drive-europe'],
  ]) {
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant});
    assert.equal(browserPlayerFor(id, [family('sega-mega-drive', [])]), null);
  }
});


test('the retired Mega Drive aggregate cannot embed a default board', () => {
  assert.equal(browserPlayerFor('sega-mega-drive', [family('sega-mega-drive', ['genesis'])]), null);
});


test('Timex 2068 pages select exact existing Spectrum variants', () => {
  const entry = family('sinclair-zx-spectrum', ['spectrum_48k', 'timex_tc2068', 'timex_ts2068']);
  for (const [id, variant] of [['timex-tc2068', 'timex_tc2068'], ['timex-ts2068', 'timex_ts2068']]) {
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant});
    assert.equal(browserPlayerFor(id, [family('sinclair-zx-spectrum', ['spectrum_48k'])]), null);
  }
});

test('Timex diagnostic stripes cannot become public boot evidence', () => {
  const targets = captureTargets();
  assert.ok(targets.length > 0);
  assert.ok(targets.some(target => target.id === 'zx-spectrum'));
  for (const id of ['timex-tc2068', 'timex-ts2068']) {
    assert.ok(!targets.some(target => target.id === id), id);
    assert.ok(existsSync(new URL(`../public/media/boot/${id}.png`, import.meta.url)), 'diagnostic image retained');
  }
});


test('NES boards select exact regional variants and the old plate proves NTSC only', () => {
  const entry = family('nintendo-nes', ['nintendo-nes-ntsc', 'nintendo-nes-pal']);
  for (const id of ['nintendo-nes-ntsc', 'nintendo-nes-pal']) {
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant: id});
    assert.equal(browserPlayerFor(id, [family('nintendo-nes', [])]), null);
  }
  assert.equal(browserPlayerFor('nintendo-nes', [entry]), null);
  const plate = bootScreenshots.find(item => item.id === 'nes');
  assert.equal(plate.machineId, 'nintendo-nes-ntsc');
  assert.deepEqual(plate.capture.args.slice(0, 2), ['--model', 'nintendo-nes-ntsc']);
  assert.ok(!bootScreenshots.some(item => item.machineId === 'nintendo-nes-pal'));
});


test('CPC owners require their exact browser variant and separate boot captures', () => {
  const ids = ['amstrad-cpc464', 'amstrad-cpc664', 'amstrad-cpc6128'];
  const entry = family('amstrad-cpc', ids);
  for (const id of ids) {
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant: id});
    assert.equal(browserPlayerFor(id, [family('amstrad-cpc', [])]), null);
    const plate = bootScreenshots.find(item => item.machineId === id);
    assert.ok(plate, id);
    assert.deepEqual(plate.capture.args.slice(0, 2), ['--model', id]);
    assert.ok(plate.capture.requiredFiles.some(path => path.endsWith(`${id.slice(8)}.rom`)));
  }
  assert.equal(browserPlayerFor('amstrad-cpc', [entry]), null);
  assert.equal(new Set(bootScreenshots.filter(item => ids.includes(item.machineId)).map(item => item.image)).size, 3);
});


test('ST configurations require exact browser profiles and their own EmuTOS captures', () => {
  const variants = ['520st-pal', '520st-ntsc', '1040st-pal', '1040st-ntsc'];
  const entry = family('atari-st', variants);
  const paths = [];
  for (const variant of variants) {
    const id = `atari-${variant}`;
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant});
    assert.equal(browserPlayerFor(id, [family('atari-st', [])]), null);
    assert.equal(browserPlayerFor(id, []), null);
    const plate = bootScreenshots.find(item => item.machineId === id);
    assert.ok(plate, id);
    assert.deepEqual(plate.capture.args.slice(0, 2), ['--model', variant]);
    assert.equal(plate.capture.mediaEnv, 'EMU198X_EMUTOS_ROM');
    paths.push(plate.image);
  }
  assert.equal(browserPlayerFor('atari-st', [entry]), null);
  assert.equal(new Set(paths).size, variants.length);
});

test('C64 and C128 pages require an exact published variant and distinct captures', () => {
  const mappings = boardProfiles.filter(([id]) => /^commodore-(c64|c128)/.test(id));
  assert.equal(mappings.length, 6);
  const images = new Set();
  for (const [id, group, variant] of mappings) {
    const exact = family(group, [variant]);
    assert.deepEqual(browserPlayerFor(id, [exact]), {entry: exact, variant});
    assert.equal(browserPlayerFor(id, [family(group, [])]), null);
    assert.equal(browserPlayerFor(id, []), null);
    const capture = bootScreenshots.find(item => item.machineId === id);
    assert.ok(capture);
    const args = capture.capture.args;
    assert.equal(args[args.indexOf('--model') + 1], variant);
    images.add(capture.image);
  }
  assert.equal(images.size, 6);
  for (const legacy of ['commodore-c64', 'commodore-c128']) assert.equal(browserPlayerFor(legacy, [family(legacy, ['pal'])]), null);
});


test('corrected PET boards have distinct captures and reject the pinned hybrid player', () => {
  const profiles = ['commodore-pet-2001n-32k', 'commodore-pet-40col', 'commodore-pet-80col'];
  const ids = ['commodore-pet-2001n-32k', 'commodore-pet-4032', 'commodore-pet-8032'];
  const pinned = family('commodore-pet', profiles);
  for (const [index, id] of ids.entries()) {
    const plate = captureTargets().find(item => item.machineId === id);
    assert.ok(plate?.hasImage, id);
    assert.equal(plate.image, `/media/boot/${id}.png`);
    assert.deepEqual(plate.capture.args.slice(0, 4), ['--headless', '--model', profiles[index], '--rom-dir']);
    assert.equal(browserPlayerFor(id, [pinned]), null);
    assert.equal(browserPlayerFor(id, [family(id, profiles)]), null);
  }
  assert.equal(browserPlayerFor('commodore-pet', [pinned]), null);
});


test('SNES regional owners require exact variants and do not invent a third board', () => {
  const entry = family('nintendo-snes', ['snes-ntsc', 'snes-pal', 'super-famicom']);
  for (const [id, variant] of [['nintendo-snes-ntsc', 'snes-ntsc'], ['nintendo-snes-pal', 'snes-pal']]) {
    assert.deepEqual(browserPlayerFor(id, [entry]), {entry, variant});
    assert.equal(browserPlayerFor(id, [family('nintendo-snes', ['super-famicom'])]), null);
    assert.equal(browserPlayerFor(id, []), null);
  }
  assert.equal(browserPlayerFor('nintendo-snes', [entry]), null);
  assert.ok(!boardProfiles.some(([id]) => id === 'nintendo-super-famicom'));
});
