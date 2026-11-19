import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest';
import { EmbedIiif } from './embed';

/* The image service, as the tests have it: it has every picture, unless a test says otherwise. */
beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});
afterEach(() => {
    vi.unstubAllGlobals();
});

/** Lets the embed's check of what it can show settle before a frame is awaited. */
const settle = () => new Promise((r) => setTimeout(r, 0));

const VIEWER_BASE = 'https://iiif.awkw.org';

function makeImg(overrides: Partial<{ identifier: string; width: number; height: number; alt: string }> = {}): HTMLImageElement {
    const img = document.createElement('img');
    img.dataset.identifier = overrides.identifier ?? 'col/abc123';
    img.width = overrides.width ?? 800;
    img.height = overrides.height ?? 450;
    img.alt = overrides.alt ?? 'Test image';
    document.body.appendChild(img);
    return img;
}

describe('EmbedIiif — accessibility', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('adds tabindex=0 when not already set', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        expect(img.getAttribute('tabindex')).toBe('0');
    });

    it('preserves existing tabindex', () => {
        const img = makeImg();
        img.setAttribute('tabindex', '2');
        new EmbedIiif(img, VIEWER_BASE);
        expect(img.getAttribute('tabindex')).toBe('2');
    });

    it('sets role=button and cursor=pointer', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        expect(img.getAttribute('role')).toBe('button');
        expect(img.style.cursor).toBe('pointer');
    });

    it('sets aria-label using alt text', () => {
        const img = makeImg({ alt: 'Portrait of a Woman' });
        new EmbedIiif(img, VIEWER_BASE);
        expect(img.getAttribute('aria-label')).toContain('Portrait of a Woman');
    });
});

describe('EmbedIiif — state', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('starts in idle state', () => {
        const embed = new EmbedIiif(makeImg(), VIEWER_BASE);
        expect(embed.currentState).toBe('idle');
    });

    it('moves to hovering on mouseenter', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));
        expect(embed.currentState).toBe('hovering');
    });

    it('moves to hovering on focus', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new FocusEvent('focus'));
        expect(embed.currentState).toBe('hovering');
    });

    it('moves to loading on click', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.click();
        expect(embed.currentState).toBe('loading');
    });

    it('moves to loading on Enter key', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(embed.currentState).toBe('loading');
    });

    it('moves to loading on Space key', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        expect(embed.currentState).toBe('loading');
    });

    it('ignores second click when already loading', () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        img.click();
        expect(embed.currentState).toBe('loading');
        img.click();
        expect(embed.currentState).toBe('loading');
    });
});

describe('EmbedIiif — DOM wrapping', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('wraps img in .awkw-embed-wrap on hover', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const wrapper = document.querySelector('.awkw-embed-wrap');
        expect(wrapper).not.toBeNull();
        expect(wrapper?.contains(img)).toBe(true);
    });

    it('uses img.width/height as fallback when layout is zero', () => {
        const img = makeImg({ width: 640, height: 360 });
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const wrapper = document.querySelector<HTMLDivElement>('.awkw-embed-wrap');
        expect(wrapper?.style.width).toBe('640px');
        /* Its shape kept, narrower with a narrower page. */
        expect(wrapper?.style.aspectRatio).toBe('640 / 360');
        expect(wrapper?.style.maxWidth).toBe('100%');
    });

    it('does not double-wrap on repeated hover', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelectorAll('.awkw-embed-wrap').length).toBe(1);
    });
});

describe('EmbedIiif — iframe', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('inserts iframe with correct src on hover', () => {
        const img = makeImg({ identifier: 'col/xyz789' });
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const iframe = document.querySelector<HTMLIFrameElement>('iframe');
        expect(iframe).not.toBeNull();
        expect(iframe?.src).toBe('https://iiif.awkw.org/col/xyz789/embed');
    });

    it('sets iframe title for accessibility', () => {
        const img = makeImg({ alt: 'Portrait of a Woman' });
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const iframe = document.querySelector('iframe');
        expect(iframe?.getAttribute('title')).toBe('Portrait of a Woman');
    });

    it('does not insert iframe before first interaction', () => {
        makeImg();
        expect(document.querySelector('iframe')).toBeNull();
    });

    it('does not insert duplicate iframes on repeated hover', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelectorAll('iframe').length).toBe(1);
    });
});

describe('EmbedIiif — transition', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('blurs image on click', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.click();
        expect(img.style.filter).toContain('blur');
    });

    it('scales image on click', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.click();
        expect(img.style.transform).toContain('scale');
    });

    it('reveals iframe when it fires load after click', async () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.click();

        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        iframe.dispatchEvent(new Event('load'));

        await settle();
        await new Promise(r => requestAnimationFrame(r));
        expect(iframe.style.opacity).toBe('1');
    });

    it('reveals iframe immediately when already loaded before click', async () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        iframe.dispatchEvent(new Event('load')); // prewarmed during hover

        img.click();

        await settle();
        await new Promise(r => requestAnimationFrame(r));
        expect(iframe.style.opacity).toBe('1');
    });

    it('iframe has pointer-events:none before activation', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        expect(iframe.style.pointerEvents).toBe('none');
    });

    it('hides image after iframe load and transition', async () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.click();

        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        iframe.dispatchEvent(new Event('load'));
        // Wait for the rAF in revealIframe to run so it registers the transitionend listener
        await settle();
        await new Promise(r => requestAnimationFrame(r));
        iframe.dispatchEvent(new Event('transitionend'));

        expect(img.style.display).toBe('none');
    });
});

describe('EmbedIiif — events', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('dispatches awkw-iiif:statechange on hover', () => {
        const img = makeImg();
        const states: string[] = [];
        img.addEventListener('awkw-iiif:statechange', (e) => {
            states.push((e as CustomEvent<{ state: string }>).detail.state);
        });

        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(states).toContain('hovering');
    });

    it('dispatches awkw-iiif:statechange with identifier', () => {
        const img = makeImg({ identifier: 'col/img42' });
        let detail: Record<string, unknown> = {};
        img.addEventListener('awkw-iiif:statechange', (e) => {
            detail = (e as CustomEvent).detail;
        });

        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(detail.identifier).toBe('col/img42');
    });

    it('bubbles statechange events', () => {
        const img = makeImg();
        let fired = false;
        document.addEventListener('awkw-iiif:statechange', () => { fired = true; });

        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(fired).toBe(true);
    });
});

/** Opens an embed's viewer as a visitor would: a click, the viewer loaded, the fade done. */
async function opened(embed: EmbedIiif, img: HTMLImageElement) {
    img.click();
    const iframe = img.closest('.awkw-embed-wrap')!.querySelector('iframe')!;
    iframe.dispatchEvent(new Event('load'));
    await settle();
    await new Promise((r) => requestAnimationFrame(r));
    iframe.dispatchEvent(new Event('transitionend'));
    expect(embed.currentState).toBe('interactive');
    return iframe;
}

describe('EmbedIiif — closing and taking away', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('moves focus into the viewer when it opens, and shows a button to close it', async () => {
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);
        const iframe = await opened(embed, img);
        const closer = document.querySelector<HTMLButtonElement>('.awkw-embed-close')!;

        expect(document.activeElement).toBe(iframe);
        expect(closer.hidden).toBe(false);
        expect(closer.getAttribute('aria-label')).toBe('Close the viewer');
    });

    it('closes back to the image, focused and labelled, which opens again on the next click', async () => {
        const img = makeImg({ alt: 'Water Lilies' });
        const embed = new EmbedIiif(img, VIEWER_BASE);
        const iframe = await opened(embed, img);

        document.querySelector<HTMLButtonElement>('.awkw-embed-close')!.click();

        expect(embed.currentState).toBe('idle');
        expect(iframe.style.opacity).toBe('0');
        expect(img.style.display).toBe('');
        expect(img.style.filter).toBe('');
        expect(img.getAttribute('aria-label')).toBe('Water Lilies — click to interact');
        expect(document.activeElement).toBe(img);

        img.click();
        expect(embed.currentState).toBe('loading');
    });

    it('takes itself away, leaving the image as it found it', async () => {
        const img = makeImg();
        img.style.border = '1px solid';
        const embed = new EmbedIiif(img, VIEWER_BASE);

        await opened(embed, img);
        embed.destroy();

        expect(document.querySelector('.awkw-embed-wrap')).toBeNull();
        expect(document.querySelector('iframe')).toBeNull();
        expect(img.parentElement).toBe(document.body);
        expect(img.getAttribute('role')).toBeNull();
        expect(img.getAttribute('tabindex')).toBeNull();
        expect(img.style.cssText).toBe('border: 1px solid;');

        /* No listener is left: a click does nothing. */
        img.click();
        expect(document.querySelector('.awkw-embed-wrap')).toBeNull();
    });

    it('opens once for two clicks while loading, its states told once each', async () => {
        const img = makeImg();
        const states: string[] = [];
        img.addEventListener('awkw-iiif:statechange', (e) => states.push((e as CustomEvent).detail.state));
        new EmbedIiif(img, VIEWER_BASE);

        img.click();
        img.click();
        const iframe = document.querySelector('iframe')!;
        iframe.dispatchEvent(new Event('load'));
        await settle();
        await new Promise((r) => requestAnimationFrame(r));
        iframe.dispatchEvent(new Event('transitionend'));

        expect(states).toEqual(['hovering', 'loading', 'transitioning', 'interactive']);
    });
});

describe('EmbedIiif — a picture it can’t show', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('asks the image service, and says so on the image rather than opening an empty viewer', async () => {
        const fetched = vi.fn(async (_url: string) => new Response('', { status: 403 }));
        vi.stubGlobal('fetch', fetched);
        const img = makeImg({ identifier: 'col/private', alt: 'A study' });
        const embed = new EmbedIiif(img, VIEWER_BASE);

        img.click();
        document.querySelector('iframe')!.dispatchEvent(new Event('load'));
        await settle();

        expect(fetched.mock.calls[0]![0]).toBe(`${VIEWER_BASE}/col/private/info.json`);
        expect(embed.currentState).toBe('unavailable');
        expect(img.style.filter).toBe('');
        expect(document.querySelector('.awkw-embed-unavailable')?.textContent).toBe('This image can’t be opened.');
        /* Its frame, which had nothing to show, taken away until it's asked again. */
        expect(document.querySelector('iframe')).toBeNull();
        expect(img.getAttribute('aria-label')).toBe('A study — can’t be opened');
    });

    it('has its notice in the page from the start, empty, so a screen reader hears it fill', () => {
        const img = makeImg();
        new EmbedIiif(img, VIEWER_BASE);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        const notice = document.querySelector('.awkw-embed-unavailable')!;

        expect(notice.getAttribute('role')).toBe('status');
        expect(notice.textContent).toBe('');
    });

    it('asks again on the next click, and opens a picture made public since', async () => {
        const answers = [403, 200];
        const fetched = vi.fn(async () => new Response('{}', { status: answers.shift()! }));
        vi.stubGlobal('fetch', fetched);
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);

        img.click();
        const first = document.querySelector('iframe')!;
        first.dispatchEvent(new Event('load'));
        await settle();
        expect(embed.currentState).toBe('unavailable');
        expect(first.isConnected).toBe(false);

        const second = await opened(embed, img);
        expect(fetched).toHaveBeenCalledTimes(2);
        /* A fresh frame, not the one loaded while the picture was private. */
        expect(second).not.toBe(first);
        expect(document.querySelectorAll('iframe')).toHaveLength(1);
        expect(document.querySelector('.awkw-embed-unavailable')!.textContent).toBe('');
    });

    it('opens it anyway when the service can’t be asked', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);

        await opened(embed, img);
    });
});

describe('EmbedIiif — reduced motion', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('neither scales nor fades for a visitor who asks for less motion', async () => {
        vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);

        img.click();
        expect(img.style.transform).toBe('');
        expect(img.style.transition).toBe('');

        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        iframe.dispatchEvent(new Event('load'));
        await settle();

        /* Open at once, with no frame awaited and no transitionend. */
        expect(iframe.style.transition).toBe('');
        expect(embed.currentState).toBe('interactive');
    });
});

describe('EmbedIiif — closed or taken away mid-fade', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    for (const [how, takeAway] of [
        ['closed', (embed: EmbedIiif) => embed.close()],
        ['taken away', (embed: EmbedIiif) => embed.destroy()],
    ] as const) {
        it(`stays ${how}: the fade neither shows the viewer nor hides the image`, async () => {
            const img = makeImg();
            const embed = new EmbedIiif(img, VIEWER_BASE);

            img.click();
            const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
            iframe.dispatchEvent(new Event('load'));
            await settle();
            expect(embed.currentState).toBe('transitioning');

            takeAway(embed);
            await new Promise((r) => requestAnimationFrame(r));
            iframe.dispatchEvent(new Event('transitionend'));

            expect(embed.currentState).toBe('idle');
            expect(img.style.display).toBe('');
            /* Closed, the viewer is hidden again; taken away, it is gone. */
            if (how === 'closed') {
                expect(iframe.style.opacity).toBe('0');
            } else {
                expect(iframe.isConnected).toBe(false);
            }
        });
    }
});

describe('EmbedIiif — closed after the fade began', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.useRealTimers(); });

    it('stops the fade under way, so neither its transitionend nor its fallback finishes a later one', async () => {
        vi.useFakeTimers();
        const img = makeImg();
        const states: string[] = [];
        img.addEventListener('awkw-iiif:statechange', (e) => states.push((e as CustomEvent).detail.state));
        const embed = new EmbedIiif(img, VIEWER_BASE);

        img.click();
        const iframe = document.querySelector<HTMLIFrameElement>('iframe')!;
        iframe.dispatchEvent(new Event('load'));
        /* The ask, then the fade's frame: the viewer is fading in, its listener and timer set. */
        await vi.advanceTimersByTimeAsync(20);
        expect(iframe.style.opacity).toBe('1');

        embed.close();
        iframe.dispatchEvent(new Event('transitionend'));
        await vi.advanceTimersByTimeAsync(500);
        expect(embed.currentState).toBe('idle');
        expect(img.style.display).toBe('');

        /* Opened again, the new fade finishes once, by its own end. */
        states.length = 0;
        img.click();
        await vi.advanceTimersByTimeAsync(20);
        iframe.dispatchEvent(new Event('transitionend'));
        await vi.advanceTimersByTimeAsync(500);

        expect(states.filter((state) => state === 'interactive')).toHaveLength(1);
        expect(embed.currentState).toBe('interactive');
    });
});

describe('EmbedIiif — a slow image service', () => {
    beforeEach(() => { document.body.innerHTML = ''; });
    afterEach(() => { vi.useRealTimers(); });

    it('gives up asking after three seconds, and opens the viewer as it would have', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
            new Promise((_, reject) => {
                init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            })));
        const img = makeImg();
        const embed = new EmbedIiif(img, VIEWER_BASE);

        img.click();
        document.querySelector('iframe')!.dispatchEvent(new Event('load'));
        await vi.advanceTimersByTimeAsync(2999);
        expect(embed.currentState).toBe('loading');

        await vi.advanceTimersByTimeAsync(1);
        expect(embed.currentState).toBe('transitioning');
    });
});
