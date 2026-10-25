import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/*
 * The script tag build (src/index.ts) reads the maps service from its own <script> tag and sets
 * itself up once the page is ready. Each test loads it afresh, as a page would.
 */
const HASHID = 'Gv7k2LmQ9x';

function image(): HTMLImageElement {
    const img = document.createElement('img');
    img.className = 'awkw-maps-embed';
    img.dataset.hashid = HASHID;
    img.setAttribute('src', `https://maps.vignage.test/${HASHID}/v1/800.webp`);
    document.body.appendChild(img);
    return img;
}

function as(readyState: DocumentReadyState, mapsBase?: string): void {
    const script = document.createElement('script');
    if (mapsBase) script.dataset.mapsBase = mapsBase;
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

    it('sets up a ready page at once, on the service its tag names', async () => {
        const img = image();
        as('complete', 'https://maps.example.test/');

        await import('./index');
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.example.test/${HASHID}`);
    });

    it('waits for a loading page, then sets it up on maps.awkw.org', async () => {
        as('loading');
        await import('./index');
        const img = image();

        img.dispatchEvent(new MouseEvent('mouseenter'));
        expect(iframeSrc()).toBeUndefined();

        document.dispatchEvent(new Event('DOMContentLoaded'));
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.awkw.org/${HASHID}`);
    });
});
