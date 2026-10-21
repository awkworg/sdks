import { blurImage, revealIframe } from './transition';

export type EmbedState = 'idle' | 'hovering' | 'loading' | 'transitioning' | 'interactive';

export abstract class EmbedBase {
    // --- Abstract contract ---
    protected abstract readIdentifier(img: HTMLImageElement): string;
    protected abstract buildIframeUrl(w: number, h: number): string;
    protected abstract get eventNamespace(): string;
    protected abstract ariaLabelNoun(): string;
    protected abstract get iframeTitle(): string;

    // --- Protected, accessible to subclasses ---
    protected readonly img: HTMLImageElement;
    protected readonly identifier: string;

    // --- Private state ---
    private _state: EmbedState = 'idle';
    private wrapper: HTMLDivElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private iframeLoaded = false;

    get currentState(): EmbedState { return this._state; }

    constructor(img: HTMLImageElement) {
        this.img = img;
        this.identifier = this.readIdentifier(img);

        if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `${img.alt || this.ariaLabelNoun()} — click to interact`);
        img.style.cursor = 'pointer';

        img.addEventListener('mouseenter', () => this.onHover(), { passive: true });
        img.addEventListener('focus', () => this.onHover(), { passive: true });
        img.addEventListener('click', () => this.onActivate());
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.onActivate();
            }
        });
    }

    private setState(state: EmbedState): void {
        this._state = state;
        this.img.dispatchEvent(new CustomEvent(`${this.eventNamespace}:statechange`, {
            bubbles: true,
            detail: { state, identifier: this.identifier },
        }));
    }

    private onHover(): void {
        if (this._state !== 'idle') return;
        this.setState('hovering');
        this.prepare();
    }

    private onActivate(): void {
        if (this._state === 'interactive' || this._state === 'transitioning') return;
        if (this._state === 'idle') {
            this.setState('hovering');
            this.prepare();
        }
        this.activate();
    }

    private prepare(): void {
        this.wrapImg();
        this.insertIframe();
    }

    private wrapImg(): void {
        if (this.wrapper) return;

        const rect = this.img.getBoundingClientRect();
        const w = Math.round(rect.width) || this.img.width || 800;
        const h = Math.round(rect.height) || this.img.height || 450;

        const wrapper = document.createElement('div');
        wrapper.className = 'awkw-embed-wrap';
        wrapper.style.cssText = `position:relative;display:inline-block;width:${w}px;height:${h}px;overflow:hidden;line-height:0;`;

        this.img.parentNode!.insertBefore(wrapper, this.img);
        wrapper.appendChild(this.img);
        this.img.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';

        this.wrapper = wrapper;
    }

    private insertIframe(): void {
        if (this.iframe || !this.wrapper) return;

        const rect = this.wrapper.getBoundingClientRect();
        const w = Math.round(rect.width) || parseInt(this.wrapper.style.width) || 800;
        const h = Math.round(rect.height) || parseInt(this.wrapper.style.height) || 450;

        const iframe = document.createElement('iframe');
        iframe.src = this.buildIframeUrl(w, h);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('title', this.iframeTitle);
        // pointer-events:none prevents the hidden iframe from stealing clicks from the img
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;pointer-events:none;';

        // Track load state ourselves — can't use contentDocument.readyState cross-origin,
        // and the load event may fire before activate() is called (prewarmed on hover)
        iframe.addEventListener('load', () => { this.iframeLoaded = true; }, { once: true });

        this.wrapper.appendChild(iframe);
        this.iframe = iframe;
    }

    private activate(): void {
        this.setState('loading');
        blurImage(this.img);

        const reveal = () => {
            if (!this.iframe) return;
            this.setState('transitioning');
            this.iframe.style.pointerEvents = 'auto';
            revealIframe(this.iframe, () => {
                this.img.style.display = 'none';
                this.setState('interactive');
                this.img.removeAttribute('aria-label');
            });
        };

        if (!this.iframe) return;

        if (this.iframeLoaded) {
            reveal();
        } else {
            this.iframe.addEventListener('load', reveal, { once: true });
        }
    }
}
