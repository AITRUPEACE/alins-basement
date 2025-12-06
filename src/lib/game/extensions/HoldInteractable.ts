import type { Entity } from "../entities/Entity";
import type { Extension } from "./types";
import { ExtensionNames } from "./types";

export interface HoldInteractableConfig {
  /** Text shown in prompt */
  promptText: string;
  /** How long to hold in milliseconds */
  holdDuration: number;
  /** Interaction radius in pixels */
  radius?: number;
  /** Callback when hold is complete */
  onComplete: (entity: Entity) => void;
  /** Callback while holding (with progress 0-1) */
  onProgress?: (entity: Entity, progress: number) => void;
  /** Callback when hold is cancelled */
  onCancel?: (entity: Entity) => void;
  /** Optional condition for interaction to be available */
  canInteract?: () => boolean;
}

/**
 * Makes an entity interactable with hold-to-complete mechanic
 * Used for things like booting servers, hacking terminals, etc.
 */
export class HoldInteractable implements Extension {
  public static readonly Name = ExtensionNames.holdInteractable;
  
  private entity: Entity | null = null;
  private config: HoldInteractableConfig;
  private holdTimer: number = 0;
  private isHolding: boolean = false;
  
  public promptText: string;
  public holdDuration: number;
  public radius: number;
  public enabled: boolean = true;

  constructor(config: HoldInteractableConfig) {
    this.config = config;
    this.promptText = config.promptText;
    this.holdDuration = config.holdDuration;
    this.radius = config.radius ?? 60;
  }

  onAttach(entity: Entity): void {
    this.entity = entity;
  }

  onDetach(): void {
    this.entity = null;
  }

  /**
   * Check if interaction is currently possible
   */
  canInteract(): boolean {
    if (!this.enabled || !this.entity?.active) return false;
    return this.config.canInteract?.() ?? true;
  }

  /**
   * Start holding
   */
  startHold(): void {
    if (!this.canInteract()) return;
    this.isHolding = true;
    this.holdTimer = 0;
  }

  /**
   * Continue holding - call this every frame while key is held
   * Returns true if hold completed
   */
  continueHold(delta: number): boolean {
    if (!this.entity || !this.isHolding || !this.canInteract()) {
      this.cancelHold();
      return false;
    }

    this.holdTimer += delta;
    const progress = Math.min(this.holdTimer / this.holdDuration, 1);
    
    this.config.onProgress?.(this.entity, progress);

    if (this.holdTimer >= this.holdDuration) {
      this.config.onComplete(this.entity);
      this.isHolding = false;
      this.holdTimer = 0;
      return true;
    }

    return false;
  }

  /**
   * Cancel the hold
   */
  cancelHold(): void {
    if (this.isHolding && this.entity) {
      this.config.onCancel?.(this.entity);
    }
    this.isHolding = false;
    this.holdTimer = 0;
  }

  /**
   * Get current hold progress (0-1)
   */
  getProgress(): number {
    if (!this.isHolding) return 0;
    return Math.min(this.holdTimer / this.holdDuration, 1);
  }

  /**
   * Check if currently holding
   */
  getIsHolding(): boolean {
    return this.isHolding;
  }

  serialize() {
    return {
      promptText: this.promptText,
      holdDuration: this.holdDuration,
      radius: this.radius,
      enabled: this.enabled,
    };
  }

  deserialize(data: { promptText: string; holdDuration: number; radius: number; enabled: boolean }): void {
    this.promptText = data.promptText;
    this.holdDuration = data.holdDuration;
    this.radius = data.radius;
    this.enabled = data.enabled;
  }
}

