import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const romRoot = '~/.emu198x/roms';

export const captureKindLabels = {
  boot: 'Boot',
  basic: 'BASIC',
  software: 'Software',
};

// A record here is an intended capture, not evidence one happened — eight of
// them are mediaEnv-gated on local ROMs/disks the visitor does not have, and
// have no image file. hasImage is computed once, here, in the normalizer
// every capture record passes through (top-level and each variant alike),
// so no page can render an <img>, count a capture, or print a rights note
// for a capture that never ran.
// Only a real path under public/ can name a published capture, so anything
// else fails here rather than being answered as a capture state.
//
// Probed directly, three shapes got an answer they had not earned: image: ''
// made existsSync test public/ itself, so hasImage came back true, a rights
// note printed over a capture that never ran, and <img src=""> resolved to the
// page's own URL; '/../README.md' escaped public/ and did the same; '   ' was
// false only because no file happens to be called that. None is reachable from
// a current record — which is the point of closing them now, while nothing
// depends on the old answers.
function publicImagePath(id, image) {
  if (typeof image !== 'string' || image.trim() === '') {
    throw new Error(`boot-screenshots: ${id} has no image path`);
  }
  const publicRoot = resolve(process.cwd(), 'public');
  const path = resolve(publicRoot, image.replace(/^\/+/, ''));
  if (path !== publicRoot && !path.startsWith(publicRoot + sep)) {
    throw new Error(`boot-screenshots: ${id} image ${image} resolves outside public/`);
  }
  if (path === publicRoot) {
    throw new Error(`boot-screenshots: ${id} image ${image} names public/ itself, not a file`);
  }
  return path;
}

const defaultRightsNote = 'Captured from locally supplied firmware or media. Emu198x does not distribute ROMs, disks, tapes, or cartridges.';

const spectrumVariant = (id, name, machine, requiredFiles, maxFrames = 300, caption = `${name} firmware boot capture.`) => ({
  id,
  machineId: 'sinclair-zx-spectrum',
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
];

const amigaVariant = (id, name, model, kickstart) => ({
  id,
  machineId: 'commodore-amiga',
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
    machineId: 'commodore-amiga',
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
    id: 'atari-520st-pal',
    machineId: 'atari-520st-pal',
    name: 'Atari 520ST (PAL)',
    kind: 'boot',
    title: 'Atari 520ST (PAL) EmuTOS desktop',
    group: 'Extended',
    image: '/media/boot/atari-520st-pal.png',
    caption: 'Atari 520ST (PAL) running the EmuTOS 1.3 desktop on a colour monitor.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-atari-st',
      mediaEnv: 'EMU198X_EMUTOS_ROM',
      mediaLabel: 'EmuTOS 1.3 US 192 KB image',
      args: ['--model', '520st-pal', '--tos', '{media}', '--frames', '600', '--screenshot', '{output}'],
    },
  },
  {
    id: 'atari-520st-ntsc',
    machineId: 'atari-520st-ntsc',
    name: 'Atari 520ST (NTSC)',
    kind: 'boot',
    title: 'Atari 520ST (NTSC) EmuTOS desktop',
    group: 'Extended',
    image: '/media/boot/atari-520st-ntsc.png',
    caption: 'Atari 520ST (NTSC) running the EmuTOS 1.3 desktop on a colour monitor.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-atari-st',
      mediaEnv: 'EMU198X_EMUTOS_ROM',
      mediaLabel: 'EmuTOS 1.3 US 192 KB image',
      args: ['--model', '520st-ntsc', '--tos', '{media}', '--frames', '600', '--screenshot', '{output}'],
    },
  },
  {
    id: 'atari-1040st-pal',
    machineId: 'atari-1040st-pal',
    name: 'Atari 1040ST (PAL)',
    kind: 'boot',
    title: 'Atari 1040ST (PAL) EmuTOS desktop',
    group: 'Extended',
    image: '/media/boot/atari-1040st-pal.png',
    caption: 'Atari 1040ST (PAL) running the EmuTOS 1.3 desktop on a colour monitor.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-atari-st',
      mediaEnv: 'EMU198X_EMUTOS_ROM',
      mediaLabel: 'EmuTOS 1.3 US 192 KB image',
      args: ['--model', '1040st-pal', '--tos', '{media}', '--frames', '600', '--screenshot', '{output}'],
    },
  },
  {
    id: 'atari-1040st-ntsc',
    machineId: 'atari-1040st-ntsc',
    name: 'Atari 1040ST (NTSC)',
    kind: 'boot',
    title: 'Atari 1040ST (NTSC) EmuTOS desktop',
    group: 'Extended',
    image: '/media/boot/atari-1040st-ntsc.png',
    caption: 'Atari 1040ST (NTSC) running the EmuTOS 1.3 desktop on a colour monitor.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-atari-st',
      mediaEnv: 'EMU198X_EMUTOS_ROM',
      mediaLabel: 'EmuTOS 1.3 US 192 KB image',
      args: ['--model', '1040st-ntsc', '--tos', '{media}', '--frames', '600', '--screenshot', '{output}'],
    },
  },
  {
    id: 'zx-spectrum',
    machineId: 'sinclair-zx-spectrum',
    name: 'ZX Spectrum',
    kind: 'boot',
    title: 'ZX Spectrum 48K boot',
    group: 'Primary',
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
    id: 'commodore-c64-pal-breadbin', machineId: 'commodore-c64-pal-breadbin', name: 'Commodore 64 (PAL Breadbin)', kind: 'boot',
    title: 'Commodore 64 (PAL Breadbin) boot', group: 'Primary',
    image: '/media/boot/commodore-c64-pal-breadbin.png',
    caption: 'Commodore 64 (PAL Breadbin) BASIC V2 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      args: ['--headless', '--model', 'pal', '--rom-dir', `${romRoot}/commodore-c64`, '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/commodore-c64/kernal.rom`, `${romRoot}/commodore-c64/basic.rom`, `${romRoot}/commodore-c64/chargen.rom`],
    },
  },
  {
    id: 'commodore-c64-ntsc-breadbin', machineId: 'commodore-c64-ntsc-breadbin', name: 'Commodore 64 (NTSC Breadbin)', kind: 'boot',
    title: 'Commodore 64 (NTSC Breadbin) boot', group: 'Extended',
    image: '/media/boot/commodore-c64-ntsc-breadbin.png',
    caption: 'Commodore 64 (NTSC Breadbin) BASIC V2 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      args: ['--headless', '--model', 'ntsc', '--rom-dir', `${romRoot}/commodore-c64`, '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/commodore-c64/kernal.rom`, `${romRoot}/commodore-c64/basic.rom`, `${romRoot}/commodore-c64/chargen.rom`],
    },
  },
  {
    id: 'commodore-c64c-pal', machineId: 'commodore-c64c-pal', name: 'Commodore 64C (PAL)', kind: 'boot',
    title: 'Commodore 64C (PAL) boot', group: 'Extended',
    image: '/media/boot/commodore-c64c-pal.png',
    caption: 'Commodore 64C (PAL) BASIC V2 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      args: ['--headless', '--model', 'c64c-pal', '--rom-dir', `${romRoot}/commodore-c64`, '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/commodore-c64/kernal.rom`, `${romRoot}/commodore-c64/basic.rom`, `${romRoot}/commodore-c64/chargen.rom`],
    },
  },
  {
    id: 'commodore-c64c-ntsc', machineId: 'commodore-c64c-ntsc', name: 'Commodore 64C (NTSC)', kind: 'boot',
    title: 'Commodore 64C (NTSC) boot', group: 'Extended',
    image: '/media/boot/commodore-c64c-ntsc.png',
    caption: 'Commodore 64C (NTSC) BASIC V2 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      args: ['--headless', '--model', 'c64c-ntsc', '--rom-dir', `${romRoot}/commodore-c64`, '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/commodore-c64/kernal.rom`, `${romRoot}/commodore-c64/basic.rom`, `${romRoot}/commodore-c64/chargen.rom`],
    },
  },
  {
    id: 'commodore-c128-pal', machineId: 'commodore-c128-pal', name: 'Commodore 128 (PAL)', kind: 'boot',
    title: 'Commodore 128 (PAL) boot', group: 'Extended',
    image: '/media/boot/commodore-c128-pal.png',
    caption: 'Commodore 128 (PAL) BASIC 7.0 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      mediaEnv: 'EMU198X_C128_ROM_DIR', mediaLabel: 'C128 KERNAL, BASIC and character ROM directory',
      args: ['--headless', '--model', 'c128-pal', '--rom-dir', '{media}', '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [],
    },
  },
  {
    id: 'commodore-c128-ntsc', machineId: 'commodore-c128-ntsc', name: 'Commodore 128 (NTSC)', kind: 'boot',
    title: 'Commodore 128 (NTSC) boot', group: 'Extended',
    image: '/media/boot/commodore-c128-ntsc.png',
    caption: 'Commodore 128 (NTSC) BASIC 7.0 READY prompt after its ROM boot sequence.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-c64',
      mediaEnv: 'EMU198X_C128_ROM_DIR', mediaLabel: 'C128 KERNAL, BASIC and character ROM directory',
      args: ['--headless', '--model', 'c128-ntsc', '--rom-dir', '{media}', '--frames', '200', '--screenshot', '{output}'],
      requiredFiles: [],
    },
  },
  {
    id: 'nes',
    machineId: 'nintendo-nes-ntsc',
    name: 'Nintendo NES (NTSC)',
    kind: 'boot',
    title: 'Nintendo NES NTSC cartridge boot',
    group: 'Primary',
    image: '/media/boot/nes.png',
    caption: 'Synthetic plate cartridge: the Emu198x wordmark, set in this machine\'s own tiles and drawn through its real video path.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-nes',
      args: [
        '--model', 'nintendo-nes-ntsc',
        '--rom', '{source}/test-data/synthetic-cartridges/nintendo-nes-logo.nes',
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/synthetic-cartridges/nintendo-nes-logo.nes'],
    },
  },
  {
    id: 'commodore-amiga',
    machineId: 'commodore-amiga',
    name: 'Commodore Amiga',
    kind: 'boot',
    title: 'Commodore Amiga boot',
    group: 'Primary',
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
    machineId: 'nintendo-game-boy',
    name: 'Nintendo Game Boy',
    group: 'Primary',
    image: '/media/boot/game-boy.png',
    caption: 'Synthetic plate cartridge: the Emu198x wordmark, set in this machine\'s own tiles and drawn through its real video path.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-game-boy',
      args: [
        '--rom', '{source}/test-data/synthetic-cartridges/nintendo-game-boy-logo.gb',
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/synthetic-cartridges/nintendo-game-boy-logo.gb'],
    },
  },
  {
    id: 'dragon-32',
    machineId: 'dragon',
    name: 'Dragon 32',
    group: 'Primary',
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
    machineId: 'atari-800xl',
    name: 'Atari 800XL',
    group: 'Extended',
    image: '/media/boot/atari-800xl.png',
    caption: 'Atari BASIC READY prompt on the NTSC 800XL.',
    capture: {
      package: 'emu198x-atari-800xl',
      args: ['--model', 'atari-800xl-ntsc',
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
    id: 'sony-hb-f1',
    machineId: 'sony-hb-f1',
    name: 'Sony HB-F1',
    group: 'Extended',
    image: '/media/boot/sony-hb-f1.png',
    caption: 'Sony HB-F1 original firmware at the MSX BASIC 2.0 prompt.',
    capture: {
      package: 'emu198x-msx',
      args: ['--model', 'sony-hb-f1', '--bios', `${romRoot}/microsoft-msx/hb-f1_basic-bios2.rom`, '--sub-rom', `${romRoot}/microsoft-msx/hb-f1_msx2sub.rom`, '--frames', '400', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/microsoft-msx/hb-f1_basic-bios2.rom`, `${romRoot}/microsoft-msx/hb-f1_msx2sub.rom`],
    },
  },
  {
    id: 'sega-master-system',
    machineId: 'sega-master-system',
    name: 'Sega Master System',
    group: 'Extended',
    image: '/media/boot/sega-master-system.png',
    caption: 'Synthetic boot cartridge: a known colour written through CRAM and the VDP registers.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-sega-master-system',
      args: [
        '--cart', '{source}/test-data/sega/synthetic-cart/master-system.sms',
        '--frames', '120',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/sega/synthetic-cart/master-system.sms'],
    },
  },
  {
    id: 'sord-m5',
    machineId: 'sord-m5-ntsc',
    name: 'Sord M5',
    group: 'Extended',
    image: '/media/boot/sord-m5.png',
    caption: 'Cartridge title capture. Set EMU198X_BOOT_SORD_M5_CART to publish this image.',
    capture: {
      package: 'emu198x-sord-m5',
      args: ['--model', 'sord-m5-ntsc', '--cart', '{media}', '--frames', '1000', '--screenshot', '{output}'],
      mediaEnv: 'EMU198X_BOOT_SORD_M5_CART',
      mediaLabel: 'Sord M5 cartridge',
      requiredFiles: [`${romRoot}/sord-m5/sord-m5.rom`],
    },
  },
  {
    id: 'tatung-einstein',
    machineId: 'tatung-einstein',
    name: 'Tatung Einstein',
    group: 'Extended',
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
    machineId: 'commodore-vic-20-ntsc',
    name: 'Commodore VIC-20',
    group: 'Extended',
    image: '/media/boot/commodore-vic-20.png',
    caption: 'VIC-20 BASIC READY prompt.',
    capture: {
      package: 'emu198x-commodore-vic-20',
      args: ['--model', 'commodore-vic-20-ntsc', '--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [
        `${romRoot}/commodore-vic-20/kernal.rom`,
        `${romRoot}/commodore-vic-20/basic.rom`,
        `${romRoot}/commodore-vic-20/char.rom`,
      ],
    },
  },
  ...[
    ['commodore-pet-2001n-32k', 'commodore-pet-2001n-32k', 'Commodore PET 2001N / 3032 (32K)', 'BASIC 2 READY prompt on the discrete-video board.'],
    ['commodore-pet-4032', 'commodore-pet-40col', 'Commodore PET 4032', 'BASIC 4 READY prompt with the 50 Hz graphics-keyboard editor.'],
    ['commodore-pet-8032', 'commodore-pet-80col', 'Commodore PET 8032', 'BASIC 4 READY prompt with the 50 Hz business-keyboard editor and 250-line text area.'],
  ].map(([id, profile, name, caption]) => ({
    id, machineId: id, name, group: 'Extended', image: `/media/boot/${id}.png`, caption,
    capture: {
      package: 'emu198x-commodore-pet',
      mediaEnv: 'EMU198X_PET_ROM_DIR', mediaLabel: 'Matching PET BASIC, KERNAL, editor and character ROM directory',
      args: ['--headless', '--model', profile, '--rom-dir', '{media}', '--frames', '120', '--screenshot', '{output}'],
      requiredFiles: [],
    },
  })),
  {
    id: 'acorn-electron',
    machineId: 'acorn-electron',
    name: 'Acorn Electron',
    group: 'Extended',
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
    machineId: 'oric',
    name: 'Oric Atmos',
    group: 'Extended',
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
    machineId: 'memotech-mtx',
    name: 'Memotech MTX',
    group: 'Extended',
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
    machineId: 'spectravideo-svi-328-ntsc',
    name: 'Spectravideo SVI-328',
    group: 'Extended',
    image: '/media/boot/spectravideo-svi-328.png',
    caption: 'SV-BASIC settled boot screen.',
    capture: {
      package: 'emu198x-spectravideo-svi-328',
      args: ['--model', 'spectravideo-svi-328-ntsc', '--frames', '900', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/spectravideo-svi-328/svi-328.rom`],
    },
  },
  {
    id: 'colecovision',
    machineId: 'coleco-colecovision-ntsc',
    name: 'ColecoVision',
    group: 'Extended',
    image: '/media/boot/colecovision.png',
    caption: 'ColecoVision BIOS splash.',
    capture: {
      package: 'emu198x-colecovision',
      args: ['--model', 'coleco-colecovision-ntsc', '--bios', `${romRoot}/coleco-colecovision/colecovision.rom`, '--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/coleco-colecovision/colecovision.rom`],
    },
  },
  {
    id: 'sega-sg-1000',
    machineId: 'sega-sg-1000',
    name: 'Sega SG-1000',
    group: 'Extended',
    image: '/media/boot/sega-sg-1000.png',
    caption: 'Synthetic boot cartridge: a known colour written through CRAM and the VDP registers.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-sega-sg-1000',
      args: [
        '--cart', '{source}/test-data/sega/synthetic-cart/sg-1000.sg',
        '--frames', '120',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/sega/synthetic-cart/sg-1000.sg'],
    },
  },
  {
    id: 'sega-game-gear',
    machineId: 'sega-game-gear',
    name: 'Sega Game Gear',
    kind: 'boot',
    title: 'Game Gear boot',
    group: 'Extended',
    image: '/media/boot/sega-game-gear.png',
    caption: 'Synthetic boot cartridge: a known colour written through CRAM and the VDP registers. The Game Gear has no firmware to boot into, so a cartridge is the only way to show it running at all.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-sega-game-gear',
      args: [
        '--cart', '{source}/test-data/sega/synthetic-cart/game-gear.gg',
        '--frames', '120',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/sega/synthetic-cart/game-gear.gg'],
    },
  },
  {
    id: 'atari-2600',
    machineId: 'atari-2600',
    name: 'Atari 2600',
    group: 'Extended',
    image: '/media/boot/atari-2600.png',
    caption: 'Synthetic plate cartridge: the Emu198x wordmark, set in this machine\'s own tiles and drawn through its real video path.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-atari-2600',
      args: ['--model', 'atari-2600-ntsc',
        '--cart', '{source}/test-data/synthetic-cartridges/atari-2600-logo.bin',
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/synthetic-cartridges/atari-2600-logo.bin'],
    },
  },
  {
    id: 'atari-5200',
    machineId: 'atari-5200',
    name: 'Atari 5200',
    group: 'Extended',
    image: '/media/boot/atari-5200.png',
    caption: 'Synthetic plate cartridge: the Emu198x wordmark, set in this machine\'s own tiles and drawn through its real video path.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-atari-5200',
      args: [
        '--cart', '{source}/test-data/synthetic-cartridges/atari-5200-logo.bin',
        '--frames', '320',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/synthetic-cartridges/atari-5200-logo.bin'],
    },
  },
  {
    id: 'atari-7800',
    machineId: 'atari-7800',
    name: 'Atari 7800',
    group: 'Extended',
    image: '/media/boot/atari-7800.png',
    caption: 'Synthetic plate cartridge: the Emu198x wordmark, set in this machine\'s own tiles and drawn through its real video path.',
    rightsNote: 'Captured from a synthetic cartridge built from source in this project. No third-party software is involved.',
    capture: {
      package: 'emu198x-atari-7800',
      args: ['--model', 'atari-7800-ntsc',
        '--cart', '{source}/test-data/synthetic-cartridges/atari-7800-logo.bin',
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: ['{source}/test-data/synthetic-cartridges/atari-7800-logo.bin'],
    },
  },
  {
    id: 'jupiter-ace',
    machineId: 'jupiter-ace',
    name: 'Jupiter Ace',
    group: 'Extended',
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
    machineId: 'acorn-atom',
    name: 'Acorn Atom',
    group: 'Extended',
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
    machineId: 'sinclair-zx81',
    name: 'ZX81',
    group: 'Extended',
    image: '/media/boot/zx81.png',
    caption: 'ZX81 boot screen.',
    capture: {
      package: 'emu198x-sinclair-zx81',
      args: ['--model', 'sinclair-zx81','--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/sinclair-zx81/zx81.rom`],
    },
  },
  {
    id: 'zx80',
    machineId: 'sinclair-zx80',
    name: 'ZX80',
    group: 'Extended',
    image: '/media/boot/zx80.png',
    caption: 'ZX80 FAST-mode boot display.',
    capture: {
      package: 'emu198x-sinclair-zx80',
      args: ['--model', 'sinclair-zx80','--frames', '300', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/sinclair-zx80/zx80.rom`],
    },
  },
  {
    id: 'mattel-aquarius',
    machineId: 'mattel-aquarius',
    name: 'Mattel Aquarius',
    group: 'Extended',
    image: '/media/boot/mattel-aquarius.png',
    caption: 'Aquarius BASIC start prompt.',
    capture: {
      package: 'emu198x-mattel-aquarius',
      args: [
        '--model', 'mattel-aquarius',
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
    id: 'amstrad-cpc464',
    machineId: 'amstrad-cpc464',
    name: 'Amstrad CPC464',
    kind: 'boot',
    title: 'Amstrad CPC464 boot',
    group: 'Extended',
    image: '/media/boot/amstrad-cpc.png',
    caption: 'CPC464 firmware boot capture.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-amstrad-cpc',
      args: [
        '--model', 'amstrad-cpc464',
        '--rom', `amstrad-cpc464-firmware=${romRoot}/amstrad-cpc/cpc464.rom`,
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: [`${romRoot}/amstrad-cpc/cpc464.rom`],
    },
  },
  {
    id: 'amstrad-cpc664',
    machineId: 'amstrad-cpc664',
    name: 'Amstrad CPC664',
    kind: 'boot',
    title: 'Amstrad CPC664 boot',
    group: 'Extended',
    image: '/media/boot/amstrad-cpc664.png',
    caption: 'CPC664 firmware boot capture.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-amstrad-cpc',
      args: [
        '--model', 'amstrad-cpc664',
        '--rom', `amstrad-cpc664-firmware=${romRoot}/amstrad-cpc/cpc664.rom`,
        '--rom', `amstrad-cpc-amsdos=${romRoot}/amstrad-cpc/cpcados.rom`,
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: [`${romRoot}/amstrad-cpc/cpc664.rom`, `${romRoot}/amstrad-cpc/cpcados.rom`],
    },
  },
  {
    id: 'amstrad-cpc6128',
    machineId: 'amstrad-cpc6128',
    name: 'Amstrad CPC6128',
    kind: 'boot',
    title: 'Amstrad CPC6128 boot',
    group: 'Extended',
    image: '/media/boot/amstrad-cpc6128.png',
    caption: 'CPC6128 firmware boot capture.',
    rightsNote: defaultRightsNote,
    capture: {
      package: 'emu198x-amstrad-cpc',
      args: [
        '--model', 'amstrad-cpc6128',
        '--rom', `amstrad-cpc6128-firmware=${romRoot}/amstrad-cpc/cpc6128.rom`,
        '--rom', `amstrad-cpc-amsdos=${romRoot}/amstrad-cpc/cpcados.rom`,
        '--frames', '300',
        '--screenshot', '{output}',
      ],
      requiredFiles: [`${romRoot}/amstrad-cpc/cpc6128.rom`, `${romRoot}/amstrad-cpc/cpcados.rom`],
    },
  },
  {
    id: 'acorn-bbc-micro',
    machineId: 'acorn-bbc-micro',
    name: 'Acorn BBC Micro',
    group: 'Extended',
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

// Software captures — real commercial and demoscene releases, loaded from the
// local library, one per machine.
//
// These are governed by 198x/decisions/capturing-published-software.md, which
// is stricter than the firmware captures above and imposes three conditions
// this file has to hold up. Acknowledgement: every capture names title,
// publisher, year and platform. Provenance: it records which dump it came
// from, because a title string carries no medium and no version. And
// proportionality: the frame is evidence for a stated claim about the
// emulator's media path, not an illustration of the game.
//
// `work` and `dump` are what discharge the first two, and requireAcknowledgement
// below refuses to build without them — the policy is enforced by the shape of
// the data rather than by whoever adds the next record remembering to.
//
// One per machine is not a style choice either: fleet.js rejects a second
// capture of the same kind for the same machine, so the policy's one-frame
// limit is structural.
const softwareCapture = ({ machineId, work, dump, claim, capture }) => ({
  id: `${machineId}-software`,
  machineId,
  name: work.title,
  kind: 'software',
  title: `${work.title} on ${machineId}`,
  image: `/media/software/${machineId}.png`,
  caption: claim,
  work,
  dump,
  // The standing footer notice is the site-wide statement; this is the
  // per-image acknowledgement the decision requires alongside it.
  rightsNote: `${work.title} © ${work.year} ${work.publisher}. Captured by us from a locally held ${dump.format}; Emu198x does not distribute it.`,
  capture,
});

export const softwareCaptures = [
  softwareCapture({
    machineId: 'sinclair-zx-spectrum',
    work: { title: 'Knight Lore', publisher: 'Ultimate Play The Game', year: 1984 },
    dump: { file: 'Knight Lore (1984)(Ultimate Play The Game).tap', format: 'TAP tape image', catalogue: 'TOSEC' },
    claim: 'The tape path loads a real commercial TAP and runs on to the game\u2019s own menu \u2014 Filmation\u2019s title screen, drawn by the game rather than the ROM.',
    capture: {
      package: 'emu198x-spectrum',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_SPECTRUM_TAPE',
      mediaLabel: 'Knight Lore TAP',
      script: [
        { action: 'load_media', slot: 'tape-1', kind: 'tape', path: '{media}' },
        { action: 'autoload_tape', slot: 'tape-1', max_boot_frames: 400 },
        { action: 'run_frames', frames: 24000 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [`${romRoot}/sinclair-zx-spectrum-48k/48.rom`],
    },
  }),
  {...softwareCapture({
    machineId: 'commodore-c64',
    work: { title: 'Wizball', publisher: 'Ocean', year: 1987 },
    dump: { file: 'Wizball (1987)(Ocean).d64', format: 'D64 disk image', catalogue: 'TOSEC' },
    claim: 'A real 1541 load, timed by the drive motor rather than a fixed frame count, reaches Wizball\u2019s player-select screen.',
    capture: {
      package: 'emu198x-c64',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_C64_DISK',
      mediaLabel: 'Wizball D64',
      args: ['--headless', '--model', 'pal', '--disk', '{media}', '--autoload-disk', '--script', '{script}'],
      script: [
        { action: 'wait_for_query_bool', query: 'drive8.motor_on', value: true, timeout_frames: 2000 },
        { action: 'wait_for_query_bool', query: 'drive8.motor_on', value: false, timeout_frames: 15000 },
        { action: 'type_string', text: 'RUN\n' },
        { action: 'run_frames', frames: 3000 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [],
    },  }), machineId: 'commodore-c64-pal-breadbin'},
  softwareCapture({
    machineId: 'acorn-electron',
    work: { title: 'Repton 2', publisher: 'Superior Software', year: 1985 },
    dump: { file: 'Repton 2 (1985)(Superior Software).uef', format: 'UEF tape image', catalogue: 'TOSEC' },
    claim: 'The Electron\u2019s tape deck free-runs once inserted, with no transport step, and reaches Repton 2 playing its own attract mode.',
    capture: {
      package: 'emu198x-acorn-electron',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_ELECTRON_TAPE',
      mediaLabel: 'Repton 2 UEF',
      script: [
        { action: 'load_media', slot: 'tape-1', kind: 'tape', path: '{media}' },
        { action: 'run_frames', frames: 150 },
        { action: 'type_string', text: 'CHAIN' },
        { action: 'press_keys', keys: ['shift', '2'] },
        { action: 'press_keys', keys: ['shift', '2'] },
        { action: 'press_key', key: 'return' },
        { action: 'run_frames', frames: 30000 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [],
    },
  }),
  softwareCapture({
    machineId: 'dragon',
    work: { title: 'Chuckie Egg', publisher: 'A&F Software', year: 1983 },
    dump: { file: 'Chuckie Egg (1983)(A&F Software).cas', format: 'CAS tape image', catalogue: 'TOSEC' },
    claim: 'CLOADM plus EXEC carries a machine-code tape all the way to its title screen \u2014 the load path two other Dragon tapes halt inside.',
    capture: {
      package: 'emu198x-dragon',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_DRAGON_TAPE',
      mediaLabel: 'Chuckie Egg CAS',
      script: [
        { action: 'run_frames', frames: 150 },
        { action: 'load_media', slot: 'tape-1', kind: 'tape', path: '{media}' },
        { action: 'type_string', text: 'CLOADM\n' },
        { action: 'run_frames', frames: 30000 },
        { action: 'type_string', text: 'EXEC\n' },
        { action: 'run_frames', frames: 600 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [`${romRoot}/dragon/dragon32.rom`],
    },
  }),
  softwareCapture({
    machineId: 'sinclair-zx81',
    work: { title: 'Mazogs', publisher: 'Bug-Byte Software', year: 1981 },
    dump: { file: 'MAZOGS.P', format: 'P snapshot/tape image', catalogue: 'TOSEC' },
    claim: 'A 16K title loads and runs on a machine whose default RAM is 1K \u2014 the keyboard scan needs 20-frame key holds, and the trailing RUN is what puts a picture up.',
    capture: {
      package: 'emu198x-sinclair-zx81',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_ZX81_TAPE',
      mediaLabel: 'Mazogs P',
      args: ['--ram-bytes', '16384', '--script', '{script}'],
      script: [
        { action: 'load_media', slot: 'tape-1', kind: 'tape', path: '{media}' },
        { action: 'run_frames', frames: 150 },
        { action: 'press_key', key: 'J', hold_frames: 20 },
        { action: 'press_keys', keys: ['shift', 'P'], hold_frames: 20 },
        { action: 'press_keys', keys: ['shift', 'P'], hold_frames: 20 },
        { action: 'press_key', key: 'Newline', hold_frames: 20 },
        { action: 'media_transport', slot: 'tape-1', operation: 'start' },
        { action: 'run_frames', frames: 27000 },
        { action: 'press_key', key: 'R', hold_frames: 20 },
        { action: 'press_key', key: 'Newline', hold_frames: 20 },
        { action: 'run_frames', frames: 600 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [],
    },
  }),
  softwareCapture({
    machineId: 'acorn-atom',
    work: { title: 'Breakout', publisher: 'Bug Byte', year: 1981 },
    dump: { file: 'Breakout (1981)(Bug Byte)[4K].uef', format: 'UEF tape image', catalogue: 'TOSEC' },
    claim: 'The COS prints PLAY TAPE and waits for a keypress; supplying it loads the tape. This reaches the first file on the tape, which for Breakout is the program\u2019s own instructions rather than the game.',
    capture: {
      package: 'emu198x-acorn-atom',
      mode: 'script',
      mediaEnv: 'EMU198X_SOFTWARE_ATOM_TAPE',
      mediaLabel: 'Breakout UEF',
      args: ['--ram-kb', '32', '--script', '{script}'],
      script: [
        { action: 'run_frames', frames: 150 },
        { action: 'type_string', text: '*LOAD"BREAK"\n' },
        { action: 'load_media', slot: 'tape-1', kind: 'tape', path: '{media}' },
        { action: 'run_frames', frames: 300 },
        { action: 'press_key', key: 'return' },
        { action: 'run_frames', frames: 30000 },
        { action: 'type_string', text: 'RUN\n' },
        { action: 'run_frames', frames: 600 },
        { action: 'save_screenshot', path: '{output}' },
      ],
      requiredFiles: [],
    },
  }),
  softwareCapture({
    machineId: 'commodore-amiga',
    work: { title: 'State of the Art', publisher: 'Spaceballs', year: 1992 },
    dump: { file: 'State of the Art (1992-12-29)(Spaceballs)[TP2#1].adf', format: 'ADF disk image', catalogue: 'TOSEC' },
    claim: 'A bootblock demo runs from raw ADF on a 1MB A500 \u2014 the stock 512K model freezes on this opening frame, which is why the capture pins a501.',
    capture: {
      package: 'emu198x-amiga',
      mode: 'args',
      mediaEnv: 'EMU198X_SOFTWARE_AMIGA_DISK',
      mediaLabel: 'State of the Art ADF',
      args: ['--headless', '--model', 'a500-a501', '--disk', '{media}', '--frames', '5000', '--screenshot', '{output}'],
      requiredFiles: [`${romRoot}/commodore-amiga/kick13.rom`],
    },
  }),
];

export function bootScreenshotById(id) {
  return captureTargets().find((target) => target.id === id);
}

export function bootScreenshotTargets() {
  return captureTargets();
}

export function captureTargets() {
  return [
    ...bootScreenshots.flatMap((system) => [
      normalizeCaptureTarget(system),
      ...(system.variants ?? []).map((variant) => normalizeCaptureTarget(variant, system)),
    ]),
    ...softwareCaptures.map((target) => normalizeCaptureTarget(target)),
  ];
}

// The acknowledgement condition in capturing-published-software.md, made
// unskippable. A software capture reproduces somebody's copyrighted work, so
// it may not reach a page without naming the work and the dump it came from.
// Throwing here fails the build; the alternative is a page that publishes
// somebody's game with no attribution and no way to tell which dump it was.
function requireAcknowledgement(target) {
  const { work, dump } = target;
  for (const field of ['title', 'publisher', 'year']) {
    if (!work?.[field]) {
      throw new Error(`boot-screenshots: software capture ${target.id} has no work.${field}`);
    }
  }
  for (const field of ['file', 'format']) {
    if (!dump?.[field]) {
      throw new Error(`boot-screenshots: software capture ${target.id} has no dump.${field}`);
    }
  }
  // A year the catalogue did not state is the one that gets guessed. TOSEC
  // writes 19xx where it does not know, and a guess printed as a fact is worse
  // than picking a title whose year is recorded.
  if (!Number.isInteger(work.year)) {
    throw new Error(`boot-screenshots: software capture ${target.id} has a non-numeric year (${work.year})`);
  }
}

export function normalizeCaptureTarget(target, parent) {
  const kind = target.kind ?? 'boot';
  if (kind === 'software') {
    requireAcknowledgement(target);
  }
  const hasImage = existsSync(publicImagePath(target.id, target.image));
  // A rights note asserts a capture happened. Never carry one for a record
  // whose image doesn't exist — that record is an intent, not evidence.
  const rightsNote = hasImage ? (target.rightsNote ?? defaultRightsNote) : null;
  return {
    ...target,
    kind,
    hasImage,
    title: target.title ?? `${target.name} ${captureKindLabels[kind]?.toLowerCase() ?? 'capture'}`,
    group: target.group ?? parent?.group,
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
      work: target.work ?? null,
      dump: target.dump ?? null,
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
