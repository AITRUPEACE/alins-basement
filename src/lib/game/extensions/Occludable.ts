import * as Phaser from "phaser";
import type { Entity } from "../entities/Entity";
import type { Extension } from "./types";
import { ExtensionNames } from "./types";

/**
 * Configuration for occludable objects
 */
export interface OccludableConfig {
  /** 
   * Y offset from entity position to use as the "foot" position for sorting.
   * Positive values move the sort point down (makes object appear in front sooner).
   * For tall objects like shelves, use a negative value so player can walk behind.
   */
  sortYOffset?: number;
  
  /**
   * Base depth to add to the Y-based depth.
   * Use this for layering (e.g., foreground objects vs background objects).
   */
  baseDepth?: number;
}

/**
 * Occludable extension - enables depth sorting based on Y position
 * 
 * Objects with this extension will be sorted so that objects lower on the screen
 * (higher Y values) appear in front of objects higher on the screen.
 * This creates the illusion that the player can walk behind objects.
 * 
 * How it works:
 * - Each frame, the object's depth is set to its Y position (plus offsets)
 * - Objects with higher Y (lower on screen) get higher depth (render on top)
 * - The player also updates their depth based on their Y position
 */
export class Occludable implements Extension {
  public static readonly Name = ExtensionNames.occludable;
  
  private entity: Entity | null = null;
  private config: OccludableConfig;
  
  /** Y offset for sorting - the "foot" position */
  public sortYOffset: number;
  
  /** Base depth added to Y-based depth */
  public baseDepth: number;

  constructor(config: OccludableConfig = {}) {
    this.config = config;
    this.sortYOffset = config.sortYOffset ?? 0;
    this.baseDepth = config.baseDepth ?? 0;
  }

  onAttach(entity: Entity): void {
    this.entity = entity;
    // Apply initial depth
    this.updateDepth();
  }

  onDetach(): void {
    this.entity = null;
  }

  update(): void {
    this.updateDepth();
  }

  /**
   * Update the entity's depth based on its Y position
   */
  updateDepth(): void {
    if (!this.entity?.sprite) return;
    
    // Calculate depth: Y position + offset + base
    // Higher Y = renders on top of lower Y objects
    const sortY = this.entity.y + this.sortYOffset;
    const depth = sortY + this.baseDepth;
    
    if ("setDepth" in this.entity.sprite) {
      (this.entity.sprite as Phaser.GameObjects.Sprite).setDepth(depth);
    }
  }

  /**
   * Get the current sort Y position (for debugging)
   */
  getSortY(): number {
    if (!this.entity) return 0;
    return this.entity.y + this.sortYOffset;
  }

  serialize() {
    return {
      sortYOffset: this.sortYOffset,
      baseDepth: this.baseDepth,
    };
  }

  deserialize(data: { sortYOffset: number; baseDepth: number }): void {
    this.sortYOffset = data.sortYOffset;
    this.baseDepth = data.baseDepth;
  }
}

/**
 * Helper function to update player depth based on Y position
 * Call this in your scene's update() method
 */
export function updatePlayerDepth(player: Phaser.GameObjects.Sprite, yOffset: number = 0): void {
  // Use the bottom of the player sprite as the sort point
  const playerHeight = player.displayHeight;
  const sortY = player.y + (playerHeight / 2) + yOffset;
  player.setDepth(sortY);
}

