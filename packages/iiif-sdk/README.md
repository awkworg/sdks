# @vignage/iiif-sdk

Upgrades `<img>` IIIF thumbnails to interactive OpenSeaDragon viewers on user interaction.

Static IIIF image loads immediately (no JS overhead). The OpenSeaDragon iframe (served by `iiif.awkw.org`) is preloaded on hover and revealed on click with a blur/fade transition.

## Embed

```html
<img
    class="vignage-iiif-embed"
    data-identifier="tenant-slug/abc123xyz"
    src="https://iiif.awkw.org/tenant-slug/abc123xyz/full/800,/0/default.jpg"
    width="800"
    height="600"
    alt="Portrait of a Woman, 1847"
>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class="vignage-iiif-embed"` | Yes | Selector the SDK auto-initialises on |
| `data-identifier` | Yes | `{prefix}/{identifier}` path — appended to the viewer base URL |
| `width` / `height` | Recommended | Used as fallback dimensions if layout hasn't run |
| `alt` | Recommended | Becomes the iframe `title` and `aria-label` |

`data-identifier` matches the IIIF route structure at `iiif.awkw.org/{prefix}/{identifier}/embed`. For example, `data-identifier="col/abc123"` loads `https://iiif.awkw.org/col/abc123/embed`.

## Script tag

```html
<!-- Production -->
<script src="https://cdn.vignage.com/sdk/iiif.js" defer></script>

<!-- Override the base URL (e.g. local dev) -->
<script src="/dist/iiif.js" data-viewer-base="https://iiif.vignage.test" defer></script>
```

`data-viewer-base` defaults to `https://iiif.awkw.org`. The iframe src becomes `{base}/{identifier}/embed`.

## Events

```javascript
document.addEventListener('vignaiiif:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // value of data-identifier
    console.log(e.target);             // the <img> element
});
```

The event bubbles, so listening on `document` catches all embeds on the page.

## Programmatic init

```javascript
import { init } from '@vignage/iiif-sdk/src/index';

init(containerElement, 'https://iiif.awkw.org');
```

## Local dev

```bash
# From vignage-sdks/
npm run dev:iiif     # watch-build → packages/iiif-sdk/dist/iiif.js

# Serve the repo root, then open:
# http://localhost:PORT/packages/iiif-sdk/test/
```

The test harness at `test/index.html` uses `data-viewer-base="https://iiif.vignage.test"`. Make sure `iiif.vignage.test` is running locally with the images you want to test against.

## Build

```bash
npm run build:iiif   # → packages/iiif-sdk/dist/iiif.js (~3.6KB minified IIFE)
```
