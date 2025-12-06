import * as Phaser from "phaser";
import type { Entity } from "../entities/Entity";
import type { Extension } from "./types";
import { ExtensionNames } from "./types";

/**
 * Configuration for controllable entities
 */
export interface ControllableConfig {
  /** Base movement speed */
  speed: number;
  /** Sprint multiplier */
  sprintMultiplier?: number;
  /** Walk animation key */
  walkAnimKey?: string;
  /** Idle animation key */
  idleAnimKey?: string;
  /** Callback when control is taken */
  onTakeControl?: (entity: Entity) => void;
  /** Callback when control is released */
  onReleaseControl?: (entity: Entity) => void;
}

/**
 * Controllable extension - allows an entity to be controlled with WASD
 * 
 * When isControlled is true, this entity responds to keyboard input
 * and moves around the world.
 */
export class Controllable implements Extension {
  public static readonly Name = ExtensionNames.controllable;
  
  private entity: Entity | null = null;
  private config: ControllableConfig;
  private _isControlled: boolean = false;
  
  public speed: number;
  public sprintMultiplier: number;
  public walkAnimKey: string;
  public idleAnimKey: string;
  
  /** Current velocity */
  public vx: number = 0;
  public vy: number = 0;

  constructor(config: ControllableConfig) {
    this.config = config;
    this.speed = config.speed;
    this.sprintMultiplier = config.sprintMultiplier ?? 1.5;
    this.walkAnimKey = config.walkAnimKey ?? "walk";
    this.idleAnimKey = config.idleAnimKey ?? "idle";
  }

  onAttach(entity: Entity): void {
    this.entity = entity;
  }

  onDetach(): void {
    this.entity = null;
  }

  /**
   * Check if this entity is currently being controlled
   */
  get isControlled(): boolean {
    return this._isControlled;
  }

  /**
   * Take control of this entity
   */
  takeControl(): void {
    if (this._isControlled) return;
    this._isControlled = true;
    if (this.entity) {
      this.config.onTakeControl?.(this.entity);
    }
  }

  /**
   * Release control of this entity
   */
  releaseControl(): void {
    if (!this._isControlled) return;
    this._isControlled = false;
    this.vx = 0;
    this.vy = 0;
    
    // Stop the sprite
    if (this.entity?.sprite && "setVelocity" in this.entity.sprite) {
      (this.entity.sprite as Phaser.Physics.Arcade.Sprite).setVelocity(0, 0);
    }
    
    // Play idle animation
    if (this.entity?.sprite && "play" in this.entity.sprite) {
      const sprite = this.entity.sprite as Phaser.Physics.Arcade.Sprite;
      if (sprite.anims?.exists(this.idleAnimKey)) {
        sprite.play(this.idleAnimKey);
      }
    }
    
    if (this.entity) {
      this.config.onReleaseControl?.(this.entity);
    }
  }

  /**
   * Handle movement input
   * Call this from the scene update with keyboard state
   */
  handleInput(
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    sprint: boolean
  ): void {
    if (!this._isControlled || !this.entity?.sprite) return;
    
    const sprite = this.entity.sprite as Phaser.Physics.Arcade.Sprite;
    
    // Calculate velocity
    let speed = this.speed;
    if (sprint) {
      speed *= this.sprintMultiplier;
    }

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Normalize diagonal movement
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }

    this.vx = vx;
    this.vy = vy;

    // Apply velocity to sprite
    if ("setVelocity" in sprite) {
      sprite.setVelocity(vx, vy);
    }

    // Flip sprite based on direction
    if (vx < 0) sprite.setFlipX(true);
    else if (vx > 0) sprite.setFlipX(false);

    // Update entity position
    this.entity.x = sprite.x;
    this.entity.y = sprite.y;

    // Play animations
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      if (sprite.anims?.exists(this.walkAnimKey) && 
          sprite.anims.currentAnim?.key !== this.walkAnimKey) {
        sprite.play(this.walkAnimKey);
      }
    } else {
      if (sprite.anims?.exists(this.idleAnimKey)) {
        sprite.play(this.idleAnimKey);
      } else {
        sprite.stop();
      }
    }
  }

  /**
   * Update depth for occlusion
   */
  updateDepth(yOffset: number = 0): void {
    if (!this.entity?.sprite) return;
    const sprite = this.entity.sprite as Phaser.Physics.Arcade.Sprite;
    const sortY = sprite.y + (sprite.displayHeight / 2) + yOffset;
    sprite.setDepth(sortY);
  }

  serialize() {
    return {
      speed: this.speed,
      sprintMultiplier: this.sprintMultiplier,
      isControlled: this._isControlled,
    };
  }

  deserialize(data: { speed: number; sprintMultiplier: number; isControlled: boolean }): void {
    this.speed = data.speed;
    this.sprintMultiplier = data.sprintMultiplier;
    this._isControlled = data.isControlled;
  }
}

