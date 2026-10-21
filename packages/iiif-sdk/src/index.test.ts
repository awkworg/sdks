import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init } from './module';

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
