export function blurImage(img: HTMLImageElement): void {
    img.style.transition = 'filter 0.3s ease, transform 0.3s ease';
    img.style.filter = 'blur(8px)';
    img.style.transform = 'scale(1.02)';
}

export function revealIframe(iframe: HTMLIFrameElement, onComplete: () => void): void {
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
