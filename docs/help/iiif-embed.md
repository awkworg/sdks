---
title: Embed a picture with deep zoom
description: Add the @awkw/iiif-embed script and a picture's markup to any web page, so the picture opens into a zoomable viewer when a visitor clicks it.
---

`@awkw/iiif-embed` turns a plain `<img>` into a deep zoom viewer, in place, when a visitor reaches for it. Until then the page holds only the image, so it loads as fast as any other picture.

## Before you start

- **Make the picture public in Known Art.** Only public pictures can be embedded.
- **Copy its Image link.** Open the picture in Known Art. When it's public, its details show an **Image link**, such as `https://iiif.awkw.org/your-studio/abc123xyz`. You build everything below from that link.

## Add the script

Add it once per page. Pick one of these two ways.

### With a script tag

No build step is needed. Put this in the page's `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@awkw/iiif-embed@0.1/dist/iiif.js" defer></script>
```

The script sets up every embed on the page as soon as the page is ready. `@0.1` keeps you on the newest 0.1 release. Use `@0.1.0` to pin one exact version.

### With npm

```bash
npm install @awkw/iiif-embed
```

```js
import { init } from '@awkw/iiif-embed';

init();
```

`init()` sets up every embed that's on the page when you call it. Importing the package does nothing by itself, so call `init()` once your images are in the page. The package is an ES module and comes with TypeScript types.

`init()` takes two options, both optional:

| Option | Default | What it does |
|--------|---------|--------------|
| `root` | `document` | Only looks for embeds inside this element. |
| `viewerBase` | `https://iiif.awkw.org` | Where the viewer is served. See [Another viewer address](#another-viewer-address). |

## Add the picture

Each embed is an `<img>`. From the Image link `https://iiif.awkw.org/your-studio/abc123xyz`:

```html
<img
    class="awkw-iiif-embed"
    data-identifier="your-studio/abc123xyz"
    src="https://iiif.awkw.org/your-studio/abc123xyz/full/800,/0/default.jpg"
    width="800"
    height="600"
    alt="Harbour at Dusk, 2024"
>
```

- **`data-identifier`** is the Image link without `https://iiif.awkw.org/` at the front.
- **`src`** is the Image link with `/full/800,/0/default.jpg` on the end. That asks for the whole picture, 800 pixels wide. Change `800` to the width you need.

| Attribute | Needed | What it does |
|-----------|--------|--------------|
| `class="awkw-iiif-embed"` | Yes | Marks the image as an embed. It has to be on an `<img>`. |
| `data-identifier` | Yes | Says which picture the viewer opens. An embed without it is skipped, with a warning in the browser console. |
| `src` | Yes | The image the page shows before the viewer opens. The embed doesn't read or change it, so any size of the picture works. |
| `alt` | Recommended | Describes the picture. It labels the image and the viewer for screen readers. |
| `width` and `height` | Recommended | Hold the picture's space while it loads. The embed also falls back on them for its size if the image hasn't been laid out yet. |
| `tabindex` | No | Kept if you set it. Otherwise the embed sets `tabindex="0"` so the image can be reached with the keyboard. |

Your other attributes, such as your own classes, `srcset` and `sizes`, stay as they are. A few styles change once the embed is set up: see [Style it](#style-it).

## What visitors see

1. The page shows your image. Nothing else has loaded yet.
2. When the pointer moves over the image, or keyboard focus reaches it, the viewer starts loading out of sight.
3. When the visitor clicks the image, or presses Enter or Space while it has focus, the image blurs while the viewer finishes loading. Then the viewer fades in where the image was.
4. In the viewer, visitors drag to move around and scroll or pinch to zoom. Buttons in the top left corner zoom in, zoom out and reset the view.

A click that comes first, such as a tap on a phone, starts loading the viewer and opens it once it's ready.

Once the viewer is open, a **×** button in its top right corner closes it and shows the image again, which a click opens again. Your code can close it too: see [Close or take away an embed](#close-or-take-away-an-embed).

If the picture can't be shown, because `data-identifier` names no public picture, the image stays where it is with "This image can’t be opened" across its foot, rather than an empty viewer.

## Keyboard and screen readers

- The embed makes the image a button: it adds `role="button"` and, unless you set your own, `tabindex="0"`.
- It labels the image with its `alt` text and "— click to interact", such as "Harbour at Dusk, 2024 — click to interact". With no `alt`, the label is "Image — click to interact".
- Enter and Space open the viewer. Space doesn't scroll the page while the image has focus.
- The viewer's frame takes the image's `alt` text as its title, or "Interactive Image Viewer" with no `alt`. Its buttons are labelled "Zoom in", "Zoom out" and "Reset zoom".
- When the viewer opens, the image is hidden and its label removed, and focus moves into the viewer. The close button is labelled "Close the viewer". Closing moves focus back to the image.
- For a visitor who asks for reduced motion, the image doesn't scale or blur gradually, and the viewer appears without fading in.
- A picture that can't be opened is labelled with its `alt` text and "— can’t be opened", and its notice is a status message, so screen readers read it.

## Follow an embed's state

Each embed sends an `awkw-iiif:statechange` event from its `<img>` when its state changes. The event bubbles, so one listener on `document` hears every embed on the page:

```js
document.addEventListener('awkw-iiif:statechange', (event) => {
    const img = event.target;
    const { state, identifier } = event.detail;

    console.log(identifier, state);
});
```

`event.detail.identifier` is the image's `data-identifier`. `event.detail.state` is one of these, in order:

| State | When |
|-------|------|
| `idle` | Where every embed starts. No event is sent for it. |
| `hovering` | The pointer or keyboard focus reached the image, or it was clicked first. Right after this event, the embed wraps the image and starts loading the viewer out of sight. |
| `loading` | The image was clicked or pressed. It's blurred while the viewer finishes loading. |
| `transitioning` | The viewer has loaded and is fading in. |
| `interactive` | The viewer is open and the image is hidden. |
| `unavailable` | The picture can't be shown. The image stays, with a notice across it. |

An embed moves forward through these, except that closing the viewer sends `idle` again, and a click on a picture marked `unavailable` asks again. A second click while the viewer is loading changes nothing, so each state arrives once each time the viewer opens.

## Style it

The image is yours to style as usual. When the pointer or focus first reaches it, the embed puts it inside a wrapper, `<div class="awkw-embed-wrap">`, as wide as the image at that moment and never wider than its container, keeping the image's shape. The viewer's `<iframe>` and its close button go in the same wrapper.

These are the hooks you can use:

| Selector | What it is |
|----------|------------|
| `img.awkw-iiif-embed` | Your image. |
| `img[data-awkw-iiif="ready"]` | An image the embed has set up. |
| `.awkw-embed-wrap` | The wrapper, added on first hover or focus. |
| `.awkw-embed-wrap iframe` | The viewer. |
| `.awkw-embed-close` | The button that closes the viewer. |
| `.awkw-embed-unavailable` | The notice on a picture that can't be shown. |

For example, to round the corners and add a shadow before and after the viewer opens:

```css
.awkw-iiif-embed,
.awkw-embed-wrap {
    border-radius: 8px;
}

.awkw-embed-wrap {
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
}
```

The wrapper clips what's inside it, so the viewer keeps the rounded corners.

A few things the embed sets on its elements directly, in their `style` attribute. Your stylesheet only overrides them with `!important`:

- On the wrapper: its width and height in pixels, `position: relative`, `display: inline-block`, `overflow: hidden` and `line-height: 0`.
- On the image, once wrapped: it fills the wrapper, with `object-fit: cover`. While the viewer opens, it gets a blur, and then `display: none`.

To keep an embed on a line of its own, put the image in a block of its own, such as a `<figure>` or a `<p>`.

To style an embed by its state, use the event. This marks the wrapper with the current state. The wrapper doesn't exist yet when `hovering` is sent, so it's marked from `loading` on:

```js
document.addEventListener('awkw-iiif:statechange', (event) => {
    event.target.closest('.awkw-embed-wrap')?.setAttribute('data-state', event.detail.state);
});
```

```css
.awkw-embed-wrap[data-state="loading"] {
    outline: 2px solid currentColor;
}
```

## Pictures added after the page loads

`init()` only sets up the embeds that are on the page when you call it. If you add pictures later, such as from a "load more" button, call `init()` again. It skips embeds it has already set up, so calling it twice is safe. To look only at the new part of the page, pass it as `root`:

```js
import { init } from '@awkw/iiif-embed';

const gallery = document.querySelector('#gallery');
const img = document.createElement('img');

img.className = 'awkw-iiif-embed';
img.dataset.identifier = 'your-studio/def456uvw';
img.src = 'https://iiif.awkw.org/your-studio/def456uvw/full/800,/0/default.jpg';
img.alt = 'Bedroom, 2023';
img.width = 800;
img.height = 600;
gallery.append(img);

init({ root: gallery });
```

The script tag build gives the page the same `init()` as `AwkwIiif.init()`, on the viewer address its tag names. Call it the same way for pictures you add later:

```js
AwkwIiif.init({ root: gallery });
```

## Close or take away an embed

`embedFor(img)` gives an image's embed once `init()` has set it up, or `null` before. Its `close()` closes the viewer and shows the image again. `destroy(img)` takes the embed away: the wrapper, the viewer and the embed's listeners go, the image is as it was, and `init()` would set it up afresh.

```js
import { destroy, embedFor } from '@awkw/iiif-embed';

embedFor(img)?.close();
destroy(img);
```

With the script tag, they're `AwkwIiif.embedFor()` and `AwkwIiif.destroy()`.

## Another viewer address

The viewer is a page that Known Art's image service serves for each public picture, at `https://iiif.awkw.org/{data-identifier}/embed`. Other image servers don't have that page, so the embed only works with Known Art pictures.

Both builds can point at another copy of that service, such as one you're testing against. With npm, pass `viewerBase` to `init()`. With the script tag, add `data-viewer-base` to the tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@awkw/iiif-embed@0.1/dist/iiif.js" data-viewer-base="https://iiif.example.test" defer></script>
```

Leave both out to use `https://iiif.awkw.org`.

## Things to know

- **The wrapper is never wider than its first size.** It takes the image's width when the pointer or focus first reaches it, and narrows with a narrower page, keeping its shape. If the page then grows wider, it stays at that first width.
- **A wrong address can't be opened.** If `data-identifier` doesn't match a public picture, the embed says "This image can’t be opened" on the image. Check it against the picture's Image link, and check the picture is still public.
- **Some pictures have a largest size.** If `src` asks for a width bigger than the picture allows, the image doesn't load. Ask for a smaller width.
