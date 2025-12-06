import type { Entity } from "../entities/Entity";
import type { Extension } from "./types";
import { ExtensionNames } from "./types";

export interface InteractableConfig {
  /** Text shown in prompt when player is nearby */
  promptText: string;
  /** Interaction radius in pixels */
  radius?: number;
  /** Callback when player interacts */
  onInteract: (entity: Entity) => void;
  /** Optional condition for interaction to be available */
  canInteract?: () => boolean;
}

/**
 * Makes an entity interactable with instant E key press
 */
export class Interactable implements Extension {
  public static readonly Name = ExtensionNames.interactable;
  
  private entity: Entity | null = null;
  private config: InteractableConfig;
  
  public promptText: string;
  public radius: number;
  public enabled: boolean = true;

  constructor(config: InteractableConfig) {
    this.config = config;
    this.promptText = config.promptText;
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
   * Trigger the interaction
   */
  interact(): void {
    if (!this.entity || !this.canInteract()) return;
    this.config.onInteract(this.entity);
  }

  /**
   * Update prompt text dynamically
   */
  setPromptText(text: string): void {
    this.promptText = text;
  }

  serialize() {
    return {
      promptText: this.promptText,
      radius: this.radius,
      enabled: this.enabled,
    };
  }

  deserialize(data: { promptText: string; radius: number; enabled: boolean }): void {
    this.promptText = data.promptText;
    this.radius = data.radius;
    this.enabled = data.enabled;
  }
}

