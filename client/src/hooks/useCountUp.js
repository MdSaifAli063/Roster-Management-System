import { useEffect, useState } from 'react';

export function useCountUp(target, duration = 800, active = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const end = Number(target) || 0;
    if (end === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, active]);

  return value;
}
