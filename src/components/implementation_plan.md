# Cinematic Hand-off: Buyer's Phone to 3D Globe

This plan covers the implementation of the scroll-driven transition from the `buyer-to-cloud.mp4` video into the interactive 3D WebGL Globe, executing the seamless "pull back from the clouds" match-cut.

## Proposed Changes

### 1. `src/components/ScrollFilm.tsx`
We will replace the placeholder image sequence logic with a high-performance video scrubber.
- Create an offscreen `<video>` element pointing to `/upscaled-ones/buyer-to-cloud.mp4`.
- Use the existing `requestAnimationFrame` loop and `scrollData` to smoothly interpolate `video.currentTime` from `0` to `6.04s` based on the scroll progress in the video chapter.
- Draw the video frames directly onto the `<canvas>` using `ctx.drawImage` to ensure perfect `object-cover` scaling and avoid any mobile browser video-player quirks.

### 2. `src/app/page.tsx`
We will tune the chapter timings inside the main GSAP `ScrollTrigger` to choreograph the hand-off.
- **Chapter 1 (Video):** Scroll progress `0.0` to `0.5`. The video scrubs from start to finish. At `0.5`, it hits the cloud wipe.
- **Chapter 2 (Globe):** Scroll progress `0.5` to `0.85`. The video canvas instantly fades out, and the `TexturedGlobe` component calculates its internal normalized progress (from `0` to `1` over this window).

### 3. `src/components/TexturedGlobe.tsx`
We will implement the "Stretched Cloud" pull-back animation inside the Three.js canvas.
- **The Stretched Start:** When the globe chapter begins (progress `0`), the Earth mesh will be scaled up aggressively (e.g., `scale={15}`), effectively putting the camera inside the atmosphere geometry.
- **The Cloud Fade:** We will add a pure white spherical mesh (or use Scene Fog) that starts at `opacity=1` (matching the video's white cloud wipe) and fades to `0` over the first 20% of the globe chapter.
- **The Pull-Back:** As scroll progress moves from `0` to `1`, the Earth's scale will smoothly interpolate from `15` down to `1.2`, creating a dramatic zoom-out effect while simultaneously rotating.

## Verification Plan

### Manual Verification
1. I will start the dev server and test scrolling from the top of the page.
2. Ensure the video plays smoothly forward and backward without jitter.
3. Ensure that at exactly progress `0.5`, the screen is white/cloudy, and the transition to the 3D scene is imperceptible.
4. Verify the 3D globe pulls back elegantly into space as scrolling continues.

> [!NOTE]
> Please review this logic. If you are happy with the chapter timings (Video = 0 to 50% of page, Globe = 50% to 85%), click **Proceed** and I will write the code!
