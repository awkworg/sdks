import { EmbedBase } from '@awkw/embed-core';

export { EmbedState } from '@awkw/embed-core';

export class EmbedMap extends EmbedBase {
    private readonly mapsBase: string;

    constructor(img: HTMLImageElement, mapsBase: string) {
        super(img);
        this.mapsBase = mapsBase;
    }

    protected readIdentifier(img: HTMLImageElement): string {
        return img.dataset.hashid ?? '';
    }

    /*
     * The map's own page, which fills whatever frame it is in. No size in the URL: each size
     * would be another copy at the service's edge cache, and another to purge.
     */
    protected buildIframeUrl(_w: number, _h: number): string {
        return `${this.mapsBase}/${encodeURIComponent(this.identifier)}`;
    }

    protected get eventNamespace(): string { return 'awkw-maps'; }
    protected ariaLabelNoun(): string { return 'Map'; }
    protected get iframeTitle(): string { return this.img.alt || 'Interactive Map'; }
}
