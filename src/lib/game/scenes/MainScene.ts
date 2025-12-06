import * as Phaser from "phaser";
import { useGameStore } from "@/lib/state/gameStore";
import { EntityFactory, EntityTypes, type EntitySpawnConfig } from "../entities";
import { Coffee } from "../entities/Coffee";
import { Trash } from "../entities/Trash";
import { Nelly } from "../entities/Nelly";
import { Furniture } from "../entities/Furniture";
import { Lamp } from "../entities/Lamp";
import { InteractionSystem, CollisionEditorSystem, type CollisionBoxData } from "../systems";
import { updatePlayerDepth } from "../extensions";

// Debug settings interface (set from React DebugPanel)
interface DebugSettings {
  zoom: number;
  playerScale: number;
  moveSpeed: number;
  showCollision: boolean;
}

declare global {
  interface Window {
    gameDebug?: DebugSettings;
    collisionBoxes?: CollisionBoxData[];
    collisionEditorMode?: boolean;
    onCollisionBoxesChange?: (boxes: CollisionBoxData[]) => void;
  }
}

// Game constants
const BASE_SPEED = 420;
const SPRINT_MULTIPLIER = 1.5;
const STAMINA_DRAIN_PER_MS = 0.08;
const STAMINA_REGEN_PER_MS = 0.04;
const SANITY_DRAIN_INTERVAL_MS = 1000;
const SANITY_DRAIN_PER_TICK = 0.5;
const COFFEE_BUFF_MS = 5000;

// Viewport/Level dimensions
const LEVEL_WIDTH = 2976;
const LEVEL_HEIGHT = 1440;

/** Who is currently being controlled */
type ControlledCharacter = "alin" | "nelly";

/**
 * MainScene - refactored to use ECS-inspired architecture
 * Now supports switching between Alin and Nelly!
 */
export class MainScene extends Phaser.Scene {
  // Player (Alin)
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys & {
    shift?: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private switchKey!: Phaser.Input.Keyboard.Key;

  // Nelly reference (for easy access)
  private nelly: Nelly | null = null;
  
  // Who is currently controlled
  private controlledCharacter: ControlledCharacter = "alin";

  // Systems
  private entityFactory!: EntityFactory;
  private interactionSystem!: InteractionSystem;
  private collisionEditor!: CollisionEditorSystem;

  // State
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private sanityTimer = 0;
  private speedBuffTimer = 0;
  private lastPhase: string | null = null;

  constructor() {
    super("MainScene");
  }

  preload() {
    // Load level background
    this.load.image("level1", "/assets/room1/rom1-empty.png");
    
    // Load Alin spritesheet from Aseprite
    this.load.atlas(
      "alin",
      "/assets/aseprite/spritesheets/alin_sprite_full-Photoroom-sheet.png",
      "/assets/aseprite/spritesheets/alin_sprite_full-Photoroom.json"
    );
    
    // Load Nelly spritesheet
    Nelly.preload(this);
    
    // Load furniture sprites
    Furniture.preload(this);
    
    // Load lamp sprite (interactive lamp with glow)
    Lamp.preload(this);
  }

  create() {
    const store = useGameStore.getState();
    store.setGameState("menu");

    // Background
    this.add.image(LEVEL_WIDTH / 2, LEVEL_HEIGHT / 2, "level1").setDepth(0);

    // Physics bounds
    const boundsMargin = 100;
    this.physics.world.setBounds(
      boundsMargin,
      boundsMargin,
      LEVEL_WIDTH - boundsMargin * 2,
      LEVEL_HEIGHT - boundsMargin * 2
    );

    // Camera setup
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.cameras.main.setZoom(0.5);

    // Create collision boxes (walls/furniture)
    this.walls = this.physics.add.staticGroup();
    this.createInitialCollisionBoxes();

    // Create Nelly's animations
    Nelly.createAnimations(this);

    // Create player (Alin)
    this.createPlayer();
    this.physics.add.collider(this.player, this.walls);

    // Input setup
    this.cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as typeof this.cursors;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.switchKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // Initialize entity factory and spawn game objects
    this.entityFactory = new EntityFactory(this);
    this.spawnLevelEntities();

    // Initialize interaction system
    this.interactionSystem = new InteractionSystem(
      this,
      () => this.entityFactory.getAll(),
      () => this.getActiveCharacterPosition()
    );

    // Initialize collision editor
    this.collisionEditor = new CollisionEditorSystem(
      this,
      this.walls,
      this.getDefaultCollisionBoxes(),
      (boxes) => {
        window.collisionBoxes = boxes;
        window.onCollisionBoxesChange?.(boxes);
      }
    );

    // Start following Alin
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 50);

    this.lastPhase = store.gameState;
  }

  /**
   * Get the position of the currently active character
   */
  private getActiveCharacterPosition(): { x: number; y: number } | null {
    if (this.controlledCharacter === "nelly" && this.nelly) {
      return { x: this.nelly.x, y: this.nelly.y };
    }
    return this.player ? { x: this.player.x, y: this.player.y } : null;
  }

  /**
   * Switch control between Alin and Nelly
   */
  private switchCharacter(): void {
    if (!this.nelly) return;

    if (this.controlledCharacter === "alin") {
      // Switch to Nelly
      this.controlledCharacter = "nelly";
      this.nelly.takeControl();
      this.player.setVelocity(0, 0);
      if (this.anims.exists("idle")) {
        this.player.play("idle");
      }
      
      // Camera follows Nelly
      this.cameras.main.startFollow(this.nelly.nellySprite, true, 0.08, 0.08);
      
      // Visual indicator on Alin (slight transparency)
      this.player.setAlpha(0.7);
    } else {
      // Switch to Alin
      this.controlledCharacter = "alin";
      this.nelly.releaseControl();
      
      // Camera follows Alin
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      
      // Restore Alin's opacity
      this.player.setAlpha(1);
    }
  }

  private createPlayer() {
    const startX = LEVEL_WIDTH / 2;
    const startY = 1100;

    if (this.textures.exists("alin")) {
      this.player = this.physics.add
        .sprite(startX, startY, "alin", "alin_sprite_full-Photoroom 0.png")
        .setScale(0.5)
        .setDepth(50);

      // Walk animation
      this.anims.create({
        key: "walk",
        frames: [
          { key: "alin", frame: "alin_sprite_full-Photoroom 0.png" },
          { key: "alin", frame: "alin_sprite_full-Photoroom 1.png" },
          { key: "alin", frame: "alin_sprite_full-Photoroom 2.png" },
          { key: "alin", frame: "alin_sprite_full-Photoroom 3.png" },
        ],
        frameRate: 10,
        repeat: -1,
      });

      // Idle animation
      this.anims.create({
        key: "idle",
        frames: [{ key: "alin", frame: "alin_sprite_full-Photoroom 0.png" }],
        frameRate: 1,
      });
    } else {
      // Fallback texture
      const g = this.add.graphics();
      g.fillStyle(0x3498db, 1);
      g.fillRect(0, 0, 24, 32);
      g.fillStyle(0xf1c27d, 1);
      g.fillRect(4, 2, 16, 12);
      g.fillStyle(0x4a3000, 1);
      g.fillRect(4, 0, 16, 6);
      g.generateTexture("player-fallback", 24, 32);
      g.destroy();

      this.player = this.physics.add
        .sprite(startX, startY, "player-fallback")
        .setScale(1)
        .setDepth(50);
    }

    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(100, 180);
  }

  private createInitialCollisionBoxes() {
    const boxes = this.getDefaultCollisionBoxes();
    boxes.forEach(({ x, y, w, h }) => {
      const rect = this.add.rectangle(x, y, w, h, 0xff0000, 0.15);
      rect.setStrokeStyle(3, 0xff0000, 0.8);
      rect.setDepth(100);
      rect.setOrigin(0, 0);
      rect.setPosition(x - w / 2, y - h / 2);
      this.physics.add.existing(rect, true);
      this.walls.add(rect);
    });
  }

  private getDefaultCollisionBoxes(): CollisionBoxData[] {
    return [
      { id: "1", x: 1488, y: 236, w: 2947, h: 444 },
      { id: "2", x: 2517, y: 550, w: 558, h: 503 },
      { id: "3", x: 2170, y: 550, w: 352, h: 492 },
      { id: "4", x: 2017, y: 1101, w: 140, h: 217 },
      { id: "5", x: 2170, y: 1107, w: 142, h: 222 },
      { id: "6", x: 2707, y: 1020, w: 142, h: 397 },
      { id: "7", x: 1421, y: 1311, w: 2813, h: 248 },
      { id: "8", x: 334, y: 592, w: 233, h: 408 },
      { id: "9", x: 121, y: 734, w: 73, h: 90 },
      { id: "10", x: 101, y: 596, w: 206, h: 248 },
      { id: "11", x: 69, y: 944, w: 137, h: 194 },
      { id: "12", x: 122, y: 1121, w: 192, h: 138 },
      { id: "13", x: 852, y: 1046, w: 128, h: 309 },
      { id: "14", x: 996, y: 1086, w: 125, h: 236 },
      { id: "15", x: 502, y: 647, w: 201, h: 293 },
      { id: "16", x: 507, y: 1097, w: 183, h: 191 },
      { id: "17", x: 435, y: 1129, w: 125, h: 98 },
    ];
  }

  private spawnLevelEntities() {
    // Define level objects using the new entity system
    const levelObjects: EntitySpawnConfig[] = [
      // Server rack (interactable)
      { type: EntityTypes.server, x: 160, y: 310, width: 80, height: 50 },
      
      // Computer (interactable)
      { type: EntityTypes.computer, x: 780, y: 320, width: 80, height: 50 },
      
      // Nelly the dog (interactable AND controllable!)
      { type: EntityTypes.nelly, x: 1400, y: 1000, width: 100, height: 80 },
      
      // Trash (interactable, cleanable)
      { type: EntityTypes.trash, x: 150, y: 420, width: 30, height: 30 },
      { type: EntityTypes.trash, x: 350, y: 380, width: 30, height: 30 },
      { type: EntityTypes.trash, x: 880, y: 400, width: 30, height: 30 },
      
      // Coffee (interactable, respawns)
      { type: EntityTypes.coffee, x: 620, y: 390, width: 25, height: 25 },
      
      // ===== OCCLUDABLE FURNITURE =====
      { type: EntityTypes.furniture, x: 1800, y: 900, furnitureType: "shelf", width: 150, height: 200 },
      { type: EntityTypes.furniture, x: 2100, y: 850, furnitureType: "shelf", width: 120, height: 180 },
      { type: EntityTypes.furniture, x: 400, y: 800, furnitureType: "serverRack", width: 100, height: 220 },
      { type: EntityTypes.furniture, x: 1500, y: 1000, furnitureType: "crate", width: 70, height: 70 },
      { type: EntityTypes.furniture, x: 1600, y: 950, furnitureType: "crate", width: 60, height: 60 },
      { type: EntityTypes.furniture, x: 2400, y: 900, furnitureType: "desk", width: 180, height: 90 },
      
      // ===== INTERACTIVE LAMP (with glow effect!) =====
      // Player can walk behind this and toggle it on/off
      { type: EntityTypes.lamp, x: 1300, y: 1050, scale: 0.4 },
    ];

    const entities = this.entityFactory.createMany(levelObjects);

    // Set up coffee speed buff callback
    entities
      .filter((e): e is Coffee => e instanceof Coffee)
      .forEach((coffee) => {
        coffee.onSpeedBuff = (duration) => {
          this.speedBuffTimer = duration;
        };
      });

    // Get Nelly reference and set up control switching
    const nellyEntities = entities.filter((e): e is Nelly => e instanceof Nelly);
    if (nellyEntities.length > 0) {
      this.nelly = nellyEntities[0];
      
      // Set up collision for Nelly
      this.nelly.setCollisionWith(this.walls);
      
      // Set up control change callback
      this.nelly.onControlChange = (isControlled) => {
        if (isControlled && this.controlledCharacter !== "nelly") {
          this.switchCharacter();
        }
      };
    }
  }

  update(_: number, delta: number) {
    const store = useGameStore.getState();

    // Apply debug settings
    const debug = typeof window !== "undefined" ? window.gameDebug : undefined;
    if (debug) {
      this.cameras.main.setZoom(debug.zoom);
      if (this.player) {
        this.player.setScale(debug.playerScale);
      }
      this.collisionEditor?.setDebugVisible(debug.showCollision);
    }

    // Handle non-playing states
    if (store.gameState !== "playing") {
      if (this.lastPhase === "playing") {
        this.player?.setVelocity(0, 0);
        this.nelly?.releaseControl();
      }
      this.lastPhase = store.gameState;
      this.player?.setVelocity(0, 0);
      return;
    }

    // Reset on transition to playing
    if (this.lastPhase !== "playing") {
      this.resetScene();
    }
    this.lastPhase = store.gameState;

    // Check for character switch (TAB key)
    if (Phaser.Input.Keyboard.JustDown(this.switchKey) && this.nelly) {
      this.switchCharacter();
    }

    // Update all entities
    this.entityFactory.update(delta);

    // Handle movement based on who is controlled
    if (this.controlledCharacter === "alin") {
      this.handleAlinMovement(delta, debug);
      updatePlayerDepth(this.player);
    } else if (this.nelly) {
      this.handleNellyMovement();
      this.nelly.updateDepth();
    }

    // Always update Alin's depth for occlusion (even when not controlled)
    if (this.controlledCharacter !== "alin") {
      updatePlayerDepth(this.player);
    }

    // Sanity drain
    this.handleSanityDrain(delta, store);

    // Low sanity visual effects
    this.handleLowSanityEffects(store);

    // Interaction system update (only when controlling Alin)
    if (this.controlledCharacter === "alin") {
      this.interactionSystem.update(
        delta,
        this.interactKey.isDown,
        Phaser.Input.Keyboard.JustDown(this.interactKey)
      );
    }

    // Check win condition
    this.checkWinCondition();
  }

  private handleAlinMovement(delta: number, debug?: DebugSettings) {
    const store = useGameStore.getState();
    
    const left = this.cursors.left?.isDown;
    const right = this.cursors.right?.isDown;
    const up = this.cursors.up?.isDown;
    const down = this.cursors.down?.isDown;
    const shift = this.cursors.shift?.isDown;

    let speed = debug?.moveSpeed ?? BASE_SPEED;
    
    // Speed buff from coffee
    if (this.speedBuffTimer > 0) {
      speed *= 1.2;
      this.speedBuffTimer -= delta;
    }

    // Sprint
    const stamina = store.stamina;
    if (shift && stamina > 0) {
      speed *= SPRINT_MULTIPLIER;
      store.adjustStamina(-(delta * STAMINA_DRAIN_PER_MS));
    } else {
      store.adjustStamina(delta * STAMINA_REGEN_PER_MS);
    }

    // Calculate velocity
    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }
    this.player.setVelocity(vx, vy);

    // Flip sprite
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Animation
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      if (this.anims.exists("walk") && this.player.anims.currentAnim?.key !== "walk") {
        this.player.play("walk");
      }
    } else {
      if (this.anims.exists("idle")) {
        this.player.play("idle");
      } else {
        this.player.stop();
      }
    }
  }

  private handleNellyMovement() {
    if (!this.nelly) return;
    
    const left = this.cursors.left?.isDown ?? false;
    const right = this.cursors.right?.isDown ?? false;
    const up = this.cursors.up?.isDown ?? false;
    const down = this.cursors.down?.isDown ?? false;
    const sprint = this.cursors.shift?.isDown ?? false;
    
    this.nelly.handleInput(left, right, up, down, sprint);
  }

  private handleSanityDrain(delta: number, store: ReturnType<typeof useGameStore.getState>) {
    this.sanityTimer += delta;
    if (this.sanityTimer >= SANITY_DRAIN_INTERVAL_MS) {
      const sanity = store.adjustSanity(-SANITY_DRAIN_PER_TICK);
      this.sanityTimer = 0;
      if (sanity <= 0) {
        this.cameras.main.shake(250, 0.004);
        this.player.setVelocity(0, 0);
      }
    }
  }

  private handleLowSanityEffects(store: ReturnType<typeof useGameStore.getState>) {
    if (store.sanity < 30) {
      this.cameras.main.setAlpha(0.85 + Math.sin(this.time.now / 150) * 0.15);
    } else {
      this.cameras.main.setAlpha(1);
    }
  }

  private checkWinCondition() {
    const store = useGameStore.getState();
    const trashLeft = Trash.countActiveTrash(this.entityFactory.getAll());

    if (trashLeft === 0 && store.mission === "Clean up the remaining mess") {
      store.setMission("Mission Complete!");
      store.setGameState("won");
      this.player.setVelocity(0, 0);
      this.nelly?.releaseControl();
      this.cameras.main.flash(500, 46, 204, 113, false);
    }
  }

  private resetScene() {
    const store = useGameStore.getState();
    store.reset();
    this.sanityTimer = 0;
    this.speedBuffTimer = 0;
    this.controlledCharacter = "alin";
    
    this.player.setPosition(LEVEL_WIDTH / 2, 1100);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    
    // Reset Nelly
    if (this.nelly) {
      this.nelly.releaseControl();
      this.nelly.nellySprite.setPosition(1400, 1000);
    }
    
    // Camera follows Alin
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Reset all entities
    this.entityFactory.getAll().forEach((entity) => {
      entity.active = true;
      if (entity.sprite && "setVisible" in entity.sprite) {
        (entity.sprite as Phaser.GameObjects.Sprite).setVisible(true);
      }
    });
  }
}
