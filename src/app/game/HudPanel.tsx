'use client';

import { useGameStore } from "@/lib/state/gameStore";
import { motion } from "framer-motion";

const Bar = ({
  label,
  value,
  max,
  color,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = pct < 30;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-[#8b7355]">
          <span>{icon}</span>
          {label}
        </span>
        <span className={isLow ? "text-red-400 font-bold" : "text-[#c9a959]"}>
          {Math.round(value)}/{max}
        </span>
      </div>
      <div 
        className="h-4 rounded overflow-hidden"
        style={{
          background: "#1a1410",
          border: "2px solid #3a2618",
        }}
      >
        <motion.div
          className={`h-full ${color}`}
          initial={false}
          animate={{ 
            width: `${pct}%`,
            opacity: isLow ? [1, 0.6, 1] : 1,
          }}
          transition={{ 
            width: { duration: 0.3 },
            opacity: { duration: 0.5, repeat: isLow ? Infinity : 0 },
          }}
        />
      </div>
    </div>
  );
};

export function HudPanel() {
  const { health, sanity, stamina, score, mission, gameState } = useGameStore();

  return (
    <div 
      className="rounded-lg p-4 shadow-xl space-y-4"
      style={{
        background: "linear-gradient(135deg, #1a1410 0%, #12161e 100%)",
        border: "2px solid #3a2618",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: "#c9a959" }}
        >
          Status Monitor
        </h2>
        <span 
          className="rounded px-2 py-1 text-xs uppercase tracking-wide font-mono"
          style={{
            background: gameState === "playing" ? "#2ecc71" : "#3a2618",
            color: gameState === "playing" ? "#0a1a08" : "#8b7355",
          }}
        >
          {gameState}
        </span>
      </div>

      {/* Status Bars */}
      <div className="grid gap-3 md:grid-cols-3">
        <Bar label="Health" value={health} max={5} color="bg-red-500" icon="❤️" />
        <Bar label="Sanity" value={sanity} max={100} color="bg-purple-500" icon="🧠" />
        <Bar label="Stamina" value={stamina} max={100} color="bg-yellow-500" icon="⚡" />
      </div>

      {/* Mission & Score */}
      <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-[#3a2618]">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#66fcf1] mb-1">
            Current Objective
          </div>
          <div 
            className="font-bold text-sm"
            style={{ color: "#c9a959" }}
          >
            {mission}
          </div>
        </div>
        <div className="text-right md:text-left">
          <div className="text-xs uppercase tracking-wider text-[#66fcf1] mb-1">
            Score
          </div>
          <div 
            className="font-mono text-2xl font-bold"
            style={{ 
              color: "#c9a959",
              textShadow: "0 0 10px rgba(201,169,89,0.3)",
            }}
          >
            {score.toString().padStart(6, "0")}
          </div>
        </div>
      </div>

      {/* Hotbar Mockup */}
      <div className="flex justify-center gap-1.5 pt-2 border-t border-[#3a2618]">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
          <div
            key={slot}
            className="relative w-10 h-10 rounded flex items-center justify-center text-sm"
            style={{
              background: slot === 1 ? "#3a2618" : "#1a1410",
              border: `2px solid ${slot === 1 ? "#c9a959" : "#3a2618"}`,
            }}
          >
            <span className="absolute top-0.5 left-1 text-[9px] text-[#8b7355]">
              {slot}
            </span>
            {slot === 1 && <span>🖥</span>}
            {slot === 2 && <span className="opacity-50">🗑</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
