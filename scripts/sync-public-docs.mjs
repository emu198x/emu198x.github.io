import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
const defaultSourceRoot = existsSync(join(siteRoot, 'docs'))
  ? siteRoot
  : join(siteRoot, '..', 'Emu198x');
const sourceRoot = resolve(process.env.EMU198X_SOURCE_ROOT ?? defaultSourceRoot);
const destRoot = join(siteRoot, 'src', 'content', 'docs');

// This used to copy five more paths — docs/systems, docs/status/current-
// system-usability.md, and three docs/features/*.md files. None of those
// have ever existed in the flagship repo; they skipped silently, which is
// how a nav pointing at nothing shipped and CI still reported success. The
// changelog is the one file this build actually depends on, so it is the
// one file left, and a missing copy now fails the build instead of hiding.
const copyFiles = [
  ['CHANGELOG.md', 'changelog.md'],
];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function copyFile(sourceRel, targetRel) {
  const source = join(sourceRoot, sourceRel);
  if (!existsSync(source)) {
    throw new Error(
      `sync-public-docs: required source file is missing: ${source} ` +
        `(set EMU198X_SOURCE_ROOT to the emu198x flagship repo checkout)`
    );
  }
  const target = join(destRoot, targetRel);
  ensureDir(dirname(target));
  copyFileSync(source, target);
  sanitizePublicMarkdown(target);
}

function sanitizePublicMarkdown(path) {
  let text = readFileSync(path, 'utf8');

  text = text
    .replace(/per \[`knowledge\/decisions\/versioning-milestones\.md`\]\([^)]*\),\n/g, '')
    .replace(/- A unified launcher \(deliberately not built[\s\S]*?\)\n(?=\n|###)/g, '')
    .replace(/- \[`RULES\.md`\]\([^)]*\) — binding architectural constraints\n/g, '')
    .replace(/- \[`knowledge\/decisions\/`\]\([^)]*\) — 30\+ binding decision\n  records covering accuracy bar, chip interfaces, ULA model, snapshot format,\n  versioning strategy, debugger architecture, and more\n/g, '')
    .replace(/- Project lives under the umbrella `198x\/` family alongside Code198x; the\n  two are sibling projects per\n  \[`..\/decisions\/sibling-project-coordination\.md`\]\([^)]*\)\.\n/g, "- Project lives in the 198x family alongside Code Like It's 198x.\n")
    .replaceAll('Code198x', "Code Like It's 198x")
    .replaceAll('October SOLID bar', 'public readiness work')
    .replaceAll('Spectrum SOLID bar met', 'Spectrum support is mature')
    .replaceAll('Spectrum SOLID engineering bar is met', 'Spectrum support is mature')
    .replaceAll('ZX Spectrum SOLID engineering bar is met', 'ZX Spectrum support is mature')
    .replaceAll('SOLID engineering bar', 'public readiness target')
    .replaceAll('SOLID bar', 'public readiness target')
    .replaceAll('SOLID criteria', 'public readiness criteria')
    .replaceAll('SOLID criterion', 'public readiness criterion')
    .replaceAll('SOLID variant', 'mainstream Spectrum variant')
    .replaceAll('SOLID variants', 'mainstream Spectrum variants')
    .replaceAll('SOLID 8', 'mainstream Spectrum variants')
    .replaceAll('engineering-bar machines', 'most mature machine families')
    .replaceAll('engineering bar machines', 'most mature machine families')
    .replaceAll('engineering bar', 'quality target')
    .replaceAll('accuracy bar', 'accuracy target')
    .replaceAll('RULES.md', 'project guidelines')
    .replaceAll('RULES §51-64', 'the project timing model')
    .replaceAll('RULES §62', 'the project timing model')
    .replaceAll('RULES §53–56', 'the project timing model')
    .replaceAll('RULES §53-56', 'the project timing model')
    .replaceAll('RULES §62?', 'project timing model?')
    .replace(/\s*\(RULES\s+§[^)]*\)/g, '')
    .replace(/\s*—\s*see RULES\s+§[^).]*(?=[).])/g, '')
    .replace(/\s*—\s*see `knowledge\/decisions\/[^`]+`/g, '')
    .replace(/\[`knowledge\/decisions\/([^`]+)`\]\([^)]*\)/g, '$1')
    .replace(/`knowledge\/decisions\/([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\((?:\.\.\/)+status\/outstanding-work\.md\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:\.\.\/)+plans\/[^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:\.\.\/)+(?:\.\.\/)*knowledge\/[^)]*\)/g, '$1')
    .replace(/\[`docs\/plans\/([^`]+)`\]\([^)]*\)/g, '$1');

  writeFileSync(path, text);
}

rmSync(destRoot, { recursive: true, force: true });
ensureDir(destRoot);

for (const [sourceRel, targetRel] of copyFiles) {
  copyFile(sourceRel, targetRel);
}
