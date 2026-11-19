import { blurImage, revealIframe, unblurImage } from './transition';

export type EmbedState =
    | 'idle'
    | 'hovering'
    | 'loading'
    | 'transitioning'
    | 'interactive'
    | 'unavailable';

/* The notice on a picture that can't be shown: nothing, until it says so across the image's foot. */
const NOTICE_QUIET = 'position:absolute;inset:auto 0 0 0;margin:0;';
const NOTICE_SAID = `${NOTICE_QUIET}padding:8px 12px;background:rgb(0 0 0/0.6);color:#fff;font:14px/1.4 sans-serif;`;

export abstract class EmbedBase {
    // --- Abstract contract ---
    protected abstract readIdentifier(img: HTMLImageElement): string;
    protected abstract buildIframeUrl(w: number, h: number): string;
    protected abstract get eventNamespace(): string;
    protected abstract ariaLabelNoun(): string;
    protected abstract get iframeTitle(): string;

    /**
     * Whether the viewer has anything to show: a subclass asks its server, so an unknown or
     * private item never opens as an empty viewer. Anything it can't tell counts as yes.
     */
    protected available(): Promise<boolean> {
        return Promise.resolve(true);
    }

    // --- Protected, accessible to subclasses ---
    protected readonly img: HTMLImageElement;
    protected readonly identifier: string;

    // --- Private state ---
    private _state: EmbedState = 'idle';
    private wrapper: HTMLDivElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private closer: HTMLButtonElement | null = null;
    private notice: HTMLParagraphElement | null = null;
    private iframeLoaded = false;
    private checked: Promise<boolean> | null = null;
    /** The fade under way, to stop if the viewer is closed or taken away first. */
    private stopReveal: (() => void) | null = null;
    /** Every listener the embed adds, so destroy() takes them all away. */
    private readonly listening = new AbortController();
    /** What the embed changed on the image, put back by destroy(). */
    private readonly original: {
        cssText: string;
        tabindex: string | null;
        role: string | null;
        label: string | null;
    };

    get currentState(): EmbedState { return this._state; }

    /** Whether destroy() has taken the embed away. */
    get destroyed(): boolean { return this.listening.signal.aborted; }

    constructor(img: HTMLImageElement) {
        this.img = img;
        this.identifier = this.readIdentifier(img);
        this.original = {
            cssText: img.style.cssText,
            tabindex: img.getAttribute('tabindex'),
            role: img.getAttribute('role'),
            label: img.getAttribute('aria-label'),
        };

        if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', this.label());
        img.style.cursor = 'pointer';

        const signal = this.listening.signal;

        img.addEventListener('mouseenter', () => this.onHover(), { passive: true, signal });
        img.addEventListener('focus', () => this.onHover(), { passive: true, signal });
        img.addEventListener('click', () => this.onActivate(), { signal });
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.onActivate();
            }
        }, { signal });
    }

    /** Closes the viewer and shows the image again, which opens it again on the next click. */
    close(): void {
        if (this._state === 'idle' || this._state === 'hovering' || this._state === 'unavailable') return;

        this.stopReveal?.();
        this.stopReveal = null;

        if (this.iframe) {
            this.iframe.style.transition = '';
            this.iframe.style.opacity = '0';
            this.iframe.style.pointerEvents = 'none';
        }

        if (this.closer) this.closer.hidden = true;
        this.img.style.display = '';
        unblurImage(this.img);
        this.img.setAttribute('aria-label', this.label());
        /* Focused while still open, so taking focus doesn't start it loading again; then idle. */
        this.img.focus();
        this.setState('idle');
    }

    /**
     * Takes the embed away: the viewer, its wrapper and every listener go, and the image is
     * as it was before the embed found it.
     */
    destroy(): void {
        this.listening.abort();
        this.stopReveal?.();
        this.stopReveal = null;

        if (this.wrapper) {
            this.wrapper.parentNode?.insertBefore(this.img, this.wrapper);
            this.wrapper.remove();
        }

        this.wrapper = null;
        this.iframe = null;
        this.closer = null;
        this.notice = null;
        this.img.style.cssText = this.original.cssText;
        this.restore('tabindex', this.original.tabindex);
        this.restore('role', this.original.role);
        this.restore('aria-label', this.original.label);
        this._state = 'idle';
    }

    private restore(name: string, value: string | null): void {
        if (value === null) {
            this.img.removeAttribute(name);
        } else {
            this.img.setAttribute(name, value);
        }
    }

    private label(): string {
        return `${this.img.alt || this.ariaLabelNoun()} — click to interact`;
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
        /* Once it is opening, a second press waits for it rather than opening it twice. */
        if (this._state === 'interactive' || this._state === 'transitioning' || this._state === 'loading') return;
        if (this._state === 'idle' || this._state === 'unavailable') {
            this.setState('hovering');
            this.prepare();
        }
        this.activate();
    }

    private prepare(): void {
        this.wrapImg();
        this.insertIframe();
        this.checked ??= this.available().catch(() => true);

        if (this.notice) {
            this.notice.textContent = '';
            this.notice.style.cssText = NOTICE_QUIET;
        }
    }

    private wrapImg(): void {
        if (this.wrapper) return;

        const rect = this.img.getBoundingClientRect();
        const w = Math.round(rect.width) || this.img.width || 800;
        const h = Math.round(rect.height) || this.img.height || 450;

        const wrapper = document.createElement('div');
        wrapper.className = 'awkw-embed-wrap';
        /* The image's size when first reached, narrower with a narrower page, and its shape always. */
        wrapper.style.cssText = `position:relative;display:inline-block;width:${w}px;max-width:100%;aspect-ratio:${w} / ${h};overflow:hidden;line-height:0;`;

        this.img.parentNode!.insertBefore(wrapper, this.img);
        wrapper.appendChild(this.img);
        this.img.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';

        this.wrapper = wrapper;
    }

    private insertIframe(): void {
        if (this.iframe || !this.wrapper) return;

        /* Its controls once; a frame anew whenever there is none, after one that had nothing to show. */
        if (!this.closer) this.insertControls(this.wrapper);

        const rect = this.wrapper.getBoundingClientRect();
        const w = Math.round(rect.width) || parseInt(this.wrapper.style.width) || 800;
        const h = Math.round(rect.height) || 450;

        const iframe = document.createElement('iframe');
        iframe.src = this.buildIframeUrl(w, h);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('title', this.iframeTitle);
        // pointer-events:none prevents the hidden iframe from stealing clicks from the img
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;pointer-events:none;';

        // Track load state ourselves — can't use contentDocument.readyState cross-origin,
        // and the load event may fire before activate() is called (prewarmed on hover)
        iframe.addEventListener('load', () => { this.iframeLoaded = true; }, { once: true, signal: this.listening.signal });

        this.iframeLoaded = false;
        this.wrapper.insertBefore(iframe, this.closer);
        this.iframe = iframe;
    }

    private insertControls(wrapper: HTMLDivElement): void {
        /* A way back to the image, shown once the viewer is open. */
        const closer = document.createElement('button');
        closer.type = 'button';
        closer.className = 'awkw-embed-close';
        closer.textContent = '×';
        closer.setAttribute('aria-label', 'Close the viewer');
        closer.hidden = true;
        closer.style.cssText = 'position:absolute;top:8px;right:8px;z-index:1;width:32px;height:32px;border:0;border-radius:16px;background:rgb(0 0 0/0.6);color:#fff;font:20px/32px sans-serif;cursor:pointer;';
        closer.addEventListener('click', () => this.close(), { signal: this.listening.signal });

        /* In the page from the start, empty and taking no room, and filled only when there is something to say: a status region a screen reader already knows announces the change. */
        const notice = document.createElement('p');
        notice.className = 'awkw-embed-unavailable';
        notice.setAttribute('role', 'status');
        notice.style.cssText = NOTICE_QUIET;

        wrapper.appendChild(closer);
        wrapper.appendChild(notice);
        this.closer = closer;
        this.notice = notice;
    }

    private activate(): void {
        this.setState('loading');
        blurImage(this.img);

        const reveal = () => {
            if (!this.iframe || this._state !== 'loading') return;
            this.setState('transitioning');
            this.iframe.style.pointerEvents = 'auto';
            this.stopReveal = revealIframe(this.iframe, () => {
                this.stopReveal = null;
                this.img.style.display = 'none';
                if (this.closer) this.closer.hidden = false;
                this.setState('interactive');
                this.img.removeAttribute('aria-label');
                /* The visitor's next keys go to the viewer they opened. */
                this.iframe?.focus();
            });
        };

        const loaded = () => {
            if (this.iframeLoaded) {
                reveal();
            } else {
                this.iframe?.addEventListener('load', reveal, { once: true, signal: this.listening.signal });
            }
        };

        void (this.checked ?? Promise.resolve(true)).then((available) => {
            if (this._state !== 'loading') return;

            if (available) {
                loaded();
            } else {
                this.unavailable();
            }
        });
    }

    /* Nothing to show: the image stays, unblurred, saying so, rather than opening an empty viewer. */
    private unavailable(): void {
        unblurImage(this.img);
        /* Asked afresh on the next click, it may have been made public since: and its frame, loaded while it wasn't, is made anew then. */
        this.checked = null;
        this.iframe?.remove();
        this.iframe = null;
        this.iframeLoaded = false;

        if (this.notice) {
            this.notice.style.cssText = NOTICE_SAID;
            this.notice.textContent = 'This image can’t be opened.';
        }

        this.img.setAttribute('aria-label', `${this.img.alt || this.ariaLabelNoun()} — can’t be opened`);
        this.setState('unavailable');
    }
}
