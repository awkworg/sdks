import { describe, it, expect, beforeEach } from 'vitest';
import { EmbedIiif } from './embed';

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
        expect(wrapper?.style.height).toBe('360px');
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
