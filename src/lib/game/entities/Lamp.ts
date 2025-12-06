import * as Phaser from "phaser";
import { Entity } from "./Entity";
import { Interactable } from "../extensions/Interactable";
import { Occludable } from "../extensions/Occludable";

/**
 * Lamp entity - Interactive light source that can be turned on/off
 * 
 * Features:
 * - Toggle on/off with E key
 * - Glowing effect when on
 * - Player walks behind it (occlusion)
 */
export class Lamp extends Entity {
  private lampSprite!: Phaser.GameObjects.Sprite;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private glowTween?: Phaser.Tweens.Tween;
  private lightCircle?: Phaser.GameObjects.Ellipse;
  private interactableExtension!: Interactable;
  
  /** Is the lamp currently on? */
  public isOn: boolean = true;
  
  /** Glow intensity (0-1) for animation */
  private glowIntensity: number = 0.6;
  
  /** Scale of the lamp sprite */
  public scale: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number = 0.5
  ) {
    super(scene);
    this.x = x;
    this.y = y;
    this.scale = scale;
    
    this.createSprite();
    this.createGlowEffect();
    this.setupExtensions();
    this.startGlowAnimation();
  }

  /**
   * Static method to preload lamp assets
   */
  static preload(scene: Phaser.Scene): void {
    scene.load.image("sprite-lamp", "/assets/sprite-lamp.png");
  }

  createSprite(): void {
    // Create the lamp sprite
    if (this.scene.textures.exists("sprite-lamp")) {
      this.lampSprite = this.scene.add.sprite(this.x, this.y, "sprite-lamp");
      this.lampSprite.setScale(this.scale);
      this.lampSprite.setOrigin(0.5, 1); // Bottom-center origin for proper positioning
    } else {
      // Fallback rectangle
      const g = this.scene.add.graphics();
      g.fillStyle(0xffd700, 1);
      g.fillRect(0, 0, 40, 120);
      g.generateTexture("lamp-fallback", 40, 120);
      g.destroy();
      
      this.lampSprite = this.scene.add.sprite(this.x, this.y, "lamp-fallback");
      this.lampSprite.setOrigin(0.5, 1);
    }
    
    this.sprite = this.lampSprite;
  }

  private createGlowEffect(): void {
    // Create a graphics object for the glow
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setDepth(this.lampSprite.depth - 1); // Behind the lamp
    
    // Create a light circle/ellipse for ambient light effect
    const glowRadius = 150 * this.scale;
    this.lightCircle = this.scene.add.ellipse(
      this.x,
      this.y - (this.lampSprite.displayHeight * 0.6), // Position at lamp head
      glowRadius * 2,
      glowRadius * 1.5,
      0xffdd88,
      0.3
    );
    this.lightCircle.setDepth(1); // Below most objects
    this.lightCircle.setBlendMode(Phaser.BlendModes.ADD);
    
    // Initial glow state
    this.updateGlow();
  }

  private updateGlow(): void {
    this.glowGraphics.clear();
    
    if (!this.isOn) {
      this.lightCircle?.setVisible(false);
      // Dim the lamp sprite when off
      this.lampSprite.setTint(0x666666);
      return;
    }
    
    // Lamp is on - show glow
    this.lightCircle?.setVisible(true);
    this.lampSprite.clearTint();
    
    // Update light circle alpha based on glow intensity
    if (this.lightCircle) {
      this.lightCircle.setAlpha(0.2 + this.glowIntensity * 0.3);
    }
    
    // Draw radial glow around lamp head
    const lampHeadY = this.y - (this.lampSprite.displayHeight * 0.75);
    const glowColor = 0xffdd88;
    
    // Multiple layers of glow for softer effect
    for (let i = 3; i >= 1; i--) {
      const radius = 40 * this.scale * i;
      const alpha = (0.1 + this.glowIntensity * 0.15) / i;
      
      this.glowGraphics.fillStyle(glowColor, alpha);
      this.glowGraphics.fillCircle(this.x, lampHeadY, radius);
    }
  }

  private startGlowAnimation(): void {
    // Animate the glow intensity for a flickering effect
    this.glowTween = this.scene.tweens.add({
      targets: this,
      glowIntensity: { from: 0.4, to: 0.8 },
      duration: 1500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.isOn) {
          this.updateGlow();
        }
      },
    });
  }

  private setupExtensions(): void {
    // Interactable - toggle on/off
    this.interactableExtension = new Interactable({
      promptText: this.isOn ? "[E] Turn Off" : "[E] Turn On",
      radius: 100,
      onInteract: () => {
        this.toggle();
      },
    });
    this.addExtension(this.interactableExtension);

    // Occludable for depth sorting - player walks BEHIND the lamp
    // Use a negative offset so the lamp's sort point is near its base
    this.addExtension(
      new Occludable({
        sortYOffset: -20, // Sort point near the base
        baseDepth: 0,
      })
    );
  }

  /**
   * Toggle the lamp on/off
   */
  toggle(): void {
    this.isOn = !this.isOn;
    this.updateGlow();
    
    // Update the interaction prompt
    this.interactableExtension.setPromptText(this.isOn ? "[E] Turn Off" : "[E] Turn On");
    
    // Visual/audio feedback
    this.scene.cameras.main.flash(50, 255, 221, 136, false);
  }

  /**
   * Turn the lamp on
   */
  turnOn(): void {
    if (!this.isOn) {
      this.toggle();
    }
  }

  /**
   * Turn the lamp off
   */
  turnOff(): void {
    if (this.isOn) {
      this.toggle();
    }
  }

  update(delta: number): void {
    super.update(delta);
  }

  destroy(): void {
    this.glowTween?.destroy();
    this.glowGraphics?.destroy();
    this.lightCircle?.destroy();
    super.destroy();
  }
}

