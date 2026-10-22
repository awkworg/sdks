import { EmbedIiif } from './embed';

/** The public IIIF viewer, at {base}/{identifier}/embed. */
export const DEFAULT_VIEWER_BASE = 'https://iiif.awkw.org';

export type InitOptions = {
    /** Where the viewer is served; defaults to iiif.awkw.org. */
    viewerBase?: string;
    /** Where to look for images; defaults to the whole document. */
    root?: ParentNode;
};

/**
 * Turns every `img.awkw-iiif-embed` with a `data-identifier` into a deep zoom viewer on
 * click. Safe to call again after adding images: an image is set up once.
 */
export function init({ viewerBase = DEFAULT_VIEWER_BASE, root = document }: InitOptions = {}): void {
    const base = viewerBase.replace(/\/$/, '');

    root.querySelectorAll<HTMLImageElement>('img.awkw-iiif-embed').forEach((img) => {
        if (img.dataset.awkwIiif === 'ready') {
            return;
        }

        if (!img.dataset.identifier) {
            console.warn('[awkw-iiif] <img> missing data-identifier, skipping:', img);
            return;
        }

        img.dataset.awkwIiif = 'ready';
        new EmbedIiif(img, base);
    });
}
