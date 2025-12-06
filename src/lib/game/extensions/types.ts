import type { Entity } from "../entities/Entity";

/**
 * Extension interface - behaviors that can be attached to entities
 * Inspired by ECS pattern from survive-the-night-game
 */
export interface Extension {
  /** Called every frame */
  update?(delta: number): void;
  
  /** Called when extension is attached to an entity */
  onAttach?(entity: Entity): void;
  
  /** Called when extension is detached from entity */
  onDetach?(entity: Entity): void;
  
  /** Serialize extension state */
  serialize?(): unknown;
  
  /** Deserialize extension state */
  deserialize?(data: unknown): void;
  
  /** Cleanup resources */
  destroy?(): void;
}

/**
 * Extension class type with static Name property
 */
export interface ExtensionClass<T extends Extension = Extension> {
  new (...args: unknown[]): T;
  readonly Name: string;
}

/**
 * Extension names enum - add new extensions here
 */
export const ExtensionNames = {
  interactable: "interactable",
  holdInteractable: "holdInteractable",
  respawnable: "respawnable",
  sanityEffect: "sanityEffect",
  staminaEffect: "staminaEffect",
  speedBuff: "speedBuff",
  cooldown: "cooldown",
  animatable: "animatable",
} as const;

export type ExtensionName = (typeof ExtensionNames)[keyof typeof ExtensionNames];

