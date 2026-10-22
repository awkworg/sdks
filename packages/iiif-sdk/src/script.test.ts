import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/*
 * The script tag build (src/index.ts) reads its viewer base from its own <script> tag and sets
 * itself up once the page is ready. Each test loads it afresh, as a page would.
 */
function image(): HTMLImageElement {
    const img = document.createElement('img');
    img.className = 'awkw-iiif-embed';
    img.dataset.identifier = 'col/xyz789';
    document.body.appendChild(img);
    return img;
}

function as(readyState: DocumentReadyState, viewerBase?: string): void {
    const script = document.createElement('script');
    if (viewerBase) script.dataset.viewerBase = viewerBase;
    Object.defineProperty(document, 'currentScript', { value: script, configurable: true });
    Object.defineProperty(document, 'readyState', { value: readyState, configurable: true });
}

const iframeSrc = () => document.querySelector<HTMLIFrameElement>('iframe')?.src;

describe('the script tag build', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.resetModules();
    });
    afterEach(() => {
        Reflect.deleteProperty(document, 'currentScript');
        Reflect.deleteProperty(document, 'readyState');
    });

    it('sets up a ready page at once, on the base its tag names', async () => {
        const img = image();
        as('complete', 'https://iiif.example.test/');

        await import('./index');
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe('https://iiif.example.test/col/xyz789/embed');
    });

    it('waits for a loading page, then sets it up on iiif.awkw.org', async () => {
        as('loading');
        await import('./index');
        const img = image();

        img.dispatchEvent(new MouseEvent('mouseenter'));
        expect(iframeSrc()).toBeUndefined();

        document.dispatchEvent(new Event('DOMContentLoaded'));
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe('https://iiif.awkw.org/col/xyz789/embed');
    });
});
