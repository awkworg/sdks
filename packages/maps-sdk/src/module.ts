import { EmbedMap } from './embed';

/** The maps service, whose map pages are at {base}/{hashid}. */
export const DEFAULT_MAPS_BASE = 'https://maps.awkw.org';

export type InitOptions = {
    /**
     * Where the maps service is; defaults to maps.awkw.org. Only the site names it: never an
     * image's own src, since whoever can put an image on a page could then choose what it frames.
     */
    mapsBase?: string;
    /** Where to look for images; defaults to the whole document. */
    root?: ParentNode;
};

/**
 * Turns every `img.awkw-maps-embed` with a `data-hashid` into an interactive map on click.
 * Safe to call again after adding images: an image is set up once.
 */
export function init({ mapsBase, root = document }: InitOptions = {}): void {
    /* An empty base, from an unset setting, falls back as a missing one does. */
    const base = (mapsBase || DEFAULT_MAPS_BASE).replace(/\/$/, '');

    root.querySelectorAll<HTMLImageElement>('img.awkw-maps-embed').forEach((img) => {
        if (img.dataset.awkwMaps === 'ready') {
            return;
        }

        if (!img.dataset.hashid) {
            console.warn('[awkw-maps] <img> missing data-hashid, skipping:', img);
            return;
        }

        img.dataset.awkwMaps = 'ready';
        new EmbedMap(img, base);
    });
}
