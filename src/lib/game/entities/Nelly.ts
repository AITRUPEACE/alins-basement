import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { Controllable } from "../extensions/Controllable";
import { Occludable } from "../extensions/Occludable";
import { useGameStore } from "@/lib/state/gameStore";

const NELLY_SPEED = 500; // Dogs are fast!
const NELLY_SPRINT_MULTIPLIER = 1.8;

/**
 * Nelly the dog entity - can be petted OR controlled!
 * 
 * - Click on Nelly to take control and run around as a dog
 * - When not controlled, Alin can pet Nelly for sanity boost
 * - Nelly has her own sprint animation
 */
export class Nelly extends Entity {
  public width: number;
  public height: number;
  
  /** Reference to the physics sprite */
  public nellySprite!: Phaser.Physics.Arcade.Sprite;
  
  /** Callback when control state changes */
  public onControlChange?: (isControlled: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 100,
    height: number = 80
  ) {
    super(scene);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.createSprite();
    this.setupExtensions();
    this.setupClickHandler();
  }

  /**
   * Static method to preload Nelly's assets
   * Call this in the scene's preload method
   */
  static preload(scene: Phaser.Scene): void {
    // Load Nelly sprinting spritesheet
    scene.load.atlas(
      "nelly",
      "/assets/aseprite/spritesheets/spritesheet-nelly-sprintingt.png",
      "/assets/aseprite/spritesheets/nelly-sprinting.json"
    );
  }

  /**
   * Static method to create Nelly's animations
   * Call this in the scene's create method after preload
   */
  static createAnimations(scene: Phaser.Scene): void {
    // Don't create if already exists
    if (scene.anims.exists("nelly-run")) return;

    // Run/sprint animation (4 frames)
    scene.anims.create({
      key: "nelly-run",
      frames: [
        { key: "nelly", frame: "Gemini_Generated_Image_h249ddh249ddh249 0.png" },
        { key: "nelly", frame: "Gemini_Generated_Image_h249ddh249ddh249 1.png" },
        { key: "nelly", frame: "Gemini_Generated_Image_h249ddh249ddh249 2.png" },
        { key: "nelly", frame: "Gemini_Generated_Image_h249ddh249ddh249 3.png" },
      ],
      frameRate: 12,
      repeat: -1,
    });

    // Idle animation (first frame)
    scene.anims.create({
      key: "nelly-idle",
      frames: [{ key: "nelly", frame: "Gemini_Generated_Image_h249ddh249ddh249 0.png" }],
      frameRate: 1,
    });
  }

  createSprite(): void {
    // Check if nelly texture exists
    if (this.scene.textures.exists("nelly")) {
      // Create physics sprite with Nelly's spritesheet
      this.nellySprite = this.scene.physics.add
        .sprite(this.x, this.y, "nelly", "Gemini_Generated_Image_h249ddh249ddh249 0.png")
        .setScale(0.1) // Scale down from 1072x992 to reasonable size
        .setDepth(50);
      
      // Set physics body size (smaller than visual for better collision)
      this.nellySprite.body?.setSize(600, 500);
      this.nellySprite.body?.setOffset(236, 350);
      
      // Enable world bounds collision
      this.nellySprite.setCollideWorldBounds(true);
      
      // Play idle animation
      this.nellySprite.play("nelly-idle");
    } else {
      // Fallback: create a brown rectangle representing Nelly
      const g = this.scene.add.graphics();
      g.fillStyle(0xd2691e, 1); // Chocolate brown
      g.fillRoundedRect(0, 0, 60, 40, 8);
      g.fillStyle(0x8b4513, 1);
      g.fillCircle(55, 15, 8); // Head
      g.generateTexture("nelly-fallback", 70, 50);
      g.destroy();

      this.nellySprite = this.scene.physics.add
        .sprite(this.x, this.y, "nelly-fallback")
        .setScale(1)
        .setDepth(50);
      
      this.nellySprite.setCollideWorldBounds(true);
    }

    // Store reference in parent class
    this.sprite = this.nellySprite;
  }

  private setupExtensions(): void {
    // Controllable extension - allows Nelly to be controlled
    const controllable = this.addExtension(
      new Controllable({
        speed: NELLY_SPEED,
        sprintMultiplier: NELLY_SPRINT_MULTIPLIER,
        walkAnimKey: "nelly-run",
        idleAnimKey: "nelly-idle",
        onTakeControl: () => {
          const store = useGameStore.getState();
          store.setMessage("🐕 You're now controlling Nelly! Woof!");
          this.scene.time.delayedCall(2000, () => store.setMessage(null));
          this.onControlChange?.(true);
        },
        onReleaseControl: () => {
          const store = useGameStore.getState();
          store.setMessage("👤 Back to Alin!");
          this.scene.time.delayedCall(1500, () => store.setMessage(null));
          this.onControlChange?.(false);
        },
      })
    );

    // Interactable extension - for petting when not controlled
    this.addExtension(
      new Interactable({
        promptText: "[E] Pet Nelly / [Click] Control",
        radius: 80,
        canInteract: () => !controllable.isControlled,
        onInteract: () => {
          const store = useGameStore.getState();
          
          // Petting the dog always helps!
          store.adjustSanity(+15);
          store.addScore(25);
          store.setMessage("🐕 Good girl, Nelly! (+15 Sanity)");
          
          // Clear message after delay
          this.scene.time.delayedCall(1500, () => store.setMessage(null));
          
          // Camera flash feedback
          this.scene.cameras.main.flash(80, 102, 252, 241, false);
        },
      })
    );

    // Occludable extension for depth sorting
    this.addExtension(
      new Occludable({
        sortYOffset: 20, // Sort based on feet position
        baseDepth: 0,
      })
    );
  }

  private setupClickHandler(): void {
    // Make Nelly clickable
    this.nellySprite.setInteractive({ useHandCursor: true });
    
    this.nellySprite.on("pointerdown", () => {
      const controllable = this.getExtension(Controllable);
      if (controllable && !controllable.isControlled) {
        // Request control switch via callback
        this.onControlChange?.(true);
      }
    });
    
    // Visual feedback on hover
    this.nellySprite.on("pointerover", () => {
      const controllable = this.getExtension(Controllable);
      if (!controllable?.isControlled) {
        this.nellySprite.setTint(0xaaaaff);
      }
    });
    
    this.nellySprite.on("pointerout", () => {
      this.nellySprite.clearTint();
    });
  }

  /**
   * Get the controllable extension
   */
  getControllable(): Controllable | undefined {
    return this.getExtension(Controllable);
  }

  /**
   * Check if Nelly is currently being controlled
   */
  isControlled(): boolean {
    return this.getExtension(Controllable)?.isControlled ?? false;
  }

  /**
   * Take control of Nelly
   */
  takeControl(): void {
    this.getExtension(Controllable)?.takeControl();
  }

  /**
   * Release control of Nelly
   */
  releaseControl(): void {
    this.getExtension(Controllable)?.releaseControl();
  }

  /**
   * Handle movement input when controlled
   */
  handleInput(left: boolean, right: boolean, up: boolean, down: boolean, sprint: boolean): void {
    this.getExtension(Controllable)?.handleInput(left, right, up, down, sprint);
  }

  /**
   * Update depth for occlusion
   */
  updateDepth(): void {
    this.getExtension(Controllable)?.updateDepth();
  }

  /**
   * Set up collision with walls
   */
  setCollisionWith(walls: Phaser.Physics.Arcade.StaticGroup): void {
    this.scene.physics.add.collider(this.nellySprite, walls);
  }

  update(delta: number): void {
    super.update(delta);
    
    // Update entity position from sprite
    if (this.nellySprite) {
      this.x = this.nellySprite.x;
      this.y = this.nellySprite.y;
    }
  }
}
