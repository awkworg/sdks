import { EmbedBase } from '@awkw/embed-core';

export { EmbedState } from '@awkw/embed-core';

/** How long the image service has to say whether it has the picture. */
const ASK_FOR_MS = 3000;

export class EmbedIiif extends EmbedBase {
    private readonly viewerBase: string;

    constructor(img: HTMLImageElement, viewerBase: string) {
        super(img);
        this.viewerBase = viewerBase;
    }

    protected readIdentifier(img: HTMLImageElement): string {
        return img.dataset.identifier ?? '';
    }

    // w/h unused — OpenSeaDragon manages its own viewport sizing
    protected buildIframeUrl(_w: number, _h: number): string {
        return `${this.viewerBase}/${this.identifier}/embed`;
    }

    /**
     * Whether the image service has the picture to show: its info.json, which answers 403
     * for one unknown or private. Anything else, a failure to ask included, counts as yes,
     * so the embed never refuses a picture it merely couldn't check.
     */
    protected async available(): Promise<boolean> {
        /* A slow answer counts as one it couldn't get, so the viewer isn't held for it: a timer, which every browser has, rather than AbortSignal.timeout(). */
        const giveUp = new AbortController();
        const timer = setTimeout(() => giveUp.abort(), ASK_FOR_MS);

        try {
            const answer = await fetch(`${this.viewerBase}/${this.identifier}/info.json`, {
                signal: giveUp.signal,
            });

            return ![401, 403, 404, 410].includes(answer.status);
        } catch {
            return true;
        } finally {
            clearTimeout(timer);
        }
    }

    /** Takes the embed away, and the mark init() set, so init() would set it up afresh. */
    destroy(): void {
        super.destroy();
        delete this.img.dataset.awkwIiif;
    }

    protected get eventNamespace(): string { return 'awkw-iiif'; }
    protected ariaLabelNoun(): string { return 'Image'; }
    protected get iframeTitle(): string { return this.img.alt || 'Interactive Image Viewer'; }
}
