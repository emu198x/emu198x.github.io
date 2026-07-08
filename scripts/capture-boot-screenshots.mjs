#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootScreenshotTargets } from '../src/data/boot-screenshots.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(__dirname, '..');
const sourceRoot = resolve(process.env.EMU198X_SOURCE_ROOT ?? join(siteRoot, '..', 'Emu198x'));
const outputRoot = join(siteRoot, 'public', 'media', 'boot');
const tempRoot = join(siteRoot, '.tmp', 'boot-screenshot-scripts');
const bootTargets = bootScreenshotTargets();

const options = parseArgs(process.argv.slice(2));
const selected = options.only.size > 0
  ? bootTargets.filter((system) => options.only.has(system.id) || options.only.has(system.parentId))
  : bootTargets;

if (options.list) {
  for (const system of bootTargets) {
    const media = system.capture.mediaEnv ? ` media=${system.capture.mediaEnv}` : '';
    const parent = system.parentName ? ` (${system.parentName})` : '';
    console.log(`${system.id.padEnd(24)} ${system.capture.package}${media}${parent}`);
  }
  process.exit(0);
}

if (selected.length === 0) {
  console.error(`No systems matched --only=${[...options.only].join(',')}`);
  process.exit(2);
}

mkdirSync(outputRoot, { recursive: true });
mkdirSync(tempRoot, { recursive: true });

let captured = 0;
let skipped = 0;
let failed = 0;

for (const system of selected) {
  const output = join(outputRoot, `${system.id}.png`);
  const capture = system.capture;
  const missing = missingInputs(capture);
  if (missing.length > 0) {
    skipped += 1;
    console.log(`skip ${system.id}: ${missing.join('; ')}`);
    continue;
  }

  const scriptPath = capture.mode === 'script'
    ? writeScript(system, output)
    : null;
  const args = buildCargoArgs(capture, output, scriptPath);
  const commandLine = ['cargo', ...args].join(' ');

  if (options.dryRun) {
    console.log(`dry ${system.id}: ${commandLine}`);
    continue;
  }

  console.log(`capture ${system.id} -> ${relativeToSite(output)}`);
  const result = spawnSync('cargo', args, {
    cwd: sourceRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    failed += 1;
    console.error(`fail ${system.id}: exit ${result.status}`);
    writeLastLines(result.stdout, 'stdout');
    writeLastLines(result.stderr, 'stderr');
    continue;
  }

  if (!existsSync(output)) {
    failed += 1;
    console.error(`fail ${system.id}: command completed but did not write ${output}`);
    writeLastLines(result.stdout, 'stdout');
    writeLastLines(result.stderr, 'stderr');
    continue;
  }

  captured += 1;
}

console.log(`boot screenshots: ${captured} captured, ${skipped} skipped, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

function parseArgs(args) {
  const parsed = {
    dryRun: false,
    list: false,
    only: new Set(),
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--list') {
      parsed.list = true;
    } else if (arg.startsWith('--only=')) {
      for (const id of arg.slice('--only='.length).split(',')) {
        const trimmed = id.trim();
        if (trimmed) parsed.only.add(trimmed);
      }
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }
  }

  return parsed;
}

function buildCargoArgs(capture, output, scriptPath) {
  const args = ['run', '--release', '-q', '-p', capture.package, '--no-default-features', '--'];
  for (const arg of capture.args) {
    args.push(resolveToken(arg, capture, output, scriptPath));
  }
  return args;
}

function writeScript(system, output) {
  const script = system.capture.script.map((step) => replaceValues(step, output));
  const path = join(tempRoot, `${system.id}.json`);
  writeFileSync(path, `${JSON.stringify(script, null, 2)}\n`);
  return path;
}

function replaceValues(value, output) {
  if (typeof value === 'string') return value.replaceAll('{output}', output);
  if (Array.isArray(value)) return value.map((item) => replaceValues(item, output));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, replaceValues(child, output)]),
    );
  }
  return value;
}

function missingInputs(capture) {
  const missing = [];
  if (capture.mediaEnv) {
    const value = process.env[capture.mediaEnv];
    if (!value) {
      missing.push(`${capture.mediaEnv} is not set`);
    } else if (!existsSync(expandPath(value))) {
      missing.push(`${capture.mediaEnv} does not exist: ${value}`);
    }
  }

  for (const path of capture.requiredFiles ?? []) {
    const resolved = expandPath(path);
    if (!existsSync(resolved)) {
      missing.push(`missing ${path}`);
    }
  }

  return missing;
}

function resolveToken(arg, capture, output, scriptPath) {
  if (arg === '{output}') return output;
  if (arg === '{script}') return scriptPath;
  if (arg === '{media}') return expandPath(process.env[capture.mediaEnv] ?? '');
  return expandPath(arg.replaceAll('{output}', output));
}

function expandPath(path) {
  if (!path) return path;
  if (path === '~') return process.env.HOME ?? path;
  if (path.startsWith('~/')) return join(process.env.HOME ?? '~', path.slice(2));
  return path.replaceAll('=~/', `=${process.env.HOME ?? '~'}/`);
}

function writeLastLines(text, label) {
  const lines = text.trim().split('\n').filter(Boolean).slice(-20);
  if (lines.length === 0) return;
  console.error(`${label}:`);
  for (const line of lines) console.error(line);
}

function relativeToSite(path) {
  return path.startsWith(siteRoot) ? path.slice(siteRoot.length + 1) : path;
}
