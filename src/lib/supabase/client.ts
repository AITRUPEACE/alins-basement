import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client only if env vars are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: "alingame",
      },
    })
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// Database types
export interface HighScore {
  id?: number;
  player_name: string;
  score: number;
  sanity_remaining: number;
  time_seconds: number;
  created_at?: string;
}

export interface GameSave {
  id?: string;
  player_name: string;
  score: number;
  sanity: number;
  health: number;
  stamina: number;
  mission: string;
  game_state: string;
  created_at?: string;
  updated_at?: string;
}

