import { EmbedMap } from './embed';

const PRODUCTION_BASE = 'https://maps.vignage.com';

// Capture currentScript at evaluation time — only valid during initial script execution
const _script = document.currentScript as HTMLScriptElement | null;
const _defaultBase = (_script?.dataset.mapsBase ?? PRODUCTION_BASE).replace(/\/$/, '');

export function init(root: Document = document, mapsBase: string = _defaultBase): void {
    const images = root.querySelectorAll<HTMLImageElement>('img.vignagemaps-embed');
    images.forEach((img) => {
        if (!img.dataset.hashid) {
            console.warn('[vignage-maps] <img> missing data-hashid, skipping:', img);
            return;
        }
        new EmbedMap(img, mapsBase);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
} else {
    init();
}
