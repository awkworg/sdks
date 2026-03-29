import { EmbedBase } from '@vignage/embed-core';

export { EmbedState } from '@vignage/embed-core';

export class EmbedMap extends EmbedBase {
    private readonly mapsBase: string;

    constructor(img: HTMLImageElement, mapsBase: string) {
        super(img);
        this.mapsBase = mapsBase;
    }

    protected readIdentifier(img: HTMLImageElement): string {
        return img.dataset.hashid ?? '';
    }

    protected buildIframeUrl(w: number, h: number): string {
        return `${this.mapsBase}/${this.identifier}?w=${w}&h=${h}`;
    }

    protected get eventNamespace(): string { return 'vignagemaps'; }
    protected get ariaLabelNoun(): string { return 'Map'; }
    protected get iframeTitle(): string { return this.img.alt || 'Interactive Map'; }
}
