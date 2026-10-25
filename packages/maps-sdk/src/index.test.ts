import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init, serviceOf } from './module';

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

    it('opens the map on the service its image came from, as the embed code gives it', () => {
        const img = image(HASHID, `https://maps.example.test/${HASHID}/v3/800.webp`);

        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.example.test/${HASHID}`);
    });

    it('opens the map on maps.awkw.org when its image is not one of the service’s', () => {
        const img = image(HASHID, 'https://cdn.example.org/copy-of-the-map.webp');

        init();
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.awkw.org/${HASHID}`);
    });

    it('opens the map on the base it is given, without a trailing slash, over its image’s', () => {
        const img = image(HASHID, `https://maps.example.test/${HASHID}/v3/800.webp`);

        init({ mapsBase: 'https://maps.other.test/' });
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(iframeSrc()).toBe(`https://maps.other.test/${HASHID}`);
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

describe('the service an image came from', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('is the origin of any of the map’s static images, 1× or 2×, WebP or JPEG', () => {
        for (const path of ['v1/400.webp', 'v12/1200@2x.jpg']) {
            expect(serviceOf(image(HASHID, `https://maps.vignage.test/${HASHID}/${path}`)))
                .toBe('https://maps.vignage.test');
        }
    });

    it('is nothing for another map’s image, another kind of URL, or no src', () => {
        expect(serviceOf(image(HASHID, 'https://maps.example.test/Zz99Yy88Xx/v1/800.webp'))).toBeNull();
        expect(serviceOf(image(HASHID, `https://maps.example.test/${HASHID}`))).toBeNull();
        expect(serviceOf(image(HASHID, `https://maps.example.test/${HASHID}/v1/800.png`))).toBeNull();
        expect(serviceOf(image(HASHID))).toBeNull();
    });
});
