# Alin's Basement - Game Architecture

This document describes the ECS-inspired architecture for the game, adapted from patterns used in [webdevcody/survive-the-night-game](https://github.com/webdevcody/survive-the-night-game).

## Overview

The game uses a modular architecture with three main concepts:

1. **Entities** - Game objects (Trash, Coffee, Server, etc.)
2. **Extensions** - Reusable behaviors attached to entities (Interactable, Respawnable, etc.)
3. **Systems** - Scene-level managers (InteractionSystem, CollisionEditorSystem)

## Directory Structure

```
src/lib/game/
├── entities/           # Game object classes
│   ├── Entity.ts       # Base class for all entities
│   ├── EntityFactory.ts # Factory for spawning entities
│   ├── Trash.ts        # Trash entity (cleanable)
│   ├── Coffee.ts       # Coffee entity (stamina/speed buff)
│   ├── Computer.ts     # Computer entity (fix bugs)
│   ├── Server.ts       # Server entity (hold to boot)
│   ├── Nelly.ts        # Dog entity (pet for sanity)
│   └── index.ts        # Barrel export
├── extensions/         # Reusable behaviors
│   ├── types.ts        # Extension interface and names
│   ├── Interactable.ts # Instant E key interaction
│   ├── HoldInteractable.ts # Hold-to-complete interaction
│   ├── Respawnable.ts  # Respawn after deactivation
│   └── index.ts        # Barrel export
├── systems/            # Scene-level managers
│   ├── InteractionSystem.ts    # Handles player-entity interactions
│   ├── CollisionEditorSystem.ts # Visual collision box editing
│   └── index.ts        # Barrel export
├── scenes/
│   └── MainScene.ts    # Main game scene
└── config.ts           # Phaser configuration
```

## Key Concepts

### Entities

All game objects extend the `Entity` base class:

```typescript
export abstract class Entity {
	public id: string;
	public scene: Phaser.Scene;
	public sprite: Phaser.GameObjects.GameObject | null;
	public active: boolean;
	public x: number;
	public y: number;

	// Add behaviors
	addExtension<T extends Extension>(extension: T): T;

	// Get behaviors
	getExtension<T>(extensionClass: ExtensionClass<T>): T | undefined;

	// Called every frame
	update(delta: number): void;

	// For save/network sync
	serialize(): EntitySerialized;
	deserialize(data: EntitySerialized): void;
}
```

### Extensions

Extensions add reusable behaviors to entities:

```typescript
// Example: Making an entity interactable
this.addExtension(
	new Interactable({
		promptText: "[E] Clean Up",
		radius: 60,
		onInteract: (entity) => {
			// Handle interaction
		},
	})
);
```

Available extensions:

- `Interactable` - Instant E key interactions
- `HoldInteractable` - Hold-to-complete interactions (servers)
- `Respawnable` - Respawn after cooldown (coffee, pet cooldown)

### EntityFactory

Factory pattern for spawning entities:

```typescript
const factory = new EntityFactory(scene);

// Spawn multiple entities
factory.createMany([
	{ type: "trash", x: 100, y: 200 },
	{ type: "coffee", x: 300, y: 400 },
	{ type: "server", x: 500, y: 600 },
]);

// Get all entities
const entities = factory.getAll();

// Update all entities each frame
factory.update(delta);
```

### Systems

Systems manage scene-level functionality:

```typescript
// InteractionSystem handles player-entity interactions
const interactionSystem = new InteractionSystem(
	scene,
	() => factory.getAll(), // Entity getter
	() => ({ x: player.x, y: player.y }) // Player position
);

// Update each frame
interactionSystem.update(delta, isKeyDown, isKeyJustPressed);
```

## Adding New Entity Types

1. Create a new file in `entities/`:

```typescript
// entities/Lamp.ts
export class Lamp extends Entity {
	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene);
		this.x = x;
		this.y = y;
		this.createSprite();
		this.setupExtensions();
	}

	createSprite(): void {
		this.sprite = this.scene.add.rectangle(this.x, this.y, 30, 30);
		// ...
	}

	private setupExtensions(): void {
		this.addExtension(
			new Interactable({
				promptText: "[E] Toggle Light",
				onInteract: () => {
					/* ... */
				},
			})
		);
	}
}
```

2. Add to `EntityFactory.ts`:

```typescript
import { Lamp } from "./Lamp";

export const EntityTypes = {
  // ...existing types
  lamp: "lamp",
} as const;

// In create():
case EntityTypes.lamp:
  entity = new Lamp(this.scene, x, y);
  break;
```

3. Export from `entities/index.ts`

## Adding New Extensions

1. Create a new file in `extensions/`:

```typescript
// extensions/Damageable.ts
export class Damageable implements Extension {
	public static readonly Name = ExtensionNames.damageable;

	private health: number;
	private maxHealth: number;

	constructor(maxHealth: number) {
		this.health = maxHealth;
		this.maxHealth = maxHealth;
	}

	takeDamage(amount: number): void {
		this.health = Math.max(0, this.health - amount);
	}

	// Implement Extension interface...
}
```

2. Add to `extensions/types.ts`:

```typescript
export const ExtensionNames = {
	// ...existing names
	damageable: "damageable",
} as const;
```

3. Export from `extensions/index.ts`

## Benefits of This Architecture

1. **Scalability** - Easy to add new entity types and behaviors
2. **Reusability** - Extensions can be mixed and matched
3. **Testability** - Each component can be tested in isolation
4. **Maintainability** - Clear separation of concerns
5. **Network-Ready** - Built-in serialization for multiplayer support

## Future Improvements

- [ ] Add more extensions (Damageable, Moveable, AI behavior)
- [ ] Implement entity pooling for performance
- [ ] Add event system for decoupled communication
- [ ] Create debug visualizer for extensions
- [ ] Add entity tagging/grouping system
