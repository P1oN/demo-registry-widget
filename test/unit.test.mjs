import test from 'node:test';
import assert from 'node:assert/strict';
import initFull, {
  parseRegistryTSV,
  renderFullListHtml,
  sanitizeHttpUrl,
} from '../dist/full.min.js';
import initMicro, { renderMicroLinksHtml } from '../dist/micro.min.js';

function createMockElement() {
  return {
    textContent: '',
    innerHTML: '',
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener() {},
    contains() {
      return false;
    },
  };
}

function installDom() {
  const button = createMockElement();
  const popover = createMockElement();
  const content = createMockElement();

  const byId = {
    demosBtn: button,
    demosPopover: popover,
    demosContent: content,
  };

  globalThis.document = {
    getElementById(id) {
      return byId[id] || null;
    },
    addEventListener() {},
  };

  globalThis.window = {
    requestIdleCallback(cb) {
      cb();
    },
  };

  globalThis.localStorage = {
    getItem() {
      return null;
    },
    setItem() {},
  };

  return { content };
}

test('parseRegistryTSV keeps first row when header is absent', () => {
  const parsed = parseRegistryTSV('a\tA\thttps://a.example\n');
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].slug, 'a');
});

test('parseRegistryTSV handles comments, version, and header', () => {
  const text = '#v=42\n# comment\nslug\ttitle\turl\ttags\nhello\tHello\thttps://hello.example\talpha,beta\n';
  const parsed = parseRegistryTSV(text);
  assert.equal(parsed.version, '42');
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].title, 'Hello');
  assert.deepEqual(parsed.items[0].tags, ['alpha', 'beta']);
});

test('sanitizeHttpUrl accepts http/https and rejects unsafe or invalid URLs', () => {
  assert.equal(sanitizeHttpUrl('https://example.com/path?q=1'), 'https://example.com/path?q=1');
  assert.equal(sanitizeHttpUrl('http://example.com'), 'http://example.com/');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeHttpUrl('not-a-url'), null);
});

test('renderFullListHtml escapes text and drops unsafe links', () => {
  const html = renderFullListHtml([
    {
      slug: '<slug>',
      title: '<b>Title</b>',
      url: 'https://safe.example',
      tags: ['x<y', 'z&z'],
    },
    {
      slug: 'bad',
      title: 'bad',
      url: 'javascript:alert(1)',
      tags: [],
    },
  ]);

  assert.ok(html.includes('&lt;b&gt;Title&lt;/b&gt;'));
  assert.ok(html.includes('&lt;slug&gt;'));
  assert.ok(html.includes('x&lt;y, z&amp;z'));
  assert.ok(!html.includes('javascript:alert'));
});

test('renderMicroLinksHtml escapes text and drops unsafe links', () => {
  const html = renderMicroLinksHtml(
    [
      {
        slug: 'one',
        title: '<img src=x onerror=1>',
        url: 'https://one.example',
        tags: [],
      },
      {
        slug: 'two',
        title: 'Two',
        url: 'javascript:alert(1)',
        tags: [],
      },
    ],
    10,
  );

  assert.ok(html.includes('&lt;img src=x onerror=1&gt;'));
  assert.ok(!html.includes('javascript:alert'));
  assert.equal((html.match(/<a /g) || []).length, 1);
});

test('initFull works without options and shows baseUrl configuration hint', () => {
  const { content } = installDom();
  assert.doesNotThrow(() => initFull());
  assert.ok(content.innerHTML.includes('Configure baseUrl to load demos.'));
});

test('initMicro works without options and shows baseUrl configuration hint', () => {
  const { content } = installDom();
  assert.doesNotThrow(() => initMicro());
  assert.equal(content.textContent, 'Configure baseUrl to load demos.');
});
