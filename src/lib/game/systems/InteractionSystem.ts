import * as Phaser from "phaser";
import type { Entity } from "../entities/Entity";
import { Interactable } from "../extensions/Interactable";
import { HoldInteractable } from "../extensions/HoldInteractable";

/**
 * InteractionSystem - handles player proximity detection and interaction prompts
 * Manages both instant and hold interactions across all entities
 */
export class InteractionSystem {
  private scene: Phaser.Scene;
  private entities: () => Entity[];
  private player: () => { x: number; y: number } | null;
  
  private prompt!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private currentTarget: Entity | null = null;
  private currentHoldable: HoldInteractable | null = null;

  constructor(
    scene: Phaser.Scene,
    entityGetter: () => Entity[],
    playerGetter: () => { x: number; y: number } | null
  ) {
    this.scene = scene;
    this.entities = entityGetter;
    this.player = playerGetter;
    
    this.createUI();
  }

  private createUI(): void {
    // Interaction prompt
    this.prompt = this.scene.add
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

    // Progress bar for hold interactions
    this.progressBar = this.scene.add.graphics().setDepth(101);
  }

  /**
   * Update the interaction system - call every frame
   */
  update(delta: number, interactKeyDown: boolean, interactKeyJustDown: boolean): void {
    const playerPos = this.player();
    if (!playerPos) {
      this.hidePrompt();
      return;
    }

    // Find nearest interactable entity
    const target = this.findNearestInteractable(playerPos);
    
    if (!target) {
      this.hidePrompt();
      this.cancelCurrentHold();
      return;
    }

    // Get interaction extensions
    const interactable = target.entity.getExtension(Interactable);
    const holdInteractable = target.entity.getExtension(HoldInteractable);

    // Update current target
    this.currentTarget = target.entity;

    // Position and show prompt
    this.prompt.setPosition(target.entity.x, target.entity.y - 35);
    this.prompt.setVisible(true);

    // Handle hold interaction (takes priority)
    if (holdInteractable && holdInteractable.canInteract()) {
      this.prompt.setText(holdInteractable.promptText);
      
      if (interactKeyDown) {
        if (!holdInteractable.getIsHolding()) {
          holdInteractable.startHold();
          this.currentHoldable = holdInteractable;
        }
        
        const completed = holdInteractable.continueHold(delta);
        if (!completed) {
          this.drawProgressBar(target.entity, holdInteractable.getProgress());
        } else {
          this.progressBar.clear();
          this.currentHoldable = null;
        }
      } else {
        holdInteractable.cancelHold();
        this.progressBar.clear();
        this.currentHoldable = null;
      }
      return;
    }

    // Handle instant interaction
    if (interactable && interactable.canInteract()) {
      this.prompt.setText(interactable.promptText);
      
      if (interactKeyJustDown) {
        interactable.interact();
      }
    }
  }

  /**
   * Find the nearest entity with an interactable extension
   */
  private findNearestInteractable(
    playerPos: { x: number; y: number }
  ): { entity: Entity; distance: number } | null {
    const candidates = this.entities()
      .filter((entity) => {
        if (!entity.active) return false;
        
        const interactable = entity.getExtension(Interactable);
        const holdInteractable = entity.getExtension(HoldInteractable);
        
        if (!interactable && !holdInteractable) return false;
        
        // Check if at least one interaction is possible
        const canInstant = interactable?.canInteract() ?? false;
        const canHold = holdInteractable?.canInteract() ?? false;
        
        return canInstant || canHold;
      })
      .map((entity) => {
        const distance = Phaser.Math.Distance.Between(
          playerPos.x,
          playerPos.y,
          entity.x,
          entity.y
        );
        
        const interactable = entity.getExtension(Interactable);
        const holdInteractable = entity.getExtension(HoldInteractable);
        const radius = holdInteractable?.radius ?? interactable?.radius ?? 60;
        
        return { entity, distance, radius };
      })
      .filter((item) => item.distance < item.radius)
      .sort((a, b) => a.distance - b.distance);

    return candidates[0] ?? null;
  }

  private drawProgressBar(entity: Entity, progress: number): void {
    this.progressBar.clear();
    
    // Background
    this.progressBar.fillStyle(0x1a1410, 0.9);
    this.progressBar.fillRect(entity.x - 30, entity.y - 50, 60, 10);
    
    // Progress fill
    this.progressBar.fillStyle(0x66fcf1, 1);
    this.progressBar.fillRect(entity.x - 28, entity.y - 48, 56 * progress, 6);
  }

  private hidePrompt(): void {
    this.prompt.setVisible(false);
    this.progressBar.clear();
    this.currentTarget = null;
  }

  private cancelCurrentHold(): void {
    if (this.currentHoldable) {
      this.currentHoldable.cancelHold();
      this.currentHoldable = null;
    }
  }

  /**
   * Get the current interaction target
   */
  getCurrentTarget(): Entity | null {
    return this.currentTarget;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.prompt.destroy();
    this.progressBar.destroy();
  }
}

