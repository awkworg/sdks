# @awkw/iiif-embed

Upgrades `<img>` IIIF thumbnails to interactive OpenSeaDragon viewers on user interaction.

Static IIIF image loads immediately (no JS overhead). The OpenSeaDragon iframe (served by `iiif.awkw.org`) is preloaded on hover and revealed on click with a blur/fade transition.

**For images on awkw's image service only.** The viewer is a page that `iiif.awkw.org` serves for each of its images (`/{prefix}/{identifier}/embed`), which other IIIF servers don't have. `viewerBase` is for local development and other awkw environments, not for other servers.

## Install

```bash
npm install @awkw/iiif-embed
```

```javascript
import { init } from '@awkw/iiif-embed';

init(); // every img.awkw-iiif-embed on the page
init({ viewerBase: 'https://iiif.example.org', root: someElement });
```

`init` is safe to call again after adding images: each image is set up once. It never runs on import, so a bundler can include the package without side effects.

Or with no build step, from jsDelivr, which serves every npm release:

```html
<script src="https://cdn.jsdelivr.net/npm/@awkw/iiif-embed@0.1/dist/iiif.js" defer></script>
```

The script tag build sets itself up when the page is ready.

## Embed

```html
<img
    class="awkw-iiif-embed"
    data-identifier="tenant-slug/abc123xyz"
    src="https://iiif.awkw.org/tenant-slug/abc123xyz/full/800,/0/default.jpg"
    width="800"
    height="600"
    alt="Portrait of a Woman, 1847"
>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class="awkw-iiif-embed"` | Yes | Selector the SDK auto-initialises on |
| `data-identifier` | Yes | `{prefix}/{identifier}` path — appended to the viewer base URL |
| `width` / `height` | Recommended | Used as fallback dimensions if layout hasn't run |
| `alt` | Recommended | Becomes the iframe `title` and `aria-label` |

`data-identifier` matches the IIIF route structure at `iiif.awkw.org/{prefix}/{identifier}/embed`. For example, `data-identifier="col/abc123"` loads `https://iiif.awkw.org/col/abc123/embed`.

## Script tag

```html
<!-- Another viewer, such as a local one -->
<script src="/dist/iiif.js" data-viewer-base="https://iiif.vignage.test" defer></script>
```

`data-viewer-base` defaults to `https://iiif.awkw.org`. The iframe src becomes `{base}/{identifier}/embed`.

## Events

```javascript
document.addEventListener('awkw-iiif:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // value of data-identifier
    console.log(e.target);             // the <img> element
});
```

The event bubbles, so listening on `document` catches all embeds on the page.

## Local dev

```bash
# From the repository root
npm run dev:iiif     # watch-build → packages/iiif-sdk/dist/iiif.js

# Serve the repo root, then open:
# http://localhost:PORT/packages/iiif-sdk/test/
```

The test harness at `test/index.html` uses `data-viewer-base="https://iiif.vignage.test"`. Make sure `iiif.vignage.test` is running locally with the images you want to test against.

## Build

```bash
npm run build:iiif   # → dist/index.js (ES module), dist/iiif.js (~3.7 kB minified script), dist/types/
```
