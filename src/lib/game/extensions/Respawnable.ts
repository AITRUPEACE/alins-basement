import type { Entity } from "../entities/Entity";
import type { Extension } from "./types";
import { ExtensionNames } from "./types";

export interface RespawnableConfig {
  /** Respawn delay in milliseconds */
  respawnDelay: number;
  /** Callback when respawned */
  onRespawn?: (entity: Entity) => void;
}

/**
 * Makes an entity respawn after being deactivated
 * Used for things like coffee that come back after a cooldown
 */
export class Respawnable implements Extension {
  public static readonly Name = ExtensionNames.respawnable;
  
  private entity: Entity | null = null;
  private config: RespawnableConfig;
  private respawnTimer: number = 0;
  private isWaitingToRespawn: boolean = false;
  
  public respawnDelay: number;

  constructor(config: RespawnableConfig) {
    this.config = config;
    this.respawnDelay = config.respawnDelay;
  }

  onAttach(entity: Entity): void {
    this.entity = entity;
  }

  onDetach(): void {
    this.entity = null;
  }

  update(delta: number): void {
    if (!this.entity || !this.isWaitingToRespawn) return;

    this.respawnTimer += delta;
    
    if (this.respawnTimer >= this.respawnDelay) {
      this.respawn();
    }
  }

  /**
   * Start the respawn countdown
   */
  startRespawnTimer(): void {
    this.isWaitingToRespawn = true;
    this.respawnTimer = 0;
  }

  /**
   * Immediately respawn the entity
   */
  respawn(): void {
    if (!this.entity) return;
    
    this.entity.active = true;
    this.isWaitingToRespawn = false;
    this.respawnTimer = 0;
    
    // Make sprite visible again if it exists
    if (this.entity.sprite && "setVisible" in this.entity.sprite) {
      (this.entity.sprite as Phaser.GameObjects.Sprite).setVisible(true);
    }
    
    this.config.onRespawn?.(this.entity);
  }

  /**
   * Deactivate entity and start respawn timer
   */
  deactivateAndRespawn(): void {
    if (!this.entity) return;
    
    this.entity.active = false;
    
    // Hide sprite if it exists
    if (this.entity.sprite && "setVisible" in this.entity.sprite) {
      (this.entity.sprite as Phaser.GameObjects.Sprite).setVisible(false);
    }
    
    this.startRespawnTimer();
  }

  /**
   * Get remaining respawn time in ms
   */
  getRemainingTime(): number {
    if (!this.isWaitingToRespawn) return 0;
    return Math.max(0, this.respawnDelay - this.respawnTimer);
  }

  serialize() {
    return {
      respawnDelay: this.respawnDelay,
      isWaitingToRespawn: this.isWaitingToRespawn,
      respawnTimer: this.respawnTimer,
    };
  }

  deserialize(data: { respawnDelay: number; isWaitingToRespawn: boolean; respawnTimer: number }): void {
    this.respawnDelay = data.respawnDelay;
    this.isWaitingToRespawn = data.isWaitingToRespawn;
    this.respawnTimer = data.respawnTimer;
  }
}

