'use client';

import { useEffect, useRef, useState } from "react";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<unknown>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamically import Phaser only on the client to avoid SSR "window is not defined"
    (async () => {
      const Phaser = await import("phaser");
      const { createGameConfig } = await import("@/lib/game/config");
      
      if (!containerRef.current || gameRef.current) return;
      
      const config = createGameConfig(containerRef.current);
      gameRef.current = new Phaser.Game(config);
      
      // Hide loading text once game is created
      setIsLoaded(true);
    })();

    return () => {
      if (gameRef.current) {
        (gameRef.current as { destroy: (b: boolean) => void }).destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border-4 border-[#3a2618] bg-[#0a0a0a] shadow-2xl"
      style={{
        aspectRatio: "2 / 1",
        boxShadow: "0 0 40px rgba(102, 252, 241, 0.15), inset 0 0 60px rgba(0,0,0,0.8)"
      }}
    >
      {!isLoaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-lg font-bold text-[#66fcf1] animate-pulse">Loading...</div>
            <div className="text-xs text-[#c5c6c7]/60 mt-1">Entering Alin&apos;s Basement</div>
          </div>
        </div>
      )}
    </div>
  );
}
