import * as Phaser from "phaser";
import type { Entity } from "./Entity";
import { Trash } from "./Trash";
import { Coffee } from "./Coffee";
import { Computer } from "./Computer";
import { Server } from "./Server";
import { Nelly } from "./Nelly";
import { Furniture, type FurnitureType } from "./Furniture";
import { Lamp } from "./Lamp";

/**
 * Entity types that can be created by the factory
 */
export const EntityTypes = {
  trash: "trash",
  coffee: "coffee",
  computer: "computer",
  server: "server",
  nelly: "nelly",
  furniture: "furniture",
  lamp: "lamp",
} as const;

export type EntityType = (typeof EntityTypes)[keyof typeof EntityTypes];

/**
 * Entity spawn configuration
 */
export interface EntitySpawnConfig {
  type: EntityType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  id?: string;
  /** Furniture-specific config */
  furnitureType?: FurnitureType;
  /** Color tint for furniture */
  color?: number;
  /** Y offset for depth sorting */
  sortYOffset?: number;
  /** Scale for sprites (lamp, etc.) */
  scale?: number;
}

/**
 * EntityFactory - creates game entities based on type
 * Inspired by factory pattern from survive-the-night-game
 */
export class EntityFactory {
  private scene: Phaser.Scene;
  private entities: Map<string, Entity> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create an entity from configuration
   */
  create(config: EntitySpawnConfig): Entity {
    const { type, x, y, width, height, id, furnitureType, color, sortYOffset, scale } = config;
    
    let entity: Entity;
    
    switch (type) {
      case EntityTypes.trash:
        entity = new Trash(this.scene, x, y, width, height);
        break;
      case EntityTypes.coffee:
        entity = new Coffee(this.scene, x, y, width, height);
        break;
      case EntityTypes.computer:
        entity = new Computer(this.scene, x, y, width, height);
        break;
      case EntityTypes.server:
        entity = new Server(this.scene, x, y, width, height);
        break;
      case EntityTypes.nelly:
        entity = new Nelly(this.scene, x, y, width, height);
        break;
      case EntityTypes.furniture:
        entity = new Furniture(this.scene, x, y, {
          type: furnitureType ?? "crate",
          width,
          height,
          color,
          sortYOffset,
        });
        break;
      case EntityTypes.lamp:
        entity = new Lamp(this.scene, x, y, scale ?? 0.5);
        break;
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
    
    // Override ID if provided
    if (id) {
      (entity as { id: string }).id = id;
    }
    
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Create multiple entities from an array of configurations
   */
  createMany(configs: EntitySpawnConfig[]): Entity[] {
    return configs.map((config) => this.create(config));
  }

  /**
   * Get an entity by ID
   */
  get(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all entities
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities of a specific type
   */
  getByType<T extends Entity>(
    entityClass: new (...args: unknown[]) => T
  ): T[] {
    return this.getAll().filter((e) => e instanceof entityClass) as T[];
  }

  /**
   * Get all active entities
   */
  getActive(): Entity[] {
    return this.getAll().filter((e) => e.active);
  }

  /**
   * Update all entities
   */
  update(delta: number): void {
    this.entities.forEach((entity) => {
      entity.update(delta);
    });
  }

  /**
   * Remove an entity
   */
  remove(id: string): boolean {
    const entity = this.entities.get(id);
    if (entity) {
      entity.destroy();
      this.entities.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Remove all entities
   */
  clear(): void {
    this.entities.forEach((entity) => entity.destroy());
    this.entities.clear();
  }

  /**
   * Get entity count
   */
  count(): number {
    return this.entities.size;
  }

  /**
   * Serialize all entities for saving
   */
  serialize(): unknown[] {
    return this.getAll().map((entity) => entity.serialize());
  }
}

