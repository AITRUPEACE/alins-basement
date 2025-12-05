import * as Phaser from "phaser";
import { useGameStore } from "@/lib/state/gameStore";

const BASE_SPEED = 180;
const SPRINT_MULTIPLIER = 1.5;
const STAMINA_DRAIN_PER_MS = 0.08;
const STAMINA_REGEN_PER_MS = 0.04;
const SANITY_DRAIN_INTERVAL_MS = 1000;
const SANITY_DRAIN_PER_TICK = 0.5;
const INTERACT_RADIUS = 72;
const SERVER_HOLD_MS = 1200;
const COFFEE_BUFF_MS = 5000;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys & {
    shift?: Phaser.Input.Keyboard.Key;
  };
  private sanityTimer = 0;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private objects: {
    sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
    type: "trash" | "computer" | "server" | "coffee";
    active: boolean;
  }[] = [];
  private holdTarget: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | null = null;
  private holdTimer = 0;
  private speedBuffTimer = 0;
  private lastPhase: string | null = null;
  private interactPrompt!: Phaser.GameObjects.Text;
  private holdProgressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super("MainScene");
  }

  preload() {
    // Load player sprite
    this.load.image("alin", "/assets/alin.png");
  }

  create() {
    const store = useGameStore.getState();
    store.setGameState("menu");

    const { width, height } = this.scale;

    // Create basement background
    this.createBasementBackground();

    // Create walls
    this.createWalls();

    // Check if sprite loaded, otherwise create fallback
    if (this.textures.exists("alin")) {
      this.player = this.physics.add
        .sprite(width / 2, height / 2, "alin")
        .setScale(2)
        .setDepth(10);
    } else {
      // Fallback: create a placeholder texture
      const g = this.add.graphics();
      g.fillStyle(0x3498db, 1);
      g.fillRect(0, 0, 24, 32);
      // Head
      g.fillStyle(0xf1c27d, 1);
      g.fillRect(4, -8, 16, 12);
      // Hair
      g.fillStyle(0x4a3000, 1);
      g.fillRect(2, -10, 20, 6);
      g.generateTexture("player-fallback", 24, 32);
      g.destroy();

      this.player = this.physics.add
        .sprite(width / 2, height / 2, "player-fallback")
        .setScale(2)
        .setDepth(10);
    }

    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(24, 28);

    // Input setup
    this.cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as typeof this.cursors;
    
    this.interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // Interaction prompt
    this.interactPrompt = this.add
      .text(0, 0, "[E] Interact", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#66fcf1",
        backgroundColor: "#1a1410",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // Hold progress bar
    this.holdProgressBar = this.add.graphics().setDepth(21);

    // Spawn interactive objects
    this.spawnObjects();

    this.lastPhase = store.gameState;
  }

  update(_: number, delta: number) {
    const store = useGameStore.getState();
    
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

    let speed = BASE_SPEED;
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

    // Low sanity effects
    if (store.sanity < 30) {
      this.cameras.main.setAlpha(0.9 + Math.sin(this.time.now / 200) * 0.1);
    } else {
      this.cameras.main.setAlpha(1);
    }

    this.handleInteraction(delta);
  }

  private createBasementBackground() {
    const { width, height } = this.scale;

    // Dark floor
    const floor = this.add.graphics();
    floor.fillStyle(0x1a1410, 1);
    floor.fillRect(0, 0, width, height);

    // Brick wall pattern
    const bricks = this.add.graphics();
    bricks.lineStyle(1, 0x3a2618, 0.3);
    
    const brickW = 48;
    const brickH = 24;
    for (let y = 0; y < height; y += brickH) {
      const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
      for (let x = -brickW + offset; x < width + brickW; x += brickW) {
        bricks.strokeRect(x, y, brickW, brickH);
      }
    }

    // Floor grid overlay
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a1f18, 0.4);
    const step = 48;
    for (let x = 0; x < width; x += step) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += step) {
      grid.lineBetween(0, y, width, y);
    }

    // Ambient dust effect using graphics instead of particles (avoids texture issues)
    // We'll skip particles for now to avoid undefined texture errors
  }

  private resetScene() {
    const store = useGameStore.getState();
    store.reset();
    this.sanityTimer = 0;
    this.holdTimer = 0;
    this.holdTarget = null;
    this.speedBuffTimer = 0;
    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.player.setVelocity(0, 0);
    this.objects.forEach((obj) => obj.sprite.destroy());
    this.objects = [];
    this.spawnObjects();
  }

  private createWalls() {
    const { width, height } = this.scale;
    const thickness = 32;

    // Draw visible walls
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x3a2618, 1);
    wallGraphics.fillRect(0, 0, width, thickness); // Top
    wallGraphics.fillRect(0, height - thickness, width, thickness); // Bottom
    wallGraphics.fillRect(0, 0, thickness, height); // Left
    wallGraphics.fillRect(width - thickness, 0, thickness, height); // Right

    // Darker border lines
    wallGraphics.lineStyle(2, 0x1a1410, 1);
    wallGraphics.strokeRect(thickness, thickness, width - thickness * 2, height - thickness * 2);

    // Use world bounds for collision instead of static group
    // Player already has setCollideWorldBounds(true)
    // Adjust world bounds to account for wall thickness
    this.physics.world.setBounds(
      thickness,
      thickness,
      width - thickness * 2,
      height - thickness * 2
    );
  }

  private spawnObjects() {
    const coords = [
      { x: 120, y: 120, type: "computer" as const },
      { x: 220, y: 380, type: "trash" as const },
      { x: 450, y: 160, type: "trash" as const },
      { x: 780, y: 120, type: "server" as const },
      { x: 600, y: 420, type: "coffee" as const },
    ];

    coords.forEach(({ x, y, type }) => {
      const sprite = this.add
        .rectangle(x, y, 40, type === "server" ? 80 : 40, this.colorFor(type))
        .setStrokeStyle(2, 0x1a1410)
        .setDepth(1);
      
      // Add icon/label
      const label = this.add
        .text(x, y, this.iconFor(type), {
          fontFamily: "monospace",
          fontSize: type === "server" ? "24px" : "16px",
          color: "#fff",
        })
        .setOrigin(0.5)
        .setDepth(2);

      this.physics.add.existing(sprite, true);
      this.objects.push({ sprite, type, active: true });
    });
  }

  private colorFor(type: "trash" | "computer" | "server" | "coffee") {
    switch (type) {
      case "trash": return 0x553322;
      case "computer": return 0x334455;
      case "server": return 0x222222;
      case "coffee": return 0x6f4e37;
    }
  }

  private iconFor(type: "trash" | "computer" | "server" | "coffee") {
    switch (type) {
      case "trash": return "🗑";
      case "computer": return "💻";
      case "server": return "🖥";
      case "coffee": return "☕";
    }
  }

  private handleInteraction(delta: number) {
    if (!this.player) return;
    const store = useGameStore.getState();
    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // Find nearest active object
    let nearest: (typeof this.objects)[number] | null = null;
    let nearestDist = Number.MAX_VALUE;
    
    this.objects.forEach((obj) => {
      if (!obj.active) return;
      const dist = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        obj.sprite.x, obj.sprite.y
      );
      if (dist < INTERACT_RADIUS && dist < nearestDist) {
        nearest = obj;
        nearestDist = dist;
      }
    });

    // Update interaction prompt
    if (nearest) {
      this.interactPrompt.setPosition(nearest.sprite.x, nearest.sprite.y - 50);
      this.interactPrompt.setVisible(true);
      
      if (nearest.type === "server" && store.mission === "Boot up the main server") {
        this.interactPrompt.setText("[E] Hold to Boot");
      } else {
        this.interactPrompt.setText("[E] Interact");
      }
    } else {
      this.interactPrompt.setVisible(false);
      this.holdProgressBar.clear();
      this.holdTarget = null;
      this.holdTimer = 0;
      return;
    }

    const isHolding = this.interactKey.isDown;

    // Server requires hold
    if (nearest.type === "server") {
      if (isHolding && store.mission === "Boot up the main server") {
        if (this.holdTarget !== nearest.sprite) {
          this.holdTarget = nearest.sprite;
          this.holdTimer = 0;
        }
        this.holdTimer += delta;
        
        // Draw progress bar
        const progress = Math.min(this.holdTimer / SERVER_HOLD_MS, 1);
        this.holdProgressBar.clear();
        this.holdProgressBar.fillStyle(0x1a1410, 0.8);
        this.holdProgressBar.fillRect(nearest.sprite.x - 30, nearest.sprite.y - 65, 60, 8);
        this.holdProgressBar.fillStyle(0x66fcf1, 1);
        this.holdProgressBar.fillRect(nearest.sprite.x - 28, nearest.sprite.y - 63, 56 * progress, 4);

        if (this.holdTimer >= SERVER_HOLD_MS) {
          nearest.active = false;
          (nearest.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0x00aa00);
          store.addScore(500);
          store.setMission("Clean up the remaining mess");
          store.setMessage("SERVER ONLINE!");
          this.time.delayedCall(2000, () => store.setMessage(null));
          this.holdTimer = 0;
          this.holdTarget = null;
          this.holdProgressBar.clear();
          
          // Particle burst
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
      this.doInteraction(nearest);
    }
  }

  private doInteraction(obj: (typeof this.objects)[number]) {
    const store = useGameStore.getState();

    // Visual feedback - flash effect instead of particles
    this.cameras.main.flash(100, 102, 252, 241, false, (_: unknown, progress: number) => {
      if (progress === 1) return;
    });

    switch (obj.type) {
      case "trash":
        obj.active = false;
        obj.sprite.setVisible(false);
        store.adjustSanity(+10);
        store.addScore(50);
        store.setMessage("Cleaned Trash (+10 Sanity)");
        this.time.delayedCall(1500, () => store.setMessage(null));
        this.checkWinCondition();
        break;

      case "computer":
        store.adjustSanity(-5);
        store.addScore(20);
        store.setMessage("Fixed Bug (-5 Sanity)");
        this.cameras.main.shake(100, 0.002);
        this.time.delayedCall(1500, () => store.setMessage(null));
        break;

      case "coffee":
        obj.active = false;
        (obj.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0x2ecc71);
        store.adjustSanity(+25);
        store.adjustStamina(+1000);
        this.speedBuffTimer = COFFEE_BUFF_MS;
        store.setMessage("☕ Energy Restored!");
        this.time.delayedCall(1500, () => store.setMessage(null));
        
        // Respawn coffee
        this.time.delayedCall(10000, () => {
          obj.active = true;
          obj.sprite.setVisible(true);
          (obj.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0x6f4e37);
        });
        break;
    }
  }

  private checkWinCondition() {
    const store = useGameStore.getState();
    const trashLeft = this.objects.filter(o => o.type === "trash" && o.active).length;
    
    if (trashLeft === 0 && store.mission === "Clean up the remaining mess") {
      store.setMission("Mission Complete!");
      store.setGameState("won");
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(500, 46, 204, 113, false);
    }
  }
}
