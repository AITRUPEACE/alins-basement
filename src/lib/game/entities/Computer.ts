import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { useGameStore } from "@/lib/state/gameStore";

/**
 * Computer entity - fixing bugs gives score but drains sanity slightly
 */
export class Computer extends Entity {
  public width: number;
  public height: number;

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
      .rectangle(this.x, this.y, this.width, this.height, 0x445566, 0)
      .setDepth(1);
    
    this.scene.physics.add.existing(this.sprite, true);
  }

  private setupExtensions(): void {
    this.addExtension(
      new Interactable({
        promptText: "[E] Fix Bug",
        radius: 60,
        onInteract: () => {
          const store = useGameStore.getState();
          
          // Fixing bugs is mentally draining!
          store.adjustSanity(-5);
          store.addScore(20);
          store.setMessage("💻 Fixed Bug (-5 Sanity)");
          
          // Screen shake feedback
          this.scene.cameras.main.shake(100, 0.002);
          
          // Clear message after delay
          this.scene.time.delayedCall(1500, () => store.setMessage(null));
          
          // Camera flash feedback
          this.scene.cameras.main.flash(80, 102, 252, 241, false);
        },
      })
    );
  }
}

