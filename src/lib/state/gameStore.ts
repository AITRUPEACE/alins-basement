'use client';

import { create } from "zustand";

const MAX_HEALTH = 5;
const MAX_SANITY = 100;
const MAX_STAMINA = 100;

type Phase = "menu" | "playing" | "gameover" | "won";

type GameStore = {
  health: number;
  sanity: number;
  stamina: number;
  score: number;
  mission: string;
  gameState: Phase;
  message: string | null;
  setGameState: (phase: Phase) => void;
  adjustSanity: (delta: number) => number;
  adjustStamina: (delta: number) => number;
  addScore: (delta: number) => void;
  setMission: (mission: string) => void;
  setMessage: (message: string | null) => void;
  reset: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const useGameStore = create<GameStore>((set, get) => ({
  health: MAX_HEALTH,
  sanity: MAX_SANITY,
  stamina: MAX_STAMINA,
  score: 0,
  mission: "Boot up the main server",
  gameState: "menu",
  message: null,

  setGameState: (phase) => set({ gameState: phase }),

  adjustSanity: (delta) => {
    const sanity = clamp(get().sanity + delta, 0, MAX_SANITY);
    set({ sanity });
    if (sanity <= 0) {
      set({ gameState: "gameover" });
    }
    return sanity;
  },

  adjustStamina: (delta) => {
    const stamina = clamp(get().stamina + delta, 0, MAX_STAMINA);
    set({ stamina });
    return stamina;
  },

  addScore: (delta) => set({ score: Math.max(0, get().score + delta) }),

  setMission: (mission) => set({ mission }),

  setMessage: (message) => set({ message }),

  reset: () =>
    set({
      health: MAX_HEALTH,
      sanity: MAX_SANITY,
      stamina: MAX_STAMINA,
      score: 0,
      mission: "Boot up the main server",
      gameState: "playing",
      message: null,
    }),
}));

