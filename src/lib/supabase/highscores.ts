import { supabase, HighScore } from "./client";

/**
 * Fetch top high scores
 */
export async function getHighScores(limit = 10): Promise<HighScore[]> {
  if (!supabase) {
    console.warn("Supabase not configured - high scores disabled");
    return [];
  }

  const { data, error } = await supabase
    .from("high_scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching high scores:", error.message, error.code, error.details);
    return [];
  }

  return data || [];
}

/**
 * Submit a new high score
 */
export async function submitHighScore(score: Omit<HighScore, "id" | "created_at">): Promise<HighScore | null> {
  if (!supabase) {
    console.warn("Supabase not configured - cannot submit score");
    return null;
  }

  const { data, error } = await supabase
    .from("high_scores")
    .insert([score])
    .select()
    .single();

  if (error) {
    console.error("Error submitting high score:", error.message, error.code, error.details);
    return null;
  }

  return data;
}

/**
 * Check if score qualifies for leaderboard
 */
export async function checkIfHighScore(score: number): Promise<boolean> {
  if (!supabase) return false; // No leaderboard without Supabase

  const { data, error } = await supabase
    .from("high_scores")
    .select("score")
    .order("score", { ascending: false })
    .limit(10);

  if (error || !data) return true; // If error, allow submission
  
  if (data.length < 10) return true; // Less than 10 scores, always qualifies
  
  const lowestTopScore = data[data.length - 1]?.score || 0;
  return score > lowestTopScore;
}

