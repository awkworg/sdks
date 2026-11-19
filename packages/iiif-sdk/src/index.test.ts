import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest';
import { destroy, embedFor, init } from './module';

/* The image service, as the tests have it: it has every picture, and no test reaches the real one. */
beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});
afterEach(() => {
    vi.unstubAllGlobals();
});

function image(identifier?: string): HTMLImageElement {
    const img = document.createElement('img');
    img.className = 'awkw-iiif-embed';
    if (identifier) img.dataset.identifier = identifier;
    document.body.appendChild(img);
    return img;
}

describe('init', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('opens the viewer on iiif.awkw.org when no base is given', () => {
        const img = image('col/xyz789');

        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelector<HTMLIFrameElement>('iframe')?.src)
            .toBe('https://iiif.awkw.org/col/xyz789/embed');
    });

    it('opens the viewer on the base it is given, without a trailing slash', () => {
        const img = image('col/xyz789');

        init({ viewerBase: 'https://iiif.example.test/' });
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelector<HTMLIFrameElement>('iframe')?.src)
            .toBe('https://iiif.example.test/col/xyz789/embed');
    });

    it('sets an image up once, however often it is called', () => {
        const img = image('col/xyz789');

        init();
        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelectorAll('.awkw-embed-wrap')).toHaveLength(1);
    });

    it('skips an image without an identifier, and says so', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        image();

        init();

        expect(warn).toHaveBeenCalledOnce();
        warn.mockRestore();
    });
});

describe('an embed taken away', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('is no embed after its own destroy(), as after destroy(img), and init() sets the image up afresh', () => {
        for (const takeAway of [
            (img: HTMLImageElement) => embedFor(img)!.destroy(),
            (img: HTMLImageElement) => destroy(img),
        ]) {
            document.body.innerHTML = '';
            const img = image('col/xyz789');

            init();
            expect(embedFor(img)).not.toBeNull();

            takeAway(img);
            expect(embedFor(img)).toBeNull();
            expect(img.dataset.awkwIiif).toBeUndefined();

            init();
            expect(embedFor(img)).not.toBeNull();
        }
    });
});
