import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The downloads page promises, in its own copy, that every one of the 120
 * archives stays in front of the reader: detection reorders and marks, and
 * never filters. The gate on that promise used to be a list of spellings —
 * `.remove()`, `removeChild`, `innerHTML`, `display: none`,
 * `setAttribute('hidden'` — and a blacklist has as many doors as the DOM has
 * ways to hide a node. `li.hidden = true` and `li.style.display = "none"`
 * both walked through it, and either one hides every archive on the page.
 *
 * So this runs the page's real detection script against a document and asks
 * the property instead: the set of reachable download links must come out
 * exactly as it went in. Any way of removing or hiding a list item fails it,
 * including ways nobody has thought of.
 *
 * One limit worth stating: this document knows nothing of CSS, so a class
 * that hides through a stylesheet would not change the count. The last check
 * covers that from the other side — every class the script adds is looked up
 * in the page's own stylesheet and must not carry a hiding declaration.
 */

// Node prints an ExperimentalWarning for stripTypeScriptTypes. The report a
// test run prints is its results; other warnings still come through.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name !== 'ExperimentalWarning') console.warn(warning);
});

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOWNLOADS = join(ROOT, 'src/pages/downloads/index.astro');
const source = readFileSync(DOWNLOADS, 'utf8');

function pageScript() {
  const open = source.indexOf('<script>');
  const close = source.indexOf('</script>', open);
  assert.ok(open !== -1 && close !== -1, 'the downloads page has no detection script');
  return source.slice(open + '<script>'.length, close);
}

function pageStyles() {
  const open = source.indexOf('<style>');
  const close = source.indexOf('</style>', open);
  return open === -1 ? '' : source.slice(open + '<style>'.length, close);
}

// --- the smallest document the script can be honest in -----------------------

// Only what the script touches, but with real semantics where it matters:
// moving a node detaches it from its old parent, hiding one hides its
// subtree, and clearing a node's content loses its children. A stub that
// merely records calls would pass every injection.
class ClassList {
  constructor(element) {
    this.element = element;
  }
  get set() {
    return new Set((this.element.attributes.get('class') ?? '').split(/\s+/).filter(Boolean));
  }
  write(set) {
    this.element.attributes.set('class', [...set].join(' '));
  }
  add(...names) {
    const set = this.set;
    for (const name of names) set.add(name);
    this.write(set);
  }
  remove(...names) {
    const set = this.set;
    for (const name of names) set.delete(name);
    this.write(set);
  }
  contains(name) {
    return this.set.has(name);
  }
  toggle(name) {
    const set = this.set;
    set.has(name) ? set.delete(name) : set.add(name);
    this.write(set);
  }
}

class Element {
  constructor(tag, attributes = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map(Object.entries(attributes));
    this.childNodes = [];
    this.parentNode = null;
    this.style = {};
    this.classList = new ClassList(this);
    this.text = '';
  }

  get dataset() {
    const element = this;
    return new Proxy(
      {},
      {
        get(_target, key) {
          if (typeof key !== 'string') return undefined;
          return element.attributes.get(`data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`);
        },
        set(_target, key, value) {
          element.attributes.set(`data-${String(key)}`, String(value));
          return true;
        },
      },
    );
  }

  get hidden() {
    return this.attributes.has('hidden');
  }
  set hidden(value) {
    if (value) this.attributes.set('hidden', '');
    else this.attributes.delete('hidden');
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }

  get textContent() {
    return this.text + this.childNodes.map((child) => child.textContent).join('');
  }
  set textContent(value) {
    this.childNodes = [];
    this.text = String(value);
  }
  set innerHTML(value) {
    // Not a parser: any assignment loses the children it replaced, which is
    // the part that matters to the count.
    this.childNodes = [];
    this.text = String(value).replace(/<[^>]*>/g, '');
  }
  set outerHTML(value) {
    this.parentNode?.removeChild(this);
  }

  detach(node) {
    const at = this.childNodes.indexOf(node);
    if (at !== -1) this.childNodes.splice(at, 1);
  }
  adopt(nodes) {
    for (const node of nodes) node.parentNode?.detach(node);
    for (const node of nodes) node.parentNode = this;
    return nodes;
  }
  append(...nodes) {
    this.childNodes.push(...this.adopt(nodes));
  }
  prepend(...nodes) {
    this.childNodes.unshift(...this.adopt(nodes));
  }
  replaceChildren(...nodes) {
    this.childNodes = this.adopt(nodes);
  }
  removeChild(node) {
    this.detach(node);
    node.parentNode = null;
    return node;
  }
  remove() {
    this.parentNode?.removeChild(this);
  }

  get children() {
    return [...this.childNodes];
  }

  descendants() {
    return this.childNodes.flatMap((child) => [child, ...child.descendants()]);
  }
  querySelectorAll(selector) {
    return this.descendants().filter((node) => matches(node, selector));
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

// Tag, .class and [attr] or [attr="value"], in any combination — the shapes
// the page's own script uses.
function matches(node, selector) {
  const parts = selector.trim().match(/^([a-z]*)((?:\.[\w-]+|\[[^\]]+\])*)$/i);
  assert.ok(parts, `the fake document cannot parse the selector ${selector}`);
  const [, tag, rest] = parts;
  if (tag && node.tagName !== tag.toUpperCase()) return false;
  for (const token of rest.match(/\.[\w-]+|\[[^\]]+\]/g) ?? []) {
    if (token.startsWith('.')) {
      if (!node.classList.contains(token.slice(1))) return false;
    } else {
      const [name, value] = token.slice(1, -1).split('=');
      if (!node.attributes.has(name)) return false;
      if (value !== undefined && node.attributes.get(name) !== value.replace(/^["']|["']$/g, '')) {
        return false;
      }
    }
  }
  return true;
}

function element(tag, attributes, children = []) {
  const node = new Element(tag, attributes);
  node.append(...children);
  return node;
}

const MACHINES = ['emu198x-spectrum', 'emu198x-c64', 'emu198x-amiga'];
const BUILDS = [
  { os: 'macos', arch: 'arm64', target: 'aarch64-apple-darwin', ext: 'tar.xz' },
  { os: 'macos', arch: 'x64', target: 'x86_64-apple-darwin', ext: 'tar.xz' },
  { os: 'windows', arch: 'x64', target: 'x86_64-pc-windows-msvc', ext: 'zip' },
  { os: 'linux', arch: 'x64', target: 'x86_64-unknown-linux-gnu', ext: 'tar.xz' },
];

function buildDocument() {
  const root = new Element('body');
  const note = element('p', { id: 'platform-note' });
  note.textContent = 'Every build for every machine is listed below.';
  root.append(note);

  for (const crate of MACHINES) {
    root.append(
      element(
        'ul',
        { 'data-builds': '' },
        BUILDS.map((build) =>
          element('li', { class: 'build', 'data-os': build.os, 'data-arch': build.arch }, [
            element('a', {
              href: `https://github.com/emu198x/emu198x/releases/download/v0.5.0/${crate}-${build.target}.${build.ext}`,
            }, [element('span', { 'data-match': '', hidden: '' })]),
          ]),
        ),
      ),
    );
  }

  const document = {
    getElementById: (id) => root.querySelector(`[id="${id}"]`),
    querySelectorAll: (selector) => root.querySelectorAll(selector),
    querySelector: (selector) => root.querySelector(selector),
    body: root,
  };
  return { document, root };
}

// A link a reader can reach: still in the tree, and no ancestor hiding it.
function reachableDownloads(root) {
  const found = [];
  const walk = (node) => {
    if (node.hidden) return;
    const display = node.style?.display ?? '';
    const visibility = node.style?.visibility ?? '';
    if (display === 'none' || visibility === 'hidden') return;
    if (node.tagName === 'A' && (node.getAttribute('href') ?? '').includes('/releases/download/')) {
      found.push(node.getAttribute('href'));
    }
    for (const child of node.childNodes) walk(child);
  };
  walk(root);
  return found;
}

async function runDetection(navigator) {
  const { document, root } = buildDocument();
  const body = stripTypeScriptTypes(pageScript(), { mode: 'strip' });
  const run = new Function('document', 'navigator', `${body}\nreturn detect().then(apply);`);
  const before = reachableDownloads(root);
  await run(document, navigator);
  return { root, before, after: reachableDownloads(root) };
}

const APPLE_SILICON = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140',
  userAgentData: {
    platform: 'macOS',
    getHighEntropyValues: async () => ({ architecture: 'arm' }),
  },
};

const WINDOWS_NO_HINTS = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 Safari/605.1.15',
};

const UNKNOWN = { userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36' };

// --- the property ------------------------------------------------------------

test('detection leaves every download link reachable — Apple silicon', async () => {
  const { before, after } = await runDetection(APPLE_SILICON);
  assert.equal(before.length, MACHINES.length * BUILDS.length);
  assert.equal(after.length, before.length, 'detection changed how many archives a reader can reach');
  assert.deepEqual([...after].sort(), [...before].sort(), 'detection changed which archives are reachable');
});

test('detection leaves every download link reachable — Windows, no client hints', async () => {
  const { before, after } = await runDetection(WINDOWS_NO_HINTS);
  assert.deepEqual([...after].sort(), [...before].sort());
});

test('detection leaves every download link reachable — platform not recognised', async () => {
  const { before, after } = await runDetection(UNKNOWN);
  assert.deepEqual(after, before, 'an unrecognised platform changed the list');
});

// Without this the property above is satisfied by a script that does nothing,
// and a harness that silently failed to run it would report a pass.
test('detection does reorder and mark, which is what it is allowed to do', async () => {
  const { root } = await runDetection(APPLE_SILICON);
  for (const list of root.querySelectorAll('[data-builds]')) {
    const [first] = list.querySelectorAll('.build');
    assert.equal(first.dataset.os, 'macos');
    assert.equal(first.dataset.arch, 'arm64');
    assert.ok(first.classList.contains('is-match'));
    assert.equal(first.querySelector('[data-match]').hidden, false, 'the match label stayed hidden');
    assert.equal(list.querySelectorAll('.build').length, BUILDS.length);
  }
});

// The document above has no CSS, so a hiding class would not move the count.
// Every class the script adds is checked against the page's own stylesheet
// instead: a rule that hides `.build` through a class is the same filter by
// another route.
test('no class the script adds hides anything in the page stylesheet', async () => {
  const { root } = await runDetection(APPLE_SILICON);
  const added = new Set();
  for (const item of root.querySelectorAll('.build')) {
    for (const name of item.classList.set) if (name !== 'build') added.add(name);
  }
  assert.ok(added.size > 0, 'the script marked nothing, so this check proved nothing');

  const styles = pageStyles();
  for (const name of added) {
    const rules = [...styles.matchAll(new RegExp(`\\.${name}\\b[^{]*\\{([^}]*)\\}`, 'g'))];
    for (const [, body] of rules) {
      assert.doesNotMatch(
        body,
        /display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden/,
        `.${name} hides the item it is added to`,
      );
    }
  }
});
