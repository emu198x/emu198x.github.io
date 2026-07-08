const romRoot = '~/.emu198x/roms';

export const captureKindLabels = {
  boot: 'Boot',
  basic: 'BASIC',
  software: 'Software',
};

const defaultRightsNote = 'Captured from locally supplied firmware or media. Emu198x does not distribute ROMs, disks, tapes, or cartridges.';

const spectrumVariant = (id, name, machine, requiredFiles, maxFrames = 300, caption = `${name} firmware boot capture.`) => ({
  id,
  name,
  kind: 'boot',
  title: `${name} boot`,
  image: `/media/boot/${id}.png`,
  caption,
  rightsNote: defaultRightsNote,
  capture: {
    package: 'emu198x-spectrum',
    mode: 'script',
    args: ['--script', '{script}'],
    script: [
      { action: 'set_machine', machine },
      { action: 'run_frames', frames: maxFrames },
      { action: 'save_screenshot', path: '{output}' },
    ],
    requiredFiles,
  },
});

const spectrumVariants = [
  spectrumVariant('zx-spectrum-16k', 'ZX Spectrum 16K', 'spectrum_16k', [
    `${romRoot}/sinclair-zx-spectrum-48k/48.rom`,
  ]),
  spectrumVariant('zx-spectrum-plus', 'ZX Spectrum+', 'spectrum_plus', [
    `${romRoot}/sinclair-zx-spectrum-48k/48.rom`,
  ], 300, 'ZX Spectrum+ fixed-frame boot capture. This model shares the 48K ROM.'),
  spectrumVariant('zx-spectrum-128k', 'ZX Spectrum 128', 'spectrum_128k', [
    `${romRoot}/sinclair-zx-spectrum-128k/128-0.rom`,
    `${romRoot}/sinclair-zx-spectrum-128k/128-1.rom`,
  ]),
  spectrumVariant('zx-spectrum-plus2', 'ZX Spectrum +2', 'spectrum_plus2', [
    `${romRoot}/amstrad-zx-spectrum-plus2/plus2-0.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus2/plus2-1.rom`,
  ]),
  spectrumVariant('zx-spectrum-plus2a', 'ZX Spectrum +2A', 'spectrum_plus2a', [
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-0.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-1.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-2.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-3.rom`,
  ]),
  spectrumVariant('zx-spectrum-plus2b', 'ZX Spectrum +2B', 'spectrum_plus2b', [
    `${romRoot}/amstrad-zx-spectrum-plus2b/plus3-0.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus2b/plus3-1.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus2b/plus3-2.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus2b/plus3-3.rom`,
  ]),
  spectrumVariant('zx-spectrum-plus3', 'ZX Spectrum +3', 'spectrum_plus3', [
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-0.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-1.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-2.rom`,
    `${romRoot}/amstrad-zx-spectrum-plus3/plus3-3.rom`,
  ]),
  spectrumVariant('pentagon-128', 'Pentagon 128', 'pentagon_128', [
    `${romRoot}/pentagon-128/pentagon-0.rom`,
    `${romRoot}/pentagon-128/pentagon-1.rom`,
  ]),
  spectrumVariant('scorpion-zs256', 'Scorpion ZS-256', 'scorpion_zs256', [
    `${romRoot}/scorpion-zs256/scorpion-0.rom`,
    `${romRoot}/scorpion-zs256/scorpion-1.rom`,
    `${romRoot}/scorpion-zs256/scorpion-2.rom`,
    `${romRoot}/scorpion-zs256/scorpion-3.rom`,
  ]),
  spectrumVariant('timex-tc2048', 'Timex TC2048', 'timex_tc2048', [
    `${romRoot}/timex-tc2048/tc2048.rom`,
  ]),
  spectrumVariant('timex-tc2068', 'Timex TC2068', 'timex_tc2068', [
    `${romRoot}/timex-ts2068/ts2068.rom`,
    `${romRoot}/timex-ts2068/exrom.rom`,
  ]),
  spectrumVariant('timex-ts2068', 'Timex TS2068', 'timex_ts2068', [
    `${romRoot}/timex-ts2068/ts2068.rom`,
    `${romRoot}/timex-ts2068/exrom.rom`,
  ]),
];

const amigaVariant = (id, name, model, kickstart) => ({
  id,
  name,
  kind: 'boot',
  title: `${name} boot`,
  image: `/media/boot/${id}.png`,
  caption: `${name} Kickstart boot capture.`,
  rightsNote: defaultRightsNote,
  capture: {
    package: 'emu198x-amiga',
    args: [
      '--headless',
      '--model',
      model,
      '--kickstart',
      kickstart,
      '--frames',
      '650',
      '--screenshot',
      '{output}',
    ],
    requiredFiles: [kickstart],
  },
});

const amigaVariants = [
  {
    id: 'amiga-a1000',
    name: 'Amiga A1000',
    kind: 'boot',
    title: 'Amiga A1000 boot',
    image: '/media/boot/amiga-a1000.png',
    caption: 'A1000 bootstrap capture. Set EMU198X_BOOT_AMIGA_A1000_DISK to publish this image.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-amiga',
      args: [
        '--headless',
        '--model',
        'a1000',
        '--kickstart',
        `${romRoot}/commodore-amiga/a1000-bootstrap.rom`,
        '--disk',
        '{media}',
        '--frames',
        '900',
        '--screenshot',
        '{output}',
      ],
      mediaEnv: 'EMU198X_BOOT_AMIGA_A1000_DISK',
      mediaLabel: 'A1000 Kickstart disk',
      requiredFiles: [`${romRoot}/commodore-amiga/a1000-bootstrap.rom`],
    },
  },
  amigaVariant('amiga-a500-a501', 'Amiga A500 + A501', 'a500-a501', `${romRoot}/commodore-amiga/kick13.rom`),
  amigaVariant('amiga-a500-plus', 'Amiga A500+', 'a500-plus', `${romRoot}/commodore-amiga/kick204.rom`),
  amigaVariant('amiga-a500-maxed', 'Amiga A500 maxed', 'a500-maxed', `${romRoot}/commodore-amiga/kick13.rom`),
  amigaVariant('amiga-a600', 'Amiga A600', 'a600', `${romRoot}/commodore-amiga/kick205.rom`),
  amigaVariant('amiga-a1200', 'Amiga A1200', 'a1200', `${romRoot}/commodore-amiga/kick31a1200.rom`),
  amigaVariant('amiga-a2000', 'Amiga A2000', 'a2000', `${romRoot}/commodore-amiga/kick13.rom`),
];

export const bootScreenshots = [
  {
    id: 'zx-spectrum',
    name: 'ZX Spectrum',
    kind: 'boot',
    title: 'ZX Spectrum 48K boot',
    group: 'Primary',
    href: '/docs/systems/sinclair/zx-spectrum/',
    image: '/media/boot/zx-spectrum.png',
    caption: '48K BASIC copyright screen captured from the shared script harness.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-spectrum',
      mode: 'script',
      args: ['--script', '{script}'],
      script: [
        { action: 'wait_for_boot', max_frames: 250 },
        { action: 'save_screenshot', path: '{output}' },
      ],
    },
    variants: spectrumVariants,
  },
  {
    id: 'commodore-c64',
    name: 'Commodore 64',
    kind: 'boot',
    title: 'Commodore 64 boot',
    group: 'Primary',
    href: '/docs/systems/commodore/c64/',
    image: '/media/boot/commodore-c64.png',
    caption: 'C64 BASIC READY prompt after the ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      args: [
        '--headless',
        '--rom-dir',
        `${romRoot}/commodore-c64`,
        '--wait-for-boot',
        '200',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [
        `${romRoot}/commodore-c64/kernal.rom`,
        `${romRoot}/commodore-c64/basic.rom`,
        `${romRoot}/commodore-c64/chargen.rom`,
      ],
    },
  },
  {
    id: 'nes',
    name: 'Nintendo NES',
    kind: 'boot',
    title: 'Nintendo NES cartridge boot',
    group: 'Primary',
    href: '/docs/systems/nintendo/nes/',
    image: '/media/boot/nes.png',
    caption: 'Cartridge boot capture. Set EMU198X_BOOT_NES_ROM to publish this image.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-nes',
      args: ['--rom', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_NES_ROM',
      mediaLabel: 'NES ROM',
    },
  },
  {
    id: 'commodore-amiga',
    name: 'Commodore Amiga',
    kind: 'boot',
    title: 'Commodore Amiga boot',
    group: 'Primary',
    href: '/docs/systems/commodore/amiga/',
    image: '/media/boot/commodore-amiga.png',
    caption: 'A500 Kickstart 1.3 insert-disk screen.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-amiga',
      args: [
        '--headless',
        '--model',
        'a500',
        '--kickstart',
        `${romRoot}/commodore-amiga/kick13.rom`,
        '--frames',
        '650',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [`${romRoot}/commodore-amiga/kick13.rom`],
    },
    variants: amigaVariants,
  },
  {
    id: 'game-boy',
    name: 'Nintendo Game Boy',
    group: 'Primary',
    href: '/docs/systems/nintendo/game-boy/',
    image: '/media/boot/game-boy.png',
    caption: 'Cartridge boot capture. Set EMU198X_BOOT_GAME_BOY_ROM to publish this image.',
    capture: {
      package: 'emu198x-game-boy',
      args: ['--rom', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_GAME_BOY_ROM',
      mediaLabel: 'Game Boy ROM',
    },
  },
  {
    id: 'dragon-32',
    name: 'Dragon 32',
    group: 'Primary',
    href: '/docs/systems/dragon/',
    image: '/media/boot/dragon-32.png',
    caption: 'Dragon BASIC prompt after the fixed-cycle boot window.',
    capture: {
      package: 'emu198x-dragon',
      args: [
        '--headless',
        '--rom',
        `${romRoot}/dragon/dragon32.rom`,
        '--cycles',
        '3000000',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [`${romRoot}/dragon/dragon32.rom`],
    },
  },
  {
    id: 'atari-800xl',
    name: 'Atari 800XL',
    group: 'Extended',
    href: '/docs/systems/atari/800xl/',
    image: '/media/boot/atari-800xl.png',
    caption: 'Atari BASIC READY prompt.',
    capture: {
      package: 'emu198x-atari-800xl',
      args: [
        '--os',
        `${romRoot}/atari-800xl/atarixl.rom`,
        '--basic',
        `${romRoot}/atari-800xl/ataribas.rom`,
        '--frames',
        '300',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [
        `${romRoot}/atari-800xl/atarixl.rom`,
        `${romRoot}/atari-800xl/ataribas.rom`,
      ],
    },
  },
  {
    id: 'msx1',
    name: 'MSX1',
    group: 'Extended',
    href: '/docs/systems/msx/',
    image: '/media/boot/msx1.png',
    caption: 'MSX BASIC prompt with the function-key bar.',
    capture: {
      package: 'emu198x-msx',
      args: ['--bios', `${romRoot}/microsoft-msx/msx.rom`, '--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/microsoft-msx/msx.rom`],
    },
  },
  {
    id: 'sega-master-system',
    name: 'Sega Master System',
    group: 'Extended',
    href: '/docs/systems/sega/master-system/',
    image: '/media/boot/sega-master-system.png',
    caption: 'Cartridge title capture. Set EMU198X_BOOT_SMS_CART to publish this image.',
    capture: {
      package: 'emu198x-sega-master-system',
      args: ['--cart', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_SMS_CART',
      mediaLabel: 'Master System cartridge',
    },
  },
  {
    id: 'sord-m5',
    name: 'Sord M5',
    group: 'Extended',
    href: '/docs/systems/sord/m5/',
    image: '/media/boot/sord-m5.png',
    caption: 'Cartridge title capture. Set EMU198X_BOOT_SORD_M5_CART to publish this image.',
    capture: {
      package: 'emu198x-sord-m5',
      args: ['--cart', '{media}', '--frames', '1000', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_SORD_M5_CART',
      mediaLabel: 'Sord M5 cartridge',
      requiredFiles: [`${romRoot}/sord-m5/sord-m5.rom`],
    },
  },
  {
    id: 'tatung-einstein',
    name: 'Tatung Einstein',
    group: 'Extended',
    href: '/docs/systems/tatung/einstein/',
    image: '/media/boot/tatung-einstein.png',
    caption: 'Tatung/Xtal MOS prompt.',
    capture: {
      package: 'emu198x-tatung-einstein',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/tatung-einstein/einstein.rom`],
    },
  },
  {
    id: 'commodore-vic-20',
    name: 'Commodore VIC-20',
    group: 'Extended',
    href: '/docs/systems/commodore/vic-20/',
    image: '/media/boot/commodore-vic-20.png',
    caption: 'VIC-20 BASIC READY prompt.',
    capture: {
      package: 'emu198x-commodore-vic-20',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [
        `${romRoot}/commodore-vic-20/kernal.rom`,
        `${romRoot}/commodore-vic-20/basic.rom`,
        `${romRoot}/commodore-vic-20/char.rom`,
      ],
    },
  },
  {
    id: 'commodore-pet',
    name: 'Commodore PET',
    group: 'Extended',
    href: '/docs/systems/commodore/pet/',
    image: '/media/boot/commodore-pet.png',
    caption: 'PET BASIC READY prompt.',
    capture: {
      package: 'emu198x-commodore-pet',
      args: [
        '--kernal',
        `${romRoot}/commodore-pet/kernal.rom`,
        '--basic',
        `${romRoot}/commodore-pet/basic.rom`,
        '--editor',
        `${romRoot}/commodore-pet/editor.rom`,
        '--char',
        `${romRoot}/commodore-pet/char.rom`,
        '--frames',
        '300',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [
        `${romRoot}/commodore-pet/kernal.rom`,
        `${romRoot}/commodore-pet/basic.rom`,
        `${romRoot}/commodore-pet/editor.rom`,
        `${romRoot}/commodore-pet/char.rom`,
      ],
    },
  },
  {
    id: 'acorn-electron',
    name: 'Acorn Electron',
    group: 'Extended',
    href: '/docs/systems/acorn/electron/',
    image: '/media/boot/acorn-electron.png',
    caption: 'Acorn Electron BASIC prompt.',
    capture: {
      package: 'emu198x-acorn-electron',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/acorn-electron/os.rom`, `${romRoot}/acorn-electron/basic.rom`],
    },
  },
  {
    id: 'oric-atmos',
    name: 'Oric Atmos',
    group: 'Extended',
    href: '/docs/systems/oric/atmos/',
    image: '/media/boot/oric-atmos.png',
    caption: 'Oric Extended BASIC ready prompt.',
    capture: {
      package: 'emu198x-oric-atmos',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/oric/oric.rom`],
    },
  },
  {
    id: 'memotech-mtx',
    name: 'Memotech MTX',
    group: 'Extended',
    href: '/docs/systems/memotech/mtx/',
    image: '/media/boot/memotech-mtx.png',
    caption: 'MTX BASIC ready prompt.',
    capture: {
      package: 'emu198x-memotech-mtx',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/memotech-mtx/mtx.rom`],
    },
  },
  {
    id: 'spectravideo-svi-328',
    name: 'Spectravideo SVI-328',
    group: 'Extended',
    href: '/docs/systems/spectravideo/svi-328/',
    image: '/media/boot/spectravideo-svi-328.png',
    caption: 'SV-BASIC settled boot screen.',
    capture: {
      package: 'emu198x-spectravideo-svi-328',
      args: ['--frames', '900', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/spectravideo-svi-328/svi-328.rom`],
    },
  },
  {
    id: 'colecovision',
    name: 'ColecoVision',
    group: 'Extended',
    href: '/docs/systems/coleco/colecovision/',
    image: '/media/boot/colecovision.png',
    caption: 'ColecoVision BIOS splash.',
    capture: {
      package: 'emu198x-colecovision',
      args: ['--bios', `${romRoot}/coleco-colecovision/colecovision.rom`, '--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/coleco-colecovision/colecovision.rom`],
    },
  },
  {
    id: 'sega-sg-1000',
    name: 'Sega SG-1000',
    group: 'Extended',
    href: '/docs/systems/sega/sg-1000/',
    image: '/media/boot/sega-sg-1000.png',
    caption: 'Cartridge title capture. Set EMU198X_BOOT_SG1000_CART to publish this image.',
    capture: {
      package: 'emu198x-sega-sg-1000',
      args: ['--cart', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_SG1000_CART',
      mediaLabel: 'SG-1000 cartridge',
    },
  },
  {
    id: 'atari-2600',
    name: 'Atari 2600',
    group: 'Extended',
    href: '/docs/systems/atari/2600/',
    image: '/media/boot/atari-2600.png',
    caption: 'Cartridge boot capture. Set EMU198X_BOOT_ATARI_2600_CART to publish this image.',
    capture: {
      package: 'emu198x-atari-2600',
      args: ['--cart', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_ATARI_2600_CART',
      mediaLabel: 'Atari 2600 cartridge',
    },
  },
  {
    id: 'atari-5200',
    name: 'Atari 5200',
    group: 'Extended',
    href: '/docs/systems/atari/5200/',
    image: '/media/boot/atari-5200.png',
    caption: 'Cartridge boot capture. Set EMU198X_BOOT_ATARI_5200_CART to publish this image.',
    capture: {
      package: 'emu198x-atari-5200',
      args: ['--bios', `${romRoot}/atari-5200/5200.rom`, '--cart', '{media}', '--frames', '320', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_ATARI_5200_CART',
      mediaLabel: 'Atari 5200 cartridge',
      requiredFiles: [`${romRoot}/atari-5200/5200.rom`],
    },
  },
  {
    id: 'atari-7800',
    name: 'Atari 7800',
    group: 'Extended',
    href: '/docs/systems/atari/7800/',
    image: '/media/boot/atari-7800.png',
    caption: 'Cartridge boot capture. Set EMU198X_BOOT_ATARI_7800_CART to publish this image.',
    capture: {
      package: 'emu198x-atari-7800',
      args: ['--bios', `${romRoot}/atari-7800/Atari 7800 BIOS (1984)(Atari)(NTSC).bin`, '--cart', '{media}', '--frames', '300', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_ATARI_7800_CART',
      mediaLabel: 'Atari 7800 cartridge',
      requiredFiles: [`${romRoot}/atari-7800/Atari 7800 BIOS (1984)(Atari)(NTSC).bin`],
    },
  },
  {
    id: 'jupiter-ace',
    name: 'Jupiter Ace',
    group: 'Extended',
    href: '/docs/systems/jupiter/ace/',
    image: '/media/boot/jupiter-ace.png',
    caption: 'Jupiter Ace Forth input line.',
    capture: {
      package: 'emu198x-jupiter-ace',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/jupiter-ace/ace.rom`],
    },
  },
  {
    id: 'acorn-atom',
    name: 'Acorn Atom',
    group: 'Extended',
    href: '/docs/systems/acorn/atom/',
    image: '/media/boot/acorn-atom.png',
    caption: 'Acorn Atom prompt.',
    capture: {
      package: 'emu198x-acorn-atom',
      args: ['--rom', `${romRoot}/acorn-atom/atom.rom`, '--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/acorn-atom/atom.rom`],
    },
  },
  {
    id: 'zx81',
    name: 'ZX81',
    group: 'Extended',
    href: '/docs/systems/sinclair/zx81/',
    image: '/media/boot/zx81.png',
    caption: 'ZX81 boot screen.',
    capture: {
      package: 'emu198x-sinclair-zx81',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/sinclair-zx81/zx81.rom`],
    },
  },
  {
    id: 'zx80',
    name: 'ZX80',
    group: 'Extended',
    href: '/docs/systems/sinclair/zx80/',
    image: '/media/boot/zx80.png',
    caption: 'ZX80 FAST-mode boot display.',
    capture: {
      package: 'emu198x-sinclair-zx80',
      args: ['--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/sinclair-zx80/zx80.rom`],
    },
  },
  {
    id: 'mattel-aquarius',
    name: 'Mattel Aquarius',
    group: 'Extended',
    href: '/docs/systems/mattel/aquarius/',
    image: '/media/boot/mattel-aquarius.png',
    caption: 'Aquarius BASIC start prompt.',
    capture: {
      package: 'emu198x-mattel-aquarius',
      args: [
        '--bios',
        `${romRoot}/mattel-aquarius/aquarius.rom`,
        '--char',
        `${romRoot}/mattel-aquarius/aquarius-char.rom`,
        '--frames',
        '300',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [
        `${romRoot}/mattel-aquarius/aquarius.rom`,
        `${romRoot}/mattel-aquarius/aquarius-char.rom`,
      ],
    },
  },
  {
    id: 'acorn-bbc-micro',
    name: 'Acorn BBC Micro',
    group: 'Extended',
    href: '/docs/systems/acorn/bbc-micro/',
    image: '/media/boot/acorn-bbc-micro.png',
    caption: 'BBC Micro MODE 7 boot banner.',
    capture: {
      package: 'emu198x-acorn-bbc-micro',
      args: [
        '--mos',
        `${romRoot}/acorn-bbc-micro/os.rom`,
        '--sideways',
        `15=${romRoot}/acorn-bbc-micro/basic.rom`,
        '--frames',
        '300',
        '--screenshot',
        '{output}',
      ],
      requiredFiles: [
        `${romRoot}/acorn-bbc-micro/os.rom`,
        `${romRoot}/acorn-bbc-micro/basic.rom`,
        `${romRoot}/acorn-bbc-micro/saa5050.rom`,
      ],
    },
  },
];

export function bootScreenshotById(id) {
  return captureTargets().find((target) => target.id === id);
}

export function bootScreenshotTargets() {
  return captureTargets();
}

export function captureTargets() {
  return bootScreenshots.flatMap((system) => [
    normalizeCaptureTarget(system),
    ...(system.variants ?? []).map((variant) => normalizeCaptureTarget(variant, system)),
  ]);
}

function normalizeCaptureTarget(target, parent) {
  const kind = target.kind ?? 'boot';
  const rightsNote = target.rightsNote ?? defaultRightsNote;
  return {
    ...target,
    kind,
    title: target.title ?? `${target.name} ${captureKindLabels[kind]?.toLowerCase() ?? 'capture'}`,
    group: target.group ?? parent?.group,
    href: target.href ?? parent?.href,
    systemId: parent?.id ?? target.systemId ?? target.id,
    systemName: parent?.name ?? target.systemName ?? target.name,
    variantId: parent ? target.id : target.variantId,
    variantName: parent ? target.name : target.variantName,
    parentId: parent?.id,
    parentName: parent?.name,
    rightsNote,
    provenance: {
      intent: target.intent ?? target.caption,
      source: target.source ?? captureSource(target),
      runner: target.capture.package,
      output: target.image,
      rightsNote,
    },
  };
}

function captureSource(target) {
  const requiredFiles = target.capture.requiredFiles?.length ?? 0;

  if (target.capture.mediaEnv) {
    const mediaSource = `${target.capture.mediaLabel ?? 'Local media'} via ${target.capture.mediaEnv}`;
    return requiredFiles > 0
      ? `${mediaSource}; local firmware or ROM files (${requiredFiles})`
      : mediaSource;
  }

  if (requiredFiles > 0) {
    return `Local firmware or ROM files (${requiredFiles})`;
  }

  return 'No external media recorded';
}
