import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { Respawnable } from "../extensions/Respawnable";
import { useGameStore } from "@/lib/state/gameStore";

const COFFEE_RESPAWN_MS = 12000;

/**
 * Coffee entity - restores sanity and stamina, gives speed buff
 */
export class Coffee extends Entity {
  public width: number;
  public height: number;
  
  /** Callback for speed buff - set by scene */
  public onSpeedBuff?: (durationMs: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 25,
    height: number = 25
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
    // Create invisible interaction zone (could add sprite here later)
    this.sprite = this.scene.add
      .rectangle(this.x, this.y, this.width, this.height, 0x6f4e37, 0)
      .setDepth(1);
    
    this.scene.physics.add.existing(this.sprite, true);
  }

  private setupExtensions(): void {
    // Respawn after consumption
    const respawnable = this.addExtension(
      new Respawnable({
        respawnDelay: COFFEE_RESPAWN_MS,
        onRespawn: () => {
          // Could add spawn animation here
        },
      })
    );

    // Instant interaction
    this.addExtension(
      new Interactable({
        promptText: "[E] Drink Coffee",
        radius: 60,
        onInteract: () => {
          const store = useGameStore.getState();
          
          // Apply effects
          store.adjustSanity(+25);
          store.adjustStamina(+1000); // Full refill
          store.setMessage("☕ Energy Restored!");
          
          // Trigger speed buff via callback
          this.onSpeedBuff?.(5000);
          
          // Clear message after delay
          this.scene.time.delayedCall(1500, () => store.setMessage(null));
          
          // Camera flash feedback
          this.scene.cameras.main.flash(80, 102, 252, 241, false);
          
          // Deactivate and start respawn timer
          respawnable.deactivateAndRespawn();
        },
      })
    );
  }

  update(delta: number): void {
    super.update(delta);
  }
}

