import { useEffect, useRef, useState } from 'react';

export const useMusicPlayer = (src: string) => {
  const musicRef = useRef<HTMLAudioElement | undefined>(undefined);
  const [isMusicMuted, setIsMusicMuted] = useState(() => {
    const stored = sessionStorage.getItem('isMusicMuted');
    return (stored ? JSON.parse(stored) : false) as boolean;
  });

  useEffect(() => {
    const musicInstance = new Audio(src);
    musicInstance.loop = true;
    musicRef.current = musicInstance;
    return () => {
      musicInstance.pause();
    };
  }, [src]);

  useEffect(() => {
    sessionStorage.setItem('isMusicMuted', JSON.stringify(isMusicMuted));
  }, [isMusicMuted]);

  const playMusic = () => {
    const music = musicRef.current;
    if (music && !isMusicMuted) {
      music.play().catch(() => {
        /* Autoplay may be blocked until first user gesture. */
      });
    }
  };

  const pauseMusic = () => {
    musicRef.current?.pause();
  };

  const toggleMusic = () => {
    const music = musicRef.current;
    if (music) {
      if (music.paused) {
        music.play().catch(() => {});
      } else {
        music.pause();
      }
    }
    setIsMusicMuted(!isMusicMuted);
  };

  return { playMusic, pauseMusic, toggleMusic, isMusicMuted };
};