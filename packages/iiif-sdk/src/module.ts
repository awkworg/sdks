import { EmbedIiif } from './embed';

/** The public IIIF viewer, at {base}/{identifier}/embed. */
export const DEFAULT_VIEWER_BASE = 'https://iiif.awkw.org';

export type InitOptions = {
    /** Where the viewer is served; defaults to iiif.awkw.org. */
    viewerBase?: string;
    /** Where to look for images; defaults to the whole document. */
    root?: ParentNode;
};

/** Each image's embed, for embedFor() and destroy(). */
const embeds = new WeakMap<HTMLImageElement, EmbedIiif>();

/**
 * An image's embed, once init() has set it up: `close()` shows the image again,
 * `destroy()` takes the embed away. Nothing for an image init() hasn't reached.
 */
export function embedFor(img: HTMLImageElement): EmbedIiif | null {
    return embeds.get(img) ?? null;
}

/** Takes an image's embed away, so init() would set it up afresh. */
export function destroy(img: HTMLImageElement): void {
    embeds.get(img)?.destroy();
    embeds.delete(img);
    delete img.dataset.awkwIiif;
}

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
        embeds.set(img, new EmbedIiif(img, base));
    });
}
