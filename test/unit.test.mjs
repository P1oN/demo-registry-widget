import test from 'node:test';
import assert from 'node:assert/strict';
import initFull, {
  parseRegistryTSV,
  renderFullListHtml,
  sanitizeHttpUrl,
} from '../dist/full.min.js';
import initMicro, { renderMicroLinksHtml } from '../dist/micro.min.js';

function createMockElement() {
  const classes = new Set();
  return {
    textContent: '',
    innerHTML: '',
    attributes: {},
    classList: {
      add(...tokens) {
        for (const token of tokens) classes.add(String(token));
      },
      contains(token) {
        return classes.has(String(token));
      },
    },
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

function installDom(href = 'https://p1on.github.io/cv/') {
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
    location: { href },
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

  return { button, popover, content };
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
  const { content, button, popover } = installDom();
  assert.doesNotThrow(() => initFull());
  assert.ok(content.innerHTML.includes('Configure baseUrl to load demos.'));
  assert.equal(button.classList.contains('drw-button'), true);
  assert.equal(popover.classList.contains('drw-popover'), true);
  assert.equal(content.classList.contains('drw-content'), true);
});

test('initMicro works without options and shows baseUrl configuration hint', () => {
  const { content, button, popover } = installDom();
  assert.doesNotThrow(() => initMicro());
  assert.equal(content.textContent, 'Configure baseUrl to load demos.');
  assert.equal(button.classList.contains('drw-button'), true);
  assert.equal(popover.classList.contains('drw-popover'), true);
  assert.equal(content.classList.contains('drw-content'), true);
});

const registryRows = [
  ['home', 'Portfolio', 'https://p1on.github.io/'],
  ['cv', 'CV', 'https://p1on.github.io/cv/'],
  ['todo', 'Todo', 'https://p1on.github.io/todolist/'],
  ['other', 'Other', 'https://other.example/cv/'],
];
async function renderWith(init, href, options = {}, rows = registryRows) {
  const dom = installDom(href);
  globalThis.fetch = async () => ({ ok: true, text: async () => rows.map(r => r.join('\t')).join('\n') });
  init({baseUrl: 'https://p1on.github.io/demo-registry/', ...options});
  await new Promise(resolve => setImmediate(resolve));
  return dom;
}
for (const [name, init] of [['full', initFull], ['micro', initMicro]]) {
  test(`${name}: current site is removed before limit; registry input stays intact`, async () => {
    const {content} = await renderWith(init, 'https://p1on.github.io/?q=1#contact', {limit: 1});
    assert.ok(content.innerHTML.includes('>CV</a>'));
    assert.ok(!content.innerHTML.includes('>Portfolio</a>'));
    assert.equal(registryRows.length, 4);
  });
  test(`${name}: nested paths, trailing slashes, origin and segment boundaries`, async () => {
    for (const url of ['https://p1on.github.io/cv', 'https://p1on.github.io/cv/?x=1#skills', 'https://p1on.github.io/cv/details/']) {
      const {content} = await renderWith(init, url);
      assert.ok(!content.innerHTML.includes('>CV</a>'));
      assert.ok(content.innerHTML.includes('>Portfolio</a>'));
      assert.ok(content.innerHTML.includes('>Other</a>'));
    }
    const {content} = await renderWith(init, 'https://p1on.github.io/cv-other/');
    assert.ok(content.innerHTML.includes('>CV</a>'));
  });
  test(`${name}: opt-out keeps self link; empty selection hides and closes control`, async () => {
    const {content,button} = await renderWith(init, 'https://p1on.github.io/cv/', {hideCurrentSite:false});
    assert.ok(content.innerHTML.includes('>CV</a>'));
    assert.equal(button.hidden,false);
    const empty = await renderWith(init,'https://p1on.github.io/cv/',{},[registryRows[1]]);
    assert.equal(empty.button.hidden,true);
    assert.equal(empty.button.getAttribute('aria-expanded'),'false');
    assert.equal(empty.popover.getAttribute('data-open'),null);
  });
}
