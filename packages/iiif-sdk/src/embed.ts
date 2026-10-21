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

    protected get eventNamespace(): string { return 'awkw-iiif'; }
    protected ariaLabelNoun(): string { return 'Image'; }
    protected get iframeTitle(): string { return this.img.alt || 'Interactive Image Viewer'; }
}
