# @vignage/maps-sdk

Upgrades `<img>` placeholders to interactive MapLibre GL JS maps on user interaction.

Static image loads immediately (no JS overhead). The interactive iframe is preloaded on hover and revealed on click with a blur/fade transition.

## Embed

```html
<img
    class="vignagemaps-embed"
    data-hashid="abc123"
    src="https://iiif.awkw.org/col/abc123/full/800,/0/default.jpg"
    width="800"
    height="450"
    alt="Interactive map of New York City"
>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class="vignagemaps-embed"` | Yes | Selector the SDK auto-initialises on |
| `data-hashid` | Yes | Map identifier — appended to the maps base URL |
| `width` / `height` | Recommended | Used as fallback dimensions if layout hasn't run |
| `alt` | Recommended | Becomes the iframe `title` and `aria-label` |

## Script tag

```html
<!-- Production -->
<script src="https://cdn.vignage.com/sdk/maps.js" defer></script>

<!-- Override the base URL (e.g. local dev) -->
<script src="/dist/maps.js" data-maps-base="/test" defer></script>
```

`data-maps-base` defaults to `https://maps.vignage.com`. The iframe src becomes `{base}/{hashid}?w={width}&h={height}`.

## Events

```javascript
document.addEventListener('vignagemaps:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // value of data-hashid
    console.log(e.target);             // the <img> element
});
```

The event bubbles, so listening on `document` catches all embeds on the page.

## Programmatic init

The SDK auto-initialises on `DOMContentLoaded`. To initialise manually (e.g. after dynamic content is inserted):

```javascript
import { init } from '@vignage/maps-sdk/src/index';

init(containerElement, 'https://maps.vignage.com');
```

## Local dev

```bash
# From vignage-sdks/
npm run dev:maps     # watch-build → packages/maps-sdk/dist/maps.js

# Serve the repo root, then open:
# http://localhost:PORT/packages/maps-sdk/test/
```

The test harness at `test/index.html` uses `data-maps-base="/test"` which routes iframes to `test/map.html` — a minimal MapLibre page pointing at `tiles.vignage.test`.

## Build

```bash
npm run build:maps   # → packages/maps-sdk/dist/maps.js (~3.5KB minified IIFE)
```
