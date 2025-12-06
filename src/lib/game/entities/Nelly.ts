import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { Respawnable } from "../extensions/Respawnable";
import { useGameStore } from "@/lib/state/gameStore";

const PET_COOLDOWN_MS = 5000;

/**
 * Nelly the dog entity - petting gives sanity boost
 * Can be pet again after a short cooldown
 */
export class Nelly extends Entity {
  public width: number;
  public height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 50,
    height: number = 40
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
    // Create invisible interaction zone (could add dog sprite here)
    this.sprite = this.scene.add
      .rectangle(this.x, this.y, this.width, this.height, 0x8b4513, 0)
      .setDepth(1);
    
    this.scene.physics.add.existing(this.sprite, true);
  }

  private setupExtensions(): void {
    // Cooldown for petting
    const respawnable = this.addExtension(
      new Respawnable({
        respawnDelay: PET_COOLDOWN_MS,
        onRespawn: () => {
          // Nelly is ready to be pet again!
        },
      })
    );

    // Instant interaction
    this.addExtension(
      new Interactable({
        promptText: "[E] Pet Nelly",
        radius: 60,
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
          
          // Start cooldown
          respawnable.deactivateAndRespawn();
        },
      })
    );
  }

  update(delta: number): void {
    super.update(delta);
  }
}

