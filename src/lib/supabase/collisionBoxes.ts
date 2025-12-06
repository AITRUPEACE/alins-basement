import { supabase } from "./client";

export interface CollisionBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollisionBoxesRecord {
  id?: number;
  level_name: string;
  boxes: CollisionBox[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Load collision boxes for a level
 * Returns { boxes, exists } where exists indicates if a record was found
 */
export async function loadCollisionBoxes(levelName = "level1"): Promise<{ boxes: CollisionBox[]; exists: boolean }> {
  if (!supabase) {
    console.warn("Supabase not configured - using default collision boxes");
    return { boxes: [], exists: false };
  }

  const { data, error } = await supabase
    .from("collision_boxes")
    .select("boxes")
    .eq("level_name", levelName)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - level doesn't exist yet
      console.log(`No collision boxes found for ${levelName}, using defaults`);
      return { boxes: [], exists: false };
    }
    console.error("Error loading collision boxes:", error.message);
    return { boxes: [], exists: false };
  }

  // Record exists - return boxes (even if empty array)
  return { boxes: (data?.boxes as CollisionBox[]) || [], exists: true };
}

/**
 * Save collision boxes for a level (upsert)
 */
export async function saveCollisionBoxes(
  boxes: CollisionBox[],
  levelName = "level1"
): Promise<boolean> {
  if (!supabase) {
    console.warn("Supabase not configured - cannot save collision boxes");
    return false;
  }

  const { error } = await supabase
    .from("collision_boxes")
    .upsert(
      {
        level_name: levelName,
        boxes: boxes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level_name" }
    );

  if (error) {
    console.error("Error saving collision boxes:", error.message);
    return false;
  }

  console.log(`Saved ${boxes.length} collision boxes for ${levelName}`);
  return true;
}

