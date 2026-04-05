import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp — Animasi angka naik dari 0 ke target
 * 
 * Contoh Penggunaan:
 *   const animatedValue = useCountUp(100); // akan animasi dari 0 → 100
 * 
 * @param {number} target - angka tujuan
 * @param {number} duration - durasi animasi (ms), default 800
 */
export function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target == null || isNaN(target)) {
      setCount(0);
      return;
    }

    const startValue = prevTarget.current !== target ? 0 : count;
    prevTarget.current = target;

    const startTime = performance.now();
    let rafId;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo for smooth deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

export default useCountUp;
