// Physical board -> existing browser family/profile. IDs are stated rather
// than inferred from names: a published player can predate a board split.
export const boardProfiles = Object.freeze([
  ['mattel-aquarius', 'mattel-aquarius', 'mattel-aquarius'],
  ['mattel-aquarius-pal', 'mattel-aquarius', 'mattel-aquarius-pal'],
  ['atari-800xl', 'atari-800xl', 'atari-800xl-ntsc'],
  ['atari-800xl-pal', 'atari-800xl', 'atari-800xl-pal'],
  ['atari-130xe-ntsc', 'atari-800xl', 'atari-130xe-ntsc'],
  ['atari-130xe-pal', 'atari-800xl', 'atari-130xe-pal'],
  ['atari-2600', 'atari-2600', 'atari-2600-ntsc'],
  ['atari-2600-pal', 'atari-2600', 'atari-2600-pal'],
  ['atari-7800', 'atari-7800', 'atari-7800-ntsc'],
  ['atari-7800-pal', 'atari-7800', 'atari-7800-pal'],
  ['sinclair-zx80', 'sinclair-zx80', 'sinclair-zx80'],
  ['sinclair-zx80-usa', 'sinclair-zx80', 'sinclair-zx80-usa'],
  ['sinclair-zx81', 'sinclair-zx81', 'sinclair-zx81'],
  ['timex-ts1000', 'sinclair-zx81', 'timex-ts1000'],
  ['acorn-bbc-micro', 'acorn-bbc-micro', 'acorn-bbc-micro-b'],
  ['acorn-bbc-micro-b-plus', 'acorn-bbc-micro', 'acorn-bbc-micro-b-plus'],
  ['acorn-bbc-master-128', 'acorn-bbc-micro', 'acorn-bbc-master-128'],
  ['dragon', 'dragon', 'dragon32'],
  ['dragon-64', 'dragon', 'dragon64'],
  ['tandy-coco', 'dragon', 'coco1'],
  ['tandy-coco-2', 'dragon', 'coco2'],
  ['nintendo-game-boy', 'nintendo-game-boy', 'dmg'],
  ['nintendo-game-boy-pocket', 'nintendo-game-boy', 'mgb'],
  ['nintendo-super-game-boy', 'nintendo-game-boy', 'sgb'],
  ['nintendo-super-game-boy-2', 'nintendo-game-boy', 'sgb2'],
  ['nintendo-game-boy-color', 'nintendo-game-boy', 'cgb'],
  ['nintendo-game-boy-advance', 'nintendo-game-boy', 'agb'],
  ['sega-master-system', 'sega-master-system', 'sms-ntsc'],
  ['sega-master-system-pal', 'sega-master-system', 'sms-pal'],
  ['sega-master-system-japan', 'sega-master-system', 'sms-japan-ntsc'],
  ['sega-master-system-1-ntsc', 'sega-master-system', 'sms1-ntsc'],
  ['sega-master-system-1-pal', 'sega-master-system', 'sms1-pal'],
  ['sega-master-system-2-ntsc', 'sega-master-system', 'sms2-ntsc'],
  ['sega-master-system-2-pal', 'sega-master-system', 'sms2-pal'],
  ['sega-mark-iii', 'sega-master-system', 'mark-iii'],
  ['sega-game-gear', 'sega-game-gear', 'game-gear'],
  ...['coleco-colecovision', 'commodore-vic-20', 'sord-m5', 'spectravideo-svi-328'].flatMap(family =>
    ['ntsc', 'pal'].map(region => [`${family}-${region}`, family, `${family}-${region}`])),
  ...['sony-hb-10p', 'toshiba-hx-10', 'mitsubishi-ml-f80', 'yamaha-cx5m', 'mitsubishi-ml-fx1', 'sony-hb-10']
    .map(id => [id, 'msx', id]),
  ['philips-vg-8235-00', 'msx2', 'philips-vg-8235'],
  ['sony-hb-f1', 'msx2', 'sony-hb-f1'],
  ['panasonic-fs-a1', 'msx2', 'panasonic-fs-a1'],
]);

export function browserPlayerFor(machineId, catalog) {
  if (['microsoft-msx1', 'microsoft-msx2'].includes(machineId)) return null;
  const board = boardProfiles.find(([id]) => id === machineId);
  if (board) {
    const [, family, variant] = board;
    const entry = catalog.find(item => item.id === family);
    // Never substitute a family default for hardware absent from the pinned
    // player. Updating that package can enable this exact profile later.
    return entry?.variants?.some(item => item.id === variant) ? {entry, variant} : null;
  }
  const entry = catalog.find(item => item.id === machineId || item.aliases.includes(machineId));
  return entry ? {entry, variant: entry.variantAliases?.[machineId]} : null;
}
