import { EmbedMap } from './embed';

/** The maps service, whose map pages are at {base}/{hashid}. */
export const DEFAULT_MAPS_BASE = 'https://maps.awkw.org';

export type InitOptions = {
    /**
     * Where the maps service is. Unset, each map uses the service its own image came from,
     * so the embed code the service gives works as pasted, then maps.awkw.org.
     */
    mapsBase?: string;
    /** Where to look for images; defaults to the whole document. */
    root?: ParentNode;
};

/*
 * A static image the maps service drew of this map: {base}/{hashid}/v{n}/{width}[@2x].{webp|jpg}.
 * Matched exactly, so a copy of the image on some other host is never taken for the service.
 */
const IMAGE_PATH = /^\/([A-Za-z0-9]{10})\/v[0-9]+\/[0-9]+(?:@2x)?\.(?:webp|jpg)$/;

/** The service an image came from, if it is one of this map's static images. */
export function serviceOf(img: HTMLImageElement): string | null {
    const src = img.getAttribute('src');

    if (!src) {
        return null;
    }

    try {
        const url = new URL(src, img.ownerDocument.baseURI);

        return IMAGE_PATH.exec(url.pathname)?.[1] === img.dataset.hashid ? url.origin : null;
    } catch {
        return null;
    }
}

/**
 * Turns every `img.awkw-maps-embed` with a `data-hashid` into an interactive map on click.
 * Safe to call again after adding images: an image is set up once.
 */
export function init({ mapsBase, root = document }: InitOptions = {}): void {
    root.querySelectorAll<HTMLImageElement>('img.awkw-maps-embed').forEach((img) => {
        if (img.dataset.awkwMaps === 'ready') {
            return;
        }

        if (!img.dataset.hashid) {
            console.warn('[awkw-maps] <img> missing data-hashid, skipping:', img);
            return;
        }

        img.dataset.awkwMaps = 'ready';
        new EmbedMap(img, (mapsBase ?? serviceOf(img) ?? DEFAULT_MAPS_BASE).replace(/\/$/, ''));
    });
}
