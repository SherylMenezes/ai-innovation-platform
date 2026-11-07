import { useEffect, useRef } from "react";

const FLOAT_PX = 6; // how far it bobs up and down
const SWAY_DEG = 2; // how far it rocks side to side
const TILT_DEG = 12; // max 3D tilt towards the pointer
const EASE = 0.08; // how quickly the tilt follows the pointer (0–1)
const HOP_MS = 600;

// Decorative banner sticker that floats on its own, tilts towards the pointer while it's over
// the banner, and hops when clicked. Animation is driven by requestAnimationFrame and only runs
// while the sticker is on screen; with "reduce motion" on it stays still.
export default function StickerArt({ src, className, baseRotate = 0 }) {
  const ref = useRef(null);
  const hopStart = useRef(0);

  useEffect(() => {
    const img = ref.current;
    if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const banner = img.parentElement;
    const target = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    let frame = 0;
    let visible = true;

    const render = (time) => {
      tilt.x += (target.x - tilt.x) * EASE;
      tilt.y += (target.y - tilt.y) * EASE;

      const seconds = time / 1000;
      const float = Math.sin(seconds * 1.6) * FLOAT_PX;
      const sway = Math.sin(seconds * 0.9) * SWAY_DEG;

      // Hop: a quick rise and squash that settles back over HOP_MS.
      const hop = Math.max(0, 1 - (time - hopStart.current) / HOP_MS);
      const lift = hopStart.current ? Math.sin(hop * Math.PI) * 18 : 0;
      const squash = hopStart.current ? 1 + Math.sin(hop * Math.PI * 2) * 0.05 : 1;

      img.style.transform =
        `perspective(700px) translateY(${(float - lift).toFixed(2)}px) ` +
        `rotate(${(baseRotate + sway).toFixed(2)}deg) ` +
        `rotateX(${tilt.y.toFixed(2)}deg) rotateY(${tilt.x.toFixed(2)}deg) ` +
        `scale(${squash.toFixed(3)}, ${(2 - squash).toFixed(3)})`;

      if (visible) frame = requestAnimationFrame(render);
    };

    const onMove = (e) => {
      const box = img.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) / (banner.clientWidth / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (banner.clientHeight / 2);
      target.x = Math.max(-1, Math.min(1, dx)) * TILT_DEG;
      target.y = Math.max(-1, Math.min(1, -dy)) * TILT_DEG;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    // Stop the loop entirely while the banner is scrolled out of view.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(render);
    });

    banner.addEventListener("pointermove", onMove);
    banner.addEventListener("pointerleave", onLeave);
    observer.observe(img);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      banner.removeEventListener("pointermove", onMove);
      banner.removeEventListener("pointerleave", onLeave);
    };
  }, [baseRotate]);

  return (
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden="true"
      className={`${className} inst-sticker`}
      onClick={() => { hopStart.current = performance.now(); }}
      draggable={false}
    />
  );
}
