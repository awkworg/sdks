# @awkw/maps-embed

Turns a static map image from awkw's maps service into an interactive map when it is clicked.

The page loads a plain `<img>`: no JavaScript for the map until someone wants it, and an image search engines and social cards can read. On hover or focus the SDK starts loading the map's interactive page in a hidden iframe; on click it blurs the image and fades the map in over it.

## Embed

Use the embed code the maps API answers with when a map is published (`embed` in the response). It looks like this:

```html
<img
    class="awkw-maps-embed"
    data-hashid="Gv7k2LmQ9x"
    src="https://maps.awkw.org/Gv7k2LmQ9x/v1/800.webp"
    srcset="https://maps.awkw.org/Gv7k2LmQ9x/v1/400.webp 400w, …, https://maps.awkw.org/Gv7k2LmQ9x/v1/1200@2x.webp 2400w"
    sizes="(max-width: 800px) 100vw, 800px"
    width="800"
    height="450"
    alt="Giverny"
>
<script src="https://cdn.jsdelivr.net/npm/@awkw/maps-embed@0/dist/maps.js" defer></script>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class="awkw-maps-embed"` | Yes | What the SDK looks for |
| `data-hashid` | Yes | The map; its interactive page is `{maps service}/{hashid}` |
| `src`, `srcset` | Yes | The map's static images, which the service draws at 400, 800 and 1200 wide, and the two larger at 2× |
| `width` / `height` | Recommended | Hold the image's space before it loads |
| `alt` | Recommended | The map's title; also the iframe's `title` |

A new version of a map has new image URLs, so after an update, use the new embed code.

## Which maps service

Each map opens on the service its own image came from, so the embed code works as pasted, whichever service published it (`maps.awkw.org`, or `maps.vignage.test` locally). An image that isn't one of the service's own, a copy on another host, opens on `https://maps.awkw.org`. To name the service for every map on the page instead:

```html
<script src=".../maps.js" data-maps-base="https://maps.example.org" defer></script>
```

## With a bundler

```bash
npm install @awkw/maps-embed
```

```javascript
import { init } from '@awkw/maps-embed';

init();                                   // every img.awkw-maps-embed on the page
init({ root: container });                // only those inside `container`
init({ mapsBase: 'https://maps.example.org' });
```

`init` sets each image up once, so it is safe to call again after adding images.

## Events

```javascript
document.addEventListener('awkw-maps:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // the hashid
    console.log(e.target);             // the <img>
});
```

The event bubbles, so listening on `document` catches every map on the page.

## Local dev

The test harness, `test/index.html`, shows the example maps from a local maps service at `https://maps.vignage.test` (`npm run fixtures` in [awkworg/maps](https://github.com/awkworg/maps) loads them):

```bash
# From the repository root
npm run dev:maps     # watch-build → packages/maps-sdk/dist/maps.js
npx serve .          # then open http://localhost:3000/packages/maps-sdk/test/
```

## Build

```bash
npm run build:maps   # dist/maps.js (the script tag, ~4 KB minified), dist/index.js and its types
```
