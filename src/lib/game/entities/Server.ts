import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { HoldInteractable } from "../extensions/HoldInteractable";
import { useGameStore } from "@/lib/state/gameStore";

const SERVER_HOLD_MS = 1200;

/**
 * Server entity - requires hold interaction to boot up
 * Primary objective in the game
 */
export class Server extends Entity {
  public width: number;
  public height: number;
  
  /** Progress bar graphics */
  private progressBar?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 80,
    height: number = 50
  ) {
    super(scene);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.createSprite();
    this.setupExtensions();
  }

  createSprite(): void {
    // Create invisible interaction zone
    this.sprite = this.scene.add
      .rectangle(this.x, this.y, this.width, this.height, 0x222222, 0)
      .setDepth(1);
    
    this.scene.physics.add.existing(this.sprite, true);
    
    // Create progress bar graphics
    this.progressBar = this.scene.add.graphics().setDepth(101);
  }

  private setupExtensions(): void {
    this.addExtension(
      new HoldInteractable({
        promptText: "[E] Hold to Boot",
        holdDuration: SERVER_HOLD_MS,
        radius: 60,
        canInteract: () => {
          const store = useGameStore.getState();
          return store.mission === "Boot up the main server";
        },
        onProgress: (_, progress) => {
          this.drawProgressBar(progress);
        },
        onComplete: (entity) => {
          const store = useGameStore.getState();
          
          // Deactivate server (objective complete)
          entity.active = false;
          
          // Apply effects
          store.addScore(500);
          store.setMission("Clean up the remaining mess");
          store.setMessage("🖥️ SERVER ONLINE!");
          
          // Clear message after delay
          this.scene.time.delayedCall(2000, () => store.setMessage(null));
          
          // Camera effects
          this.scene.cameras.main.flash(200, 102, 252, 241, false);
          
          // Clear progress bar
          this.clearProgressBar();
        },
        onCancel: () => {
          this.clearProgressBar();
        },
      })
    );
  }

  private drawProgressBar(progress: number): void {
    if (!this.progressBar) return;
    
    this.progressBar.clear();
    
    // Background
    this.progressBar.fillStyle(0x1a1410, 0.9);
    this.progressBar.fillRect(this.x - 30, this.y - 50, 60, 10);
    
    // Progress fill
    this.progressBar.fillStyle(0x66fcf1, 1);
    this.progressBar.fillRect(this.x - 28, this.y - 48, 56 * progress, 6);
  }

  private clearProgressBar(): void {
    this.progressBar?.clear();
  }

  /**
   * Get the hold interactable extension for external control
   */
  getHoldInteractable(): HoldInteractable | undefined {
    return this.getExtension(HoldInteractable);
  }

  destroy(): void {
    this.progressBar?.destroy();
    super.destroy();
  }
}

