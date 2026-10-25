import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init } from './module';

const HASHID = 'Gv7k2LmQ9x';

function image(hashid: string | null = HASHID, src?: string): HTMLImageElement {
    const img = document.createElement('img');
    img.className = 'awkw-maps-embed';
    if (hashid) img.dataset.hashid = hashid;
    if (src) img.setAttribute('src', src);
    document.body.appendChild(img);
    return img;
}

const iframeSrc = () => document.querySelector<HTMLIFrameElement>('iframe')?.src;

describe('init', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('opens the map on maps.awkw.org when no base is given', () => {
        const img = image();

        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.awkw.org/${HASHID}`);
    });

    it('opens the map on the base it is given, without a trailing slash', () => {
        const img = image();

        init({ mapsBase: 'https://maps.example.test/' });
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.example.test/${HASHID}`);
    });

    it('treats an empty base as none, rather than framing the page’s own site', () => {
        const img = image();

        init({ mapsBase: '' });
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.awkw.org/${HASHID}`);
    });

    it('never takes the service from an image’s src, whoever served it', () => {
        const img = image(HASHID, `https://evil.example/${HASHID}/v1/800.webp`);

        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.awkw.org/${HASHID}`);
    });

    it('skips an image without data-hashid, and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        image(null);
        image();

        init();

        expect(warn).toHaveBeenCalledOnce();
        expect(document.querySelectorAll('[role=button]').length).toBe(1);
        warn.mockRestore();
    });

    it('sets an image up once however often it is called', () => {
        const img = image();

        init();
        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelectorAll('iframe').length).toBe(1);
    });

    it('looks only within the root it is given', () => {
        const inside = document.createElement('section');
        document.body.appendChild(inside);
        const outer = image();
        inside.appendChild(image('Ab12Cd34Ef'));

        init({ root: inside });

        expect(outer.getAttribute('role')).toBeNull();
        expect(inside.querySelector('img')?.getAttribute('role')).toBe('button');
    });
});
