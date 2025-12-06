import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Occludable } from "../extensions/Occludable";

/**
 * Furniture types for different visual appearances
 * Note: "lamp" is now a separate entity type (Lamp.ts) with interactivity and glow
 */
export type FurnitureType = "shelf" | "desk" | "crate" | "serverRack" | "custom";

/**
 * Sprite keys for furniture that have actual sprites loaded
 * Add entries here when you have sprites for furniture types
 */
const FURNITURE_SPRITES: Partial<Record<FurnitureType, string>> = {
  // Example: desk: "sprite-desk",
};

export interface FurnitureConfig {
  type: FurnitureType;
  /** Visual width (collision can be separate) */
  width?: number;
  /** Visual height */
  height?: number;
  /** Color tint (for placeholder rectangles) */
  color?: number;
  /** 
   * Y offset for depth sorting. 
   * Negative = player walks behind more easily
   * Positive = player needs to be lower to walk behind
   */
  sortYOffset?: number;
  /** Scale for sprite (default 1) */
  scale?: number;
  /** Custom sprite key (for "custom" type) */
  spriteKey?: string;
}

/**
 * Furniture entity - static objects that the player can walk behind
 * 
 * Uses the Occludable extension for depth sorting.
 * Some furniture types have actual sprites, others use placeholder rectangles.
 */
export class Furniture extends Entity {
  public width: number;
  public height: number;
  public furnitureType: FurnitureType;
  public color: number;
  public sortYOffset: number;
  public scale: number;
  public spriteKey?: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: FurnitureConfig
  ) {
    super(scene);
    this.x = x;
    this.y = y;
    this.furnitureType = config.type;
    this.scale = config.scale ?? this.getDefaultScale(config.type);
    this.width = config.width ?? this.getDefaultWidth(config.type);
    this.height = config.height ?? this.getDefaultHeight(config.type);
    this.color = config.color ?? this.getDefaultColor(config.type);
    this.sortYOffset = config.sortYOffset ?? this.getDefaultSortOffset(config.type);
    this.spriteKey = config.spriteKey;
    
    this.createSprite();
    this.setupExtensions();
  }

  /**
   * Static method to preload furniture sprites
   * Call this in the scene's preload method
   */
  static preload(_scene: Phaser.Scene): void {
    // Add furniture sprite loading here when sprites are available
    // Example: scene.load.image("sprite-desk", "/assets/sprite-desk.png");
  }

  private getDefaultScale(_type: FurnitureType): number {
    return 1;
  }

  private getDefaultWidth(type: FurnitureType): number {
    switch (type) {
      case "shelf": return 120;
      case "desk": return 150;
      case "crate": return 60;
      case "serverRack": return 100;
      default: return 80;
    }
  }

  private getDefaultHeight(type: FurnitureType): number {
    switch (type) {
      case "shelf": return 180;
      case "desk": return 80;
      case "crate": return 60;
      case "serverRack": return 200;
      default: return 100;
    }
  }

  private getDefaultColor(type: FurnitureType): number {
    switch (type) {
      case "shelf": return 0x8b4513; // Brown
      case "desk": return 0x654321; // Dark brown
      case "crate": return 0xd2691e; // Orange brown
      case "serverRack": return 0x2f2f2f; // Dark gray
      default: return 0x808080;
    }
  }

  private getDefaultSortOffset(type: FurnitureType): number {
    // The sort point determines where in the Y axis the object is "standing"
    // For sprites with origin at bottom, we want the sort point near the bottom
    switch (type) {
      case "shelf": return this.height / 2 - 30;
      case "desk": return this.height / 2 - 10;
      case "crate": return this.height / 2;
      case "serverRack": return this.height / 2 - 40;
      default: return this.height / 2;
    }
  }

  createSprite(): void {
    // Check if this furniture type has an actual sprite
    const spriteKey = this.spriteKey ?? FURNITURE_SPRITES[this.furnitureType];
    
    if (spriteKey && this.scene.textures.exists(spriteKey)) {
      // Use actual sprite
      const sprite = this.scene.add.sprite(this.x, this.y, spriteKey);
      sprite.setScale(this.scale);
      sprite.setOrigin(0.5, 1); // Bottom-center origin
      
      // Update dimensions based on actual sprite size
      this.width = sprite.displayWidth;
      this.height = sprite.displayHeight;
      
      this.sprite = sprite;
    } else {
      // Fallback to colored rectangle placeholder
      const rect = this.scene.add.rectangle(
        this.x,
        this.y,
        this.width,
        this.height,
        this.color,
        0.8
      );
      
      // Add subtle border
      rect.setStrokeStyle(2, 0x000000, 0.5);
      
      // Set origin to bottom-center for better placement
      rect.setOrigin(0.5, 1);
      
      this.sprite = rect;
    }
  }

  private setupExtensions(): void {
    // Add occludable extension for depth sorting
    this.addExtension(
      new Occludable({
        sortYOffset: this.sortYOffset,
        baseDepth: 0,
      })
    );
  }

  /**
   * Update position (also updates depth via Occludable extension)
   */
  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    if (this.sprite && "setPosition" in this.sprite) {
      (this.sprite as Phaser.GameObjects.Sprite).setPosition(x, y);
    }
    return this;
  }
}
