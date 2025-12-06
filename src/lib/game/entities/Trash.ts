import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { useGameStore } from "@/lib/state/gameStore";

/**
 * Trash entity - can be cleaned up for sanity boost and score
 */
export class Trash extends Entity {
  public width: number;
  public height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 30,
    height: number = 30
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
      .rectangle(this.x, this.y, this.width, this.height, 0x553322, 0)
      .setDepth(1);
    
    this.scene.physics.add.existing(this.sprite, true);
  }

  private setupExtensions(): void {
    this.addExtension(
      new Interactable({
        promptText: "[E] Clean Up",
        radius: 60,
        onInteract: (entity) => {
          const store = useGameStore.getState();
          
          // Deactivate trash
          entity.active = false;
          if (this.sprite && "setVisible" in this.sprite) {
            (this.sprite as Phaser.GameObjects.Rectangle).setVisible(false);
          }
          
          // Apply effects
          store.adjustSanity(+10);
          store.addScore(50);
          store.setMessage("🗑️ Cleaned up! (+10 Sanity)");
          
          // Clear message after delay
          this.scene.time.delayedCall(1500, () => store.setMessage(null));
          
          // Camera flash feedback
          this.scene.cameras.main.flash(80, 102, 252, 241, false);
        },
      })
    );
  }

  /**
   * Check if this is the last active trash - for win condition
   */
  static countActiveTrash(entities: Entity[]): number {
    return entities.filter(
      (e) => e instanceof Trash && e.active
    ).length;
  }
}

