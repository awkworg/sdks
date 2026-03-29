import { EmbedIiif } from './embed';

const PRODUCTION_BASE = 'https://iiif.vignage.com';

const _script = document.currentScript as HTMLScriptElement | null;
const _defaultBase = (_script?.dataset.viewerBase ?? PRODUCTION_BASE).replace(/\/$/, '');

export function init(root: Document = document, viewerBase: string = _defaultBase): void {
    const images = root.querySelectorAll<HTMLImageElement>('img.vignage-iiif-embed');
    images.forEach((img) => {
        if (!img.dataset.identifier) {
            console.warn('[vignage-iiif] <img> missing data-identifier, skipping:', img);
            return;
        }
        new EmbedIiif(img, viewerBase);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
} else {
    init();
}
