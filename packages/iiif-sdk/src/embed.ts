import { EmbedBase } from '@awkw/embed-core';

export { EmbedState } from '@awkw/embed-core';

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
        try {
            /* A slow answer counts as one it couldn't get, so the viewer isn't held for it. */
            const answer = await fetch(`${this.viewerBase}/${this.identifier}/info.json`, {
                signal: AbortSignal.timeout(3000),
            });

            return ![401, 403, 404, 410].includes(answer.status);
        } catch {
            return true;
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
