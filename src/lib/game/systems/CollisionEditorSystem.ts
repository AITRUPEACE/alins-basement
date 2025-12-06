import * as Phaser from "phaser";

/**
 * Collision box data structure
 */
export interface CollisionBoxData {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Editor API exposed to React
 */
export interface CollisionEditorAPI {
  setBoxes: (boxes: CollisionBoxData[]) => void;
  getBoxes: () => CollisionBoxData[];
  setEditorMode: (enabled: boolean) => void;
  deleteSelected: () => void;
  clearAll: () => void;
}

/**
 * Callback for when boxes change
 */
export type OnBoxesChangeCallback = (boxes: CollisionBoxData[]) => void;

/**
 * CollisionEditorSystem - handles visual editing of collision boxes
 * Extracted from MainScene for better separation of concerns
 */
export class CollisionEditorSystem {
  private scene: Phaser.Scene;
  private walls: Phaser.Physics.Arcade.StaticGroup;
  
  private editorMode: boolean = false;
  private editorBoxes: CollisionBoxData[] = [];
  private editorVisuals: Phaser.GameObjects.Rectangle[] = [];
  private selectedBoxId: string | null = null;
  
  private isDrawing: boolean = false;
  private drawStart: { x: number; y: number } | null = null;
  private currentDrawBox: Phaser.GameObjects.Rectangle | null = null;
  
  private onBoxesChange?: OnBoxesChangeCallback;

  constructor(
    scene: Phaser.Scene,
    walls: Phaser.Physics.Arcade.StaticGroup,
    initialBoxes: CollisionBoxData[],
    onBoxesChange?: OnBoxesChangeCallback
  ) {
    this.scene = scene;
    this.walls = walls;
    this.editorBoxes = [...initialBoxes];
    this.onBoxesChange = onBoxesChange;
    
    this.setupInput();
    this.exposeAPI();
  }

  private setupInput(): void {
    // Mouse down - start drawing or select
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.editorMode) return;
      
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Check if clicking on existing box
      const clickedBox = this.findBoxAt(worldPoint.x, worldPoint.y);
      if (clickedBox) {
        this.selectedBoxId = clickedBox.id;
        this.renderEditorBoxes();
        return;
      }
      
      // Start drawing new box
      this.isDrawing = true;
      this.drawStart = { x: worldPoint.x, y: worldPoint.y };
      this.selectedBoxId = null;
      this.renderEditorBoxes();
    });

    // Mouse move - update draw preview
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.editorMode || !this.isDrawing || !this.drawStart) return;
      
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      const x = (this.drawStart.x + worldPoint.x) / 2;
      const y = (this.drawStart.y + worldPoint.y) / 2;
      const w = Math.abs(worldPoint.x - this.drawStart.x);
      const h = Math.abs(worldPoint.y - this.drawStart.y);
      
      if (this.currentDrawBox) {
        this.currentDrawBox.destroy();
      }
      this.currentDrawBox = this.scene.add.rectangle(x, y, w, h, 0x00ffff, 0.3)
        .setStrokeStyle(3, 0x00ffff, 1)
        .setDepth(201);
    });

    // Mouse up - finish drawing
    this.scene.input.on("pointerup", () => {
      if (!this.editorMode || !this.isDrawing || !this.drawStart) return;
      
      const pointer = this.scene.input.activePointer;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      const x = Math.round((this.drawStart.x + worldPoint.x) / 2);
      const y = Math.round((this.drawStart.y + worldPoint.y) / 2);
      const w = Math.round(Math.abs(worldPoint.x - this.drawStart.x));
      const h = Math.round(Math.abs(worldPoint.y - this.drawStart.y));
      
      // Only add if box has some size
      if (w > 10 && h > 10) {
        const newBox: CollisionBoxData = {
          id: Math.random().toString(36).substring(2, 11),
          x, y, w, h
        };
        this.editorBoxes.push(newBox);
        this.updateCollisionBoxes();
        this.notifyChange();
      }
      
      this.isDrawing = false;
      this.drawStart = null;
      if (this.currentDrawBox) {
        this.currentDrawBox.destroy();
        this.currentDrawBox = null;
      }
      this.renderEditorBoxes();
    });

    // Delete key handlers
    this.scene.input.keyboard?.on("keydown-DELETE", () => {
      if (this.editorMode && this.selectedBoxId) {
        this.deleteSelected();
      }
    });
    this.scene.input.keyboard?.on("keydown-BACKSPACE", () => {
      if (this.editorMode && this.selectedBoxId) {
        this.deleteSelected();
      }
    });
  }

  private exposeAPI(): void {
    // Expose editor API to window for React integration
    (window as Window & { phaserEditor?: CollisionEditorAPI }).phaserEditor = {
      setBoxes: (boxes: CollisionBoxData[]) => {
        this.editorBoxes = boxes;
        this.renderEditorBoxes();
        this.updateCollisionBoxes();
      },
      getBoxes: () => this.editorBoxes,
      setEditorMode: (enabled: boolean) => {
        this.editorMode = enabled;
        this.renderEditorBoxes();
        if (!enabled) {
          this.selectedBoxId = null;
          this.isDrawing = false;
          this.drawStart = null;
          if (this.currentDrawBox) {
            this.currentDrawBox.destroy();
            this.currentDrawBox = null;
          }
        }
      },
      deleteSelected: () => this.deleteSelected(),
      clearAll: () => this.clearAll(),
    };
  }

  private findBoxAt(x: number, y: number): CollisionBoxData | null {
    for (let i = this.editorBoxes.length - 1; i >= 0; i--) {
      const box = this.editorBoxes[i];
      const left = box.x - box.w / 2;
      const right = box.x + box.w / 2;
      const top = box.y - box.h / 2;
      const bottom = box.y + box.h / 2;
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return box;
      }
    }
    return null;
  }

  private renderEditorBoxes(): void {
    // Clear existing visuals
    this.editorVisuals.forEach(v => v.destroy());
    this.editorVisuals = [];

    if (!this.editorMode) return;

    // Draw each box
    this.editorBoxes.forEach(box => {
      const isSelected = box.id === this.selectedBoxId;
      const rect = this.scene.add.rectangle(
        box.x, box.y, box.w, box.h,
        isSelected ? 0x00ff00 : 0xff0000,
        0.25
      );
      rect.setStrokeStyle(isSelected ? 4 : 2, isSelected ? 0x00ff00 : 0xff0000, 0.8);
      rect.setDepth(199);
      rect.setInteractive();
      this.editorVisuals.push(rect);
    });
  }

  private updateCollisionBoxes(): void {
    // Clear existing collision boxes
    this.walls.clear(true, true);

    // Create new collision boxes
    this.editorBoxes.forEach(({ x, y, w, h }) => {
      const rect = this.scene.add.rectangle(x, y, w, h, 0xff0000, 0.15);
      rect.setStrokeStyle(3, 0xff0000, 0.8);
      rect.setDepth(100);
      rect.setOrigin(0, 0);
      rect.setPosition(x - w / 2, y - h / 2);
      
      this.scene.physics.add.existing(rect, true);
      this.walls.add(rect);
    });
    
    console.log(`[CollisionEditor] Updated ${this.editorBoxes.length} collision boxes`);
  }

  private deleteSelected(): void {
    if (!this.selectedBoxId) return;
    this.editorBoxes = this.editorBoxes.filter(b => b.id !== this.selectedBoxId);
    this.selectedBoxId = null;
    this.updateCollisionBoxes();
    this.renderEditorBoxes();
    this.notifyChange();
  }

  private clearAll(): void {
    this.editorBoxes = [];
    this.selectedBoxId = null;
    this.updateCollisionBoxes();
    this.renderEditorBoxes();
    this.notifyChange();
  }

  private notifyChange(): void {
    // Notify React of changes
    (window as Window & { collisionBoxes?: CollisionBoxData[] }).collisionBoxes = this.editorBoxes;
    this.onBoxesChange?.(this.editorBoxes);
  }

  /**
   * Get current boxes
   */
  getBoxes(): CollisionBoxData[] {
    return this.editorBoxes;
  }

  /**
   * Set visibility of collision box debug rendering
   */
  setDebugVisible(visible: boolean): void {
    this.walls.getChildren().forEach((child) => {
      const rect = child as Phaser.GameObjects.Rectangle;
      if (visible) {
        rect.setStrokeStyle(3, 0xff0000, 0.8);
        rect.setFillStyle(0xff0000, 0.2);
      } else {
        rect.setStrokeStyle(0);
        rect.setFillStyle(0x000000, 0);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.editorVisuals.forEach(v => v.destroy());
    this.currentDrawBox?.destroy();
    delete (window as Window & { phaserEditor?: CollisionEditorAPI }).phaserEditor;
  }
}

