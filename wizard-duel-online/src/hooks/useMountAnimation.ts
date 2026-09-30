import { useEffect, useState } from 'react';

/**
 * Replays a short list of class names once on mount so a modal/panel animates
 * in with the reference game's feel.
 */
export const useMountAnimation = (
  classes: string,
  active = true,
  durationMs = 400
) => {
  const [activeClass, setActiveClass] = useState(active ? classes : '');

  useEffect(() => {
    if (!active) {
      setActiveClass('');
      return;
    }
    setActiveClass(classes);
    const timer = setTimeout(() => setActiveClass(''), durationMs);
    return () => clearTimeout(timer);
  }, [classes, active, durationMs]);

  return activeClass;
};