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

export function revealIframe(iframe: HTMLIFrameElement, onComplete: () => void): void {
    if (stillness()) {
        iframe.style.transition = '';
        iframe.style.opacity = '1';
        onComplete();
        return;
    }

    iframe.style.transition = 'opacity 0.25s ease';
    // rAF ensures the transition property is committed before opacity changes,
    // so the browser sees a genuine before→after state to animate
    requestAnimationFrame(() => {
        iframe.style.opacity = '1';
        // Fallback timer in case transitionend doesn't fire (display:none parent, etc.)
        const fallback = setTimeout(onComplete, 400);
        iframe.addEventListener('transitionend', () => {
            clearTimeout(fallback);
            onComplete();
        }, { once: true });
    });
}
