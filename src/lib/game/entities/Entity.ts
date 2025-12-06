import * as Phaser from "phaser";
import type { Extension, ExtensionClass } from "../extensions/types";

/**
 * Base Entity class - inspired by ECS architecture from survive-the-night-game
 * Entities are game objects that can have extensions (behaviors) attached
 */
export abstract class Entity {
  public id: string;
  public scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.GameObject | null = null;
  public active: boolean = true;
  public x: number = 0;
  public y: number = 0;
  
  protected extensions: Map<string, Extension> = new Map();
  protected destroyed: boolean = false;

  constructor(scene: Phaser.Scene, id?: string) {
    this.scene = scene;
    this.id = id ?? Math.random().toString(36).substring(2, 11);
  }

  /**
   * Add an extension (behavior) to this entity
   */
  addExtension<T extends Extension>(extension: T): T {
    const name = (extension.constructor as ExtensionClass).Name;
    if (this.extensions.has(name)) {
      console.warn(`Extension ${name} already exists on entity ${this.id}`);
      return this.extensions.get(name) as T;
    }
    this.extensions.set(name, extension);
    extension.onAttach?.(this);
    return extension;
  }

  /**
   * Get an extension by its class
   */
  getExtension<T extends Extension>(extensionClass: ExtensionClass<T>): T | undefined {
    return this.extensions.get(extensionClass.Name) as T | undefined;
  }

  /**
   * Check if entity has a specific extension
   */
  hasExtension(extensionClass: ExtensionClass): boolean {
    return this.extensions.has(extensionClass.Name);
  }

  /**
   * Remove an extension from this entity
   */
  removeExtension(extensionClass: ExtensionClass): boolean {
    const extension = this.extensions.get(extensionClass.Name);
    if (extension) {
      extension.onDetach?.(this);
      this.extensions.delete(extensionClass.Name);
      return true;
    }
    return false;
  }

  /**
   * Called every frame - updates all extensions
   */
  update(delta: number): void {
    if (this.destroyed || !this.active) return;
    
    this.extensions.forEach((extension) => {
      extension.update?.(delta);
    });
  }

  /**
   * Set entity position
   */
  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    if (this.sprite && "setPosition" in this.sprite) {
      (this.sprite as Phaser.GameObjects.Sprite).setPosition(x, y);
    }
    return this;
  }

  /**
   * Get distance to another entity or point
   */
  distanceTo(target: Entity | { x: number; y: number }): number {
    return Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
  }

  /**
   * Serialize entity state for saving/networking
   */
  serialize(): EntitySerialized {
    const extensionData: Record<string, unknown> = {};
    this.extensions.forEach((ext, name) => {
      if (ext.serialize) {
        extensionData[name] = ext.serialize();
      }
    });

    return {
      id: this.id,
      type: this.constructor.name,
      x: this.x,
      y: this.y,
      active: this.active,
      extensions: extensionData,
    };
  }

  /**
   * Deserialize entity state
   */
  deserialize(data: EntitySerialized): void {
    this.x = data.x;
    this.y = data.y;
    this.active = data.active;
    
    if (data.extensions) {
      Object.entries(data.extensions).forEach(([name, extData]) => {
        const extension = this.extensions.get(name);
        if (extension?.deserialize) {
          extension.deserialize(extData);
        }
      });
    }
  }

  /**
   * Clean up entity and all extensions
   */
  destroy(): void {
    if (this.destroyed) return;
    
    this.destroyed = true;
    this.extensions.forEach((extension) => {
      extension.onDetach?.(this);
      extension.destroy?.();
    });
    this.extensions.clear();
    
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Abstract method - implement to create the visual representation
   */
  abstract createSprite(): void;
}

export interface EntitySerialized {
  id: string;
  type: string;
  x: number;
  y: number;
  active: boolean;
  extensions?: Record<string, unknown>;
}

export type EntityClass<T extends Entity = Entity> = new (
  scene: Phaser.Scene,
  x: number,
  y: number,
  ...args: unknown[]
) => T;

