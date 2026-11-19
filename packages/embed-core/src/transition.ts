/** Whether the visitor asked for less motion: then nothing blurs or fades, it simply changes. */
function stillness(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function blurImage(img: HTMLImageElement): void {
    if (stillness()) {
        img.style.transition = '';
        img.style.filter = 'blur(8px)';
        return;
    }

    img.style.transition = 'filter 0.3s ease, transform 0.3s ease';
    img.style.filter = 'blur(8px)';
    img.style.transform = 'scale(1.02)';
}

export function unblurImage(img: HTMLImageElement): void {
    img.style.transition = '';
    img.style.filter = '';
    img.style.transform = '';
}

/**
 * Fades the viewer in, then calls onComplete once. Returns a cancel, which a viewer closed
 * or taken away mid-fade calls: its frame, timer and listener go, so this fade can neither
 * show the viewer nor finish a later one.
 */
export function revealIframe(iframe: HTMLIFrameElement, onComplete: () => void): () => void {
    let over = false;
    let frame = 0;
    let fallback: ReturnType<typeof setTimeout> | undefined;

    const onEnd = () => finish();
    const stop = () => {
        over = true;
        cancelAnimationFrame(frame);
        clearTimeout(fallback);
        iframe.removeEventListener('transitionend', onEnd);
    };
    const finish = () => {
        if (over) return;
        stop();
        onComplete();
    };

    if (stillness()) {
        iframe.style.transition = '';
        iframe.style.opacity = '1';
        finish();
        return stop;
    }

    iframe.style.transition = 'opacity 0.25s ease';
    // rAF ensures the transition property is committed before opacity changes,
    // so the browser sees a genuine before→after state to animate
    frame = requestAnimationFrame(() => {
        if (over) return;
        iframe.style.opacity = '1';
        // Fallback timer in case transitionend doesn't fire (display:none parent, etc.)
        fallback = setTimeout(finish, 400);
        iframe.addEventListener('transitionend', onEnd, { once: true });
    });

    return stop;
}
