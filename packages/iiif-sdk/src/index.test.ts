import { describe, it, expect, beforeEach } from 'vitest';
import { init } from './index';

describe('init', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('opens the viewer on iiif.awkw.org when the script names no base', () => {
        const img = document.createElement('img');
        img.className = 'vignage-iiif-embed';
        img.dataset.identifier = 'col/xyz789';
        document.body.appendChild(img);

        init(document);
        img.dispatchEvent(new MouseEvent('mouseenter'));

        expect(document.querySelector<HTMLIFrameElement>('iframe')?.src)
            .toBe('https://iiif.awkw.org/col/xyz789/embed');
    });
});
