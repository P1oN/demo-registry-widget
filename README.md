# demo-registry-widget

[![CI](https://github.com/P1oN/demo-registry-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/P1oN/demo-registry-widget/actions/workflows/ci.yml)

Ultra-light client widget for loading demo registry data from `registry.tsv` and rendering a popover list in the browser.

This is a public npm package, primarily built for internal use, but published in case it is useful to others.

## Install

```bash
npm i demo-registry-widget
```

## Environment config

Create local env file from template:

```bash
cp .env.example .env
```

Main variables in `.env.example`:
- widget integration defaults (`DEMO_REGISTRY_*`, `DEMO_WIDGET_*`)
- repo script settings (`NPM_CACHE_DIR`, `NPM_LOGS_DIR`)

`DEMO_REGISTRY_*` and `DEMO_WIDGET_*` are injected into the package at build time (`npm run build`) and become default values in generated `dist/*`.

Runtime options passed to `initWidget` / `initFull` / `initMicro` still have priority over those build-time defaults.

## Usage

### Default export (full widget)

```ts
import initWidget from "demo-registry-widget";

initWidget({
  baseUrl: "https://example.com",
});
```

### Full widget (explicit subpath)

```ts
import initFull from "demo-registry-widget/full";

initFull({
  baseUrl: "https://example.com",
  sort: "title",
  limit: 20,
});
```

### Micro widget (explicit subpath)

```ts
import initMicro from "demo-registry-widget/micro";

initMicro({
  baseUrl: "https://example.com",
  limit: 8,
});
```

## HTML requirements

Both widget variants expect these elements to exist in the page:

```html
<button id="demosBtn" aria-expanded="false">Demos</button>
<div id="demosPopover">
  <div id="demosContent"></div>
</div>
```

Default IDs:
- `buttonId`: `demosBtn`
- `popoverId`: `demosPopover`
- `contentId`: `demosContent`

You can override any of them via options.

## TypeScript

The package ships declaration files for:
- `demo-registry-widget`
- `demo-registry-widget/full`
- `demo-registry-widget/micro`

So typed imports work out of the box without extra setup.

## Registry format

Expected TSV columns:
- `slug`
- `title`
- `url`
- `tags` (optional, comma-separated)

Optional version line is supported:

```txt
#v=42
```

## Safety and behavior notes

- Only `http:` and `https:` links are rendered.
- Invalid or unsafe URLs are skipped.
- Display text is HTML-escaped before rendering.

## Development

```bash
npm run build
npm run typecheck
npm test
```

## CI

GitHub Actions runs build + tests on:
- every pull request
- push to `main`
