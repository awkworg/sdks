# @vignage/embed-core

Internal package. Not published to npm — consumed as a workspace dependency by `maps-sdk` and `iiif-sdk`.

Contains:
- **`EmbedBase`** — abstract class with the complete state machine, DOM wrapping, iframe lifecycle, accessibility setup, and blur/reveal transition.
- **`transition.ts`** — `blurImage()` and `revealIframe()` CSS helpers.

## Abstract contract

To create a new embed type, extend `EmbedBase` and implement these five members:

```typescript
import { EmbedBase } from '@vignage/embed-core';

export class EmbedFoo extends EmbedBase {
    private readonly fooBase: string;

    constructor(img: HTMLImageElement, fooBase: string) {
        super(img);
        this.fooBase = fooBase;
    }

    // Read the domain-specific identifier from the img's data attributes
    protected readIdentifier(img: HTMLImageElement): string {
        return img.dataset.fooId ?? '';
    }

    // Construct the iframe src URL. w/h are the wrapper dimensions in px.
    protected buildIframeUrl(w: number, h: number): string {
        return `${this.fooBase}/${this.identifier}?w=${w}&h=${h}`;
    }

    // Prefix for the statechange custom event: 'foo' → 'foo:statechange'
    protected get eventNamespace(): string { return 'foo'; }

    // Fallback noun for aria-label when img.alt is empty
    protected get ariaLabelNoun(): string { return 'Foo'; }

    // iframe title attribute (used by screen readers)
    protected get iframeTitle(): string { return this.img.alt || 'Interactive Foo'; }
}
```

`this.identifier` (set by `super()` from `readIdentifier`) is available in `buildIframeUrl` and `iframeTitle`.

## State machine

```
idle ──mouseenter/focus──► hovering ──click/Enter/Space──► loading ──iframe load──► transitioning ──transitionend──► interactive
```

- **idle → hovering**: wraps img in `.vignage-wrap`, inserts hidden `<iframe>` (preload starts).
- **hovering → loading**: blurs/scales the image.
- **loading → transitioning**: iframe fades in (`opacity: 0 → 1`), `pointer-events` enabled.
- **transitioning → interactive**: image hidden (`display: none`), `aria-label` removed.

Clicking from `idle` skips directly to `loading` (hover + activate in one gesture).

## Custom event

Each state change dispatches a bubbling `CustomEvent` on the `<img>` element:

```javascript
img.addEventListener('vignagemaps:statechange', (e) => {
    console.log(e.detail.state);       // 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive'
    console.log(e.detail.identifier);  // value of readIdentifier()
});
```

## Transition helpers

```typescript
import { blurImage, revealIframe } from '@vignage/embed-core';

blurImage(img);
// Sets: filter: blur(8px); transform: scale(1.02); with 0.3s ease transitions

revealIframe(iframe, onComplete);
// Sets opacity: 0 → 1 with 0.25s ease transition via requestAnimationFrame.
// Calls onComplete() on transitionend, with a 400ms fallback timer.
```
