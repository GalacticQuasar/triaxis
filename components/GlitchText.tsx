'use client';

import { useState, useEffect, useRef } from 'react';

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#$%&@';

export default function GlitchText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState('');
  const frameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const len = text.length;
    const perCharMs = 35;
    const totalMs = perCharMs * len;
    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;

      const resolvedCount = Math.floor(elapsed / perCharMs);

      let out = '';
      for (let i = 0; i < len; i++) {
        if (i < resolvedCount) {
          out += text[i];
        } else {
          out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
      }
      setDisplay(out);

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      // Reset frame ref marker for cleanliness
      frameRef.current = 0;
    };
  }, [text]);

  return <span className={className}>{display}</span>;
}