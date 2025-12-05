import * as Phaser from "phaser";
import { useGameStore } from "@/lib/state/gameStore";

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
  }
}

const BASE_SPEED = 160;
const SPRINT_MULTIPLIER = 1.5;
const STAMINA_DRAIN_PER_MS = 0.08;
const STAMINA_REGEN_PER_MS = 0.04;
const SANITY_DRAIN_INTERVAL_MS = 1000;
const SANITY_DRAIN_PER_TICK = 0.5;
const INTERACT_RADIUS = 60;
const SERVER_HOLD_MS = 1200;
const COFFEE_BUFF_MS = 5000;

// Viewport dimensions
const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 480;

// Level dimensions (original image size - no scaling for crisp pixels)
const LEVEL_WIDTH = 2976;
const LEVEL_HEIGHT = 1440;

type InteractableType = "trash" | "computer" | "server" | "coffee" | "nelly";

interface InteractableObject {
  sprite: Phaser.GameObjects.Rectangle;
  type: InteractableType;
  active: boolean;
  label?: Phaser.GameObjects.Text;
}

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys & {
    shift?: Phaser.Input.Keyboard.Key;
  };
  private sanityTimer = 0;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private objects: InteractableObject[] = [];
  private holdTarget: Phaser.GameObjects.Rectangle | null = null;
  private holdTimer = 0;
  private speedBuffTimer = 0;
  private lastPhase: string | null = null;
  private interactPrompt!: Phaser.GameObjects.Text;
  private holdProgressBar!: Phaser.GameObjects.Graphics;
  private levelBg!: Phaser.GameObjects.Image;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("MainScene");
  }

  preload() {
    // Load assets
    this.load.image("alin", "/assets/alin_sprite_small.jpg");
    this.load.image("level1", "/assets/gamelevel1.png");
  }

  create() {
    const store = useGameStore.getState();
    store.setGameState("menu");

    // Background at 1:1 scale (no scaling = crisp pixels)
    this.levelBg = this.add.image(LEVEL_WIDTH / 2, LEVEL_HEIGHT / 2, "level1");
    this.levelBg.setDepth(0);

    // Set world physics bounds - allow movement across most of the level
    const boundsMargin = 100;
    this.physics.world.setBounds(
      boundsMargin, 
      boundsMargin, 
      LEVEL_WIDTH - boundsMargin * 2, 
      LEVEL_HEIGHT - boundsMargin * 2
    );

    // Create collision boxes for walls/furniture
    this.createCollisionBoxes();

    // Set up camera to follow player and stay within level bounds
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.cameras.main.setZoom(0.5); // Zoom out to see more of the level

    // Create player
    this.createPlayer();

    // Set up collision between player and walls
    this.setupPlayerCollision();

    // Input setup
    this.cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as typeof this.cursors;

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Interaction prompt
    this.interactPrompt = this.add
      .text(0, 0, "[E] Interact", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#66fcf1",
        backgroundColor: "#1a1410ee",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);

    // Hold progress bar
    this.holdProgressBar = this.add.graphics().setDepth(101);

    // Spawn interactive objects based on level artwork positions
    this.spawnLevelObjects();

    this.lastPhase = store.gameState;
  }

  private createPlayer() {
    // Start in center of walkable area
    const startX = LEVEL_WIDTH / 2;
    const startY = 1100;

    if (this.textures.exists("alin")) {
      // alin_sprite_small.jpg is 200x285, scale to ~340px tall (4x bigger)
      this.player = this.physics.add
        .sprite(startX, startY, "alin")
        .setScale(1.0)
        .setDepth(50);
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
    this.player.body?.setSize(300, 400);

    // Camera follows player with smooth lerp
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 50); // Small deadzone so camera doesn't jitter
  }

  private createCollisionBoxes() {
    // Create static group for walls/furniture collision
    this.walls = this.physics.add.staticGroup();

    // Define collision boxes based on gamelevel1.png (2976x1440)
    // Format: { x, y, width, height } - x,y is center of box
    const collisionBoxes = [
      // Top wall / server area boundary
      { x: LEVEL_WIDTH / 2, y: 200, w: LEVEL_WIDTH, h: 400 },
      
      // Left wall
      { x: 50, y: LEVEL_HEIGHT / 2, w: 100, h: LEVEL_HEIGHT },
      
      // Right wall  
      { x: LEVEL_WIDTH - 50, y: LEVEL_HEIGHT / 2, w: 100, h: LEVEL_HEIGHT },
      
      // Bottom wall
      { x: LEVEL_WIDTH / 2, y: LEVEL_HEIGHT - 50, w: LEVEL_WIDTH, h: 100 },

      // Server racks (left side) - approximate positions
      { x: 400, y: 600, w: 300, h: 200 },
      { x: 700, y: 600, w: 200, h: 200 },
      
      // Desk area (right side)
      { x: 2400, y: 700, w: 400, h: 250 },
      
      // Bathroom area (left)
      { x: 200, y: 900, w: 300, h: 400 },
      
      // Kitchen area (could be right side)
      // { x: 2600, y: 1000, w: 300, h: 300 },
    ];

    collisionBoxes.forEach(({ x, y, w, h }) => {
      // Create invisible collision rectangle
      const rect = this.add.rectangle(x, y, w, h, 0xff0000, 0); // Invisible (alpha 0)
      this.physics.add.existing(rect, true); // true = static body
      this.walls.add(rect);
      
      // Debug: show collision boxes (uncomment to visualize)
      // rect.setStrokeStyle(2, 0xff0000, 0.5);
    });

    // Add collision between player and walls (will be set up after player is created)
  }

  private setupPlayerCollision() {
    if (this.player && this.walls) {
      this.physics.add.collider(this.player, this.walls);
    }
  }

  private spawnLevelObjects() {
    // Object positions based on gamelevel1.png artwork
    // Coordinates are approximate based on where things appear in the image
    const levelObjects: { x: number; y: number; type: InteractableType; w?: number; h?: number }[] = [
      // Server racks (left side, behind servers in image)
      { x: 120, y: 310, type: "server", w: 60, h: 40 },
      { x: 200, y: 310, type: "server", w: 60, h: 40 },
      
      // Computer desk (right side with monitors)
      { x: 780, y: 320, type: "computer", w: 80, h: 50 },
      
      // Nelly the dog (on the rug, center)
      { x: 520, y: 400, type: "nelly", w: 50, h: 40 },
      
      // Trash/crates scattered around
      { x: 150, y: 420, type: "trash", w: 30, h: 30 },
      { x: 350, y: 380, type: "trash", w: 30, h: 30 },
      { x: 880, y: 400, type: "trash", w: 30, h: 30 },
      
      // Coffee (on desk or lamp table area)
      { x: 620, y: 390, type: "coffee", w: 25, h: 25 },
    ];

    levelObjects.forEach(({ x, y, type, w = 40, h = 40 }) => {
      // Create invisible interaction zone
      const sprite = this.add
        .rectangle(x, y, w, h, 0x000000, 0) // Invisible
        .setDepth(1);

      // Debug: show interaction zones (comment out for production)
      // sprite.setStrokeStyle(2, 0xff0000, 0.5);

      this.physics.add.existing(sprite, true);
      this.objects.push({ sprite, type, active: true });
    });
  }

  update(_: number, delta: number) {
    const store = useGameStore.getState();

    // Apply debug settings from React UI
    const debug = typeof window !== 'undefined' ? window.gameDebug : undefined;
    if (debug) {
      this.cameras.main.setZoom(debug.zoom);
      if (this.player) {
        this.player.setScale(debug.playerScale);
      }
      // Toggle collision box visibility
      if (this.walls) {
        this.walls.getChildren().forEach((child) => {
          const rect = child as Phaser.GameObjects.Rectangle;
          if (debug.showCollision) {
            rect.setStrokeStyle(3, 0xff0000, 0.8);
            rect.setFillStyle(0xff0000, 0.2);
          } else {
            rect.setStrokeStyle(0);
            rect.setFillStyle(0x000000, 0);
          }
        });
      }
    }

    if (store.gameState !== "playing") {
      if (this.lastPhase === "playing") {
        this.player?.setVelocity(0, 0);
      }
      this.lastPhase = store.gameState;
      this.player?.setVelocity(0, 0);
      this.interactPrompt?.setVisible(false);
      this.holdProgressBar?.clear();
      return;
    }

    if (this.lastPhase !== "playing") {
      this.resetScene();
    }
    this.lastPhase = store.gameState;

    // Movement
    const left = this.cursors.left?.isDown;
    const right = this.cursors.right?.isDown;
    const up = this.cursors.up?.isDown;
    const down = this.cursors.down?.isDown;
    const shift = this.cursors.shift?.isDown;

    // Use debug speed if available, otherwise BASE_SPEED
    let speed = debug?.moveSpeed ?? BASE_SPEED;
    if (this.speedBuffTimer > 0) {
      speed *= 1.2;
      this.speedBuffTimer -= delta;
    }

    const stamina = store.stamina;
    if (shift && stamina > 0) {
      speed *= SPRINT_MULTIPLIER;
      store.adjustStamina(-(delta * STAMINA_DRAIN_PER_MS));
    } else {
      store.adjustStamina(delta * STAMINA_REGEN_PER_MS);
    }

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

    // Flip sprite based on direction
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Sanity drain
    this.sanityTimer += delta;
    if (this.sanityTimer >= SANITY_DRAIN_INTERVAL_MS) {
      const sanity = store.adjustSanity(-SANITY_DRAIN_PER_TICK);
      this.sanityTimer = 0;
      if (sanity <= 0) {
        this.cameras.main.shake(250, 0.004);
        this.player.setVelocity(0, 0);
      }
    }

    // Low sanity visual effects
    if (store.sanity < 30) {
      this.cameras.main.setAlpha(0.85 + Math.sin(this.time.now / 150) * 0.15);
    } else {
      this.cameras.main.setAlpha(1);
    }

    this.handleInteraction(delta);
  }

  private resetScene() {
    const store = useGameStore.getState();
    store.reset();
    this.sanityTimer = 0;
    this.holdTimer = 0;
    this.holdTarget = null;
    this.speedBuffTimer = 0;
    this.player.setPosition(LEVEL_WIDTH / 2, 1100);
    this.player.setVelocity(0, 0);
    
    // Reset all objects
    this.objects.forEach((obj) => {
      obj.active = true;
      obj.sprite.setVisible(true);
    });
  }

  private handleInteraction(delta: number) {
    if (!this.player) return;
    const store = useGameStore.getState();
    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // Find nearest active object
    const target = this.objects
      .filter((obj) => obj.active)
      .map((obj) => ({
        obj,
        dist: Phaser.Math.Distance.Between(playerPos.x, playerPos.y, obj.sprite.x, obj.sprite.y),
      }))
      .filter((item) => item.dist < INTERACT_RADIUS)
      .sort((a, b) => a.dist - b.dist)[0]?.obj ?? null;

    if (!target) {
      this.interactPrompt.setVisible(false);
      this.holdProgressBar.clear();
      this.holdTarget = null;
      this.holdTimer = 0;
      return;
    }

    // Position prompt above target
    this.interactPrompt.setPosition(target.sprite.x, target.sprite.y - 35);
    this.interactPrompt.setVisible(true);

    // Update prompt text based on object type
    if (target.type === "server" && store.mission === "Boot up the main server") {
      this.interactPrompt.setText("[E] Hold to Boot");
    } else if (target.type === "nelly") {
      this.interactPrompt.setText("[E] Pet Nelly");
    } else if (target.type === "coffee") {
      this.interactPrompt.setText("[E] Drink Coffee");
    } else if (target.type === "trash") {
      this.interactPrompt.setText("[E] Clean Up");
    } else if (target.type === "computer") {
      this.interactPrompt.setText("[E] Fix Bug");
    } else {
      this.interactPrompt.setText("[E] Interact");
    }

    const isHolding = this.interactKey.isDown;

    // Server requires hold
    if (target.type === "server") {
      if (isHolding && store.mission === "Boot up the main server") {
        if (this.holdTarget !== target.sprite) {
          this.holdTarget = target.sprite;
          this.holdTimer = 0;
        }
        this.holdTimer += delta;

        // Draw progress bar
        const progress = Math.min(this.holdTimer / SERVER_HOLD_MS, 1);
        this.holdProgressBar.clear();
        this.holdProgressBar.fillStyle(0x1a1410, 0.9);
        this.holdProgressBar.fillRect(target.sprite.x - 30, target.sprite.y - 50, 60, 10);
        this.holdProgressBar.fillStyle(0x66fcf1, 1);
        this.holdProgressBar.fillRect(target.sprite.x - 28, target.sprite.y - 48, 56 * progress, 6);

        if (this.holdTimer >= SERVER_HOLD_MS) {
          target.active = false;
          store.addScore(500);
          store.setMission("Clean up the remaining mess");
          store.setMessage("🖥️ SERVER ONLINE!");
          this.time.delayedCall(2000, () => store.setMessage(null));
          this.holdTimer = 0;
          this.holdTarget = null;
          this.holdProgressBar.clear();
          this.cameras.main.flash(200, 102, 252, 241, false);
        }
      } else {
        this.holdTimer = 0;
        this.holdTarget = null;
        this.holdProgressBar.clear();
      }
      return;
    }

    // Instant interactions
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.doInteraction(target);
    }
  }

  private doInteraction(obj: InteractableObject) {
    const store = useGameStore.getState();

    // Visual feedback
    this.cameras.main.flash(80, 102, 252, 241, false);

    switch (obj.type) {
      case "trash":
        obj.active = false;
        store.adjustSanity(+10);
        store.addScore(50);
        store.setMessage("🗑️ Cleaned up! (+10 Sanity)");
        this.time.delayedCall(1500, () => store.setMessage(null));
        this.checkWinCondition();
        break;

      case "computer":
        store.adjustSanity(-5);
        store.addScore(20);
        store.setMessage("💻 Fixed Bug (-5 Sanity)");
        this.cameras.main.shake(100, 0.002);
        this.time.delayedCall(1500, () => store.setMessage(null));
        break;

      case "coffee":
        obj.active = false;
        store.adjustSanity(+25);
        store.adjustStamina(+1000);
        this.speedBuffTimer = COFFEE_BUFF_MS;
        store.setMessage("☕ Energy Restored!");
        this.time.delayedCall(1500, () => store.setMessage(null));
        // Respawn coffee
        this.time.delayedCall(12000, () => {
          obj.active = true;
        });
        break;

      case "nelly":
        // Petting the dog always helps!
        store.adjustSanity(+15);
        store.addScore(25);
        store.setMessage("🐕 Good girl, Nelly! (+15 Sanity)");
        this.time.delayedCall(1500, () => store.setMessage(null));
        // Can pet again after cooldown
        obj.active = false;
        this.time.delayedCall(5000, () => {
          obj.active = true;
        });
        break;

      case "server":
        // Handled in hold interaction
        break;
    }
  }

  private checkWinCondition() {
    const store = useGameStore.getState();
    const trashLeft = this.objects.filter((o) => o.type === "trash" && o.active).length;

    if (trashLeft === 0 && store.mission === "Clean up the remaining mess") {
      store.setMission("Mission Complete!");
      store.setGameState("won");
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(500, 46, 204, 113, false);
    }
  }
}
