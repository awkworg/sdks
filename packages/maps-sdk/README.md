# @awkw/maps-embed

Upgrades `<img>` placeholders to interactive MapLibre GL JS maps on user interaction.

Static image loads immediately (no JS overhead). The interactive iframe is preloaded on hover and revealed on click with a blur/fade transition.

## Embed

```html
<img
    class="awkw-maps-embed"
    data-hashid="abc123"
    src="https://iiif.awkw.org/col/abc123/full/800,/0/default.jpg"
    width="800"
    height="450"
    alt="Interactive map of New York City"
>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class="awkw-maps-embed"` | Yes | Selector the SDK auto-initialises on |
| `data-hashid` | Yes | Map identifier — appended to the maps base URL |
| `width` / `height` | Recommended | Used as fallback dimensions if layout hasn't run |
| `alt` | Recommended | Becomes the iframe `title` and `aria-label` |

## Script tag

```html
<script src="/dist/maps.js" data-maps-base="/test" defer></script>
```

Not published yet: there is no hosted maps service, so `data-maps-base` must name one. Its built-in default, `https://maps.vignage.com`, does not exist. The iframe src becomes `{base}/{hashid}?w={width}&h={height}`.

## Events

```javascript
document.addEventListener('awkw-maps:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // value of data-hashid
    console.log(e.target);             // the <img> element
});
```

The event bubbles, so listening on `document` catches all embeds on the page.

## Programmatic init

The SDK auto-initialises on `DOMContentLoaded`. To initialise manually (e.g. after dynamic content is inserted):

```javascript
import { init } from '@awkw/maps-embed/src/index';

init(containerElement, 'https://maps.vignage.com');
```

## Local dev

```bash
# From the repository root
npm run dev:maps     # watch-build → packages/maps-sdk/dist/maps.js

# Serve the repo root, then open:
# http://localhost:PORT/packages/maps-sdk/test/
```

The test harness at `test/index.html` uses `data-maps-base="/test"` which routes iframes to `test/map.html` — a minimal MapLibre page pointing at `tiles.vignage.test`.

## Build

```bash
npm run build:maps   # → packages/maps-sdk/dist/maps.js (~3.5KB minified IIFE)
```
