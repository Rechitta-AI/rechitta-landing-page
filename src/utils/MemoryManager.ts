export function manageMemory(imgs: HTMLImageElement[], currentIndex: number) {
  // 1. Keep a heavily restricted window of 10 frames loaded in memory to prevent Vercel/Netlify network throttling
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const distance = Math.abs(i - currentIndex);
    
    if (distance <= 10) {
      // Load it if it's not loaded
      if (!img.getAttribute('src') && img.dataset.url) {
        img.setAttribute('src', img.dataset.url);
      }
    } else {
      // PURGE IT FROM VRAM if it's too far away
      if (img.getAttribute('src')) {
        img.removeAttribute('src'); 
      }
    }
  }

  // 2. Return the closest loaded frame to draw
  for (let i = currentIndex; i >= 0; i--) {
    if (imgs[i].complete && imgs[i].naturalWidth > 0) {
      return imgs[i];
    }
  }
  return null;
}
