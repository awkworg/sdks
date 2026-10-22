import { describe, it, expect, vi } from 'vitest';
import { init } from './index';

function makeDoc(...hashids: (string | null)[]): Document {
    const doc = document.implementation.createHTMLDocument();
    hashids.forEach((hashid) => {
        const img = doc.createElement('img');
        img.className = 'awkw-maps-embed';
        if (hashid !== null) img.dataset.hashid = hashid;
        doc.body.appendChild(img);
    });
    return doc;
}

describe('init', () => {
    it('initializes all .awkw-maps-embed images with a hashid', () => {
        const doc = makeDoc('map1', 'map2', 'map3');
        init(doc, 'https://maps.vignage.com');

        const imgs = doc.querySelectorAll<HTMLImageElement>('img.awkw-maps-embed');
        imgs.forEach((img) => {
            expect(img.getAttribute('role')).toBe('button');
        });
    });

    it('skips images without data-hashid and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const doc = makeDoc(null);
        init(doc, 'https://maps.vignage.com');

        expect(warn).toHaveBeenCalledOnce();
        expect(doc.querySelector('[role=button]')).toBeNull();
        warn.mockRestore();
    });

    it('does nothing when no embeds are present', () => {
        const doc = document.implementation.createHTMLDocument();
        expect(() => init(doc, 'https://maps.vignage.com')).not.toThrow();
    });

    it('handles mixed valid and invalid images', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const doc = makeDoc('valid', null, 'also-valid');
        init(doc, 'https://maps.vignage.com');

        expect(warn).toHaveBeenCalledOnce();
        expect(doc.querySelectorAll('[role=button]').length).toBe(2);
        warn.mockRestore();
    });
});
