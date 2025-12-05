'use client';

import { useGameStore } from "@/lib/state/gameStore";
import { motion, AnimatePresence } from "framer-motion";

export function Overlays() {
  const { gameState, setGameState, reset, message, setMessage, score, sanity } = useGameStore();

  const start = () => {
    reset();
    setGameState("playing");
    setMessage(null);
  };

  const restart = () => {
    reset();
    setMessage(null);
  };

  return (
    <>
      {/* Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-none absolute top-6 left-1/2 z-20 -translate-x-1/2"
          >
            <div 
              className="rounded-lg px-5 py-3 text-sm font-bold shadow-xl"
              style={{
                background: "linear-gradient(135deg, #c9a959 0%, #8b7355 100%)",
                color: "#1a1410",
                border: "2px solid #3a2618",
                textShadow: "0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low Sanity Vignette */}
      {gameState === "playing" && sanity < 40 && (
        <div 
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, ${0.3 * (1 - sanity / 40)}) 100%)`,
            animation: sanity < 20 ? "pulse 1s ease-in-out infinite" : undefined,
          }}
        />
      )}

      {/* Start Menu */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{
              background: "radial-gradient(ellipse at center, rgba(26,20,16,0.9) 0%, rgba(0,0,0,0.95) 100%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md mx-4 space-y-5 rounded-lg p-6 text-center"
              style={{
                background: "linear-gradient(180deg, #2a1f18 0%, #1a1410 100%)",
                border: "3px solid #3a2618",
                boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,169,89,0.2)",
              }}
            >
              <h2 
                className="text-3xl font-black tracking-wider"
                style={{
                  color: "#c9a959",
                  textShadow: "2px 2px 0 #3a2618",
                }}
              >
                ALIN&apos;S BASEMENT
              </h2>
              <p className="text-sm text-[#8b7355]">
                Boot the server. Clean the mess. Don&apos;t lose your mind.
              </p>
              
              <div className="text-left text-xs space-y-2 bg-[#12161e]/50 rounded p-3 border border-[#3a2618]">
                <div className="text-[#66fcf1] font-bold uppercase tracking-wider mb-2">Controls</div>
                <div className="grid grid-cols-2 gap-2 text-[#8b7355]">
                  <div><span className="text-[#c9a959]">WASD</span> — Move</div>
                  <div><span className="text-[#c9a959]">SHIFT</span> — Sprint</div>
                  <div><span className="text-[#c9a959]">E</span> — Interact</div>
                  <div><span className="text-[#c9a959]">HOLD E</span> — Boot Server</div>
                </div>
              </div>

              <button
                onClick={start}
                className="w-full rounded-lg px-6 py-3 font-bold text-lg uppercase tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(180deg, #c3073f 0%, #950740 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 0 #5c0320, 0 6px 20px rgba(195,7,63,0.4)",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                Enter Basement
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{
              background: "radial-gradient(ellipse at center, rgba(80,0,0,0.9) 0%, rgba(20,0,0,0.98) 100%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md mx-4 space-y-5 rounded-lg p-6 text-center"
              style={{
                background: "linear-gradient(180deg, #2a1010 0%, #1a0808 100%)",
                border: "3px solid #5c0320",
                boxShadow: "0 0 60px rgba(195,7,63,0.4)",
              }}
            >
              <div className="text-5xl mb-2">🧠💥</div>
              <h2 
                className="text-3xl font-black tracking-wider"
                style={{
                  color: "#ff4444",
                  textShadow: "2px 2px 0 #5c0320",
                }}
              >
                MENTAL BREAKDOWN
              </h2>
              <p className="text-[#8b5555]">
                Alin couldn&apos;t handle the basement anymore.
                <br />
                <span className="text-sm opacity-70">Final Score: {score}</span>
              </p>
              <button
                onClick={start}
                className="w-full rounded-lg px-6 py-3 font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                  background: "#fff",
                  color: "#950740",
                  boxShadow: "0 4px 0 #ccc",
                }}
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Screen */}
      <AnimatePresence>
        {gameState === "won" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,60,30,0.9) 0%, rgba(0,20,10,0.98) 100%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md mx-4 space-y-5 rounded-lg p-6 text-center"
              style={{
                background: "linear-gradient(180deg, #1a2a18 0%, #0a1a08 100%)",
                border: "3px solid #2ecc71",
                boxShadow: "0 0 60px rgba(46,204,113,0.3)",
              }}
            >
              <div className="text-5xl mb-2">🖥️✨</div>
              <h2 
                className="text-3xl font-black tracking-wider"
                style={{
                  color: "#2ecc71",
                  textShadow: "2px 2px 0 #1a4a28",
                }}
              >
                SYSTEM RESTORED
              </h2>
              <p className="text-[#88bb88]">
                Server is online. Basement is clean. You survived.
              </p>
              <div 
                className="text-2xl font-bold py-2 rounded"
                style={{
                  background: "rgba(46,204,113,0.2)",
                  color: "#2ecc71",
                }}
              >
                Score: {score.toString().padStart(6, "0")}
              </div>
              <button
                onClick={restart}
                className="w-full rounded-lg px-6 py-3 font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(180deg, #2ecc71 0%, #27ae60 100%)",
                  color: "#0a1a08",
                  boxShadow: "0 4px 0 #1a6a38",
                }}
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
