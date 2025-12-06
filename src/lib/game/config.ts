import type * as Phaser from "phaser";

export const createGameConfig = (
  parent: HTMLElement
): Phaser.Types.Core.GameConfig => {
  // Dynamically require Phaser and MainScene to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PhaserLib = require("phaser") as typeof Phaser;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MainScene } = require("./scenes/MainScene");

  return {
    type: PhaserLib.AUTO,
    parent,
    backgroundColor: "#0a0a0a",
    width: 960,
    height: 480,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: PhaserLib.Scale.FIT,
      autoCenter: PhaserLib.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: true, // Enable to see physics bodies
      },
    },
    scene: [MainScene],
  };
};
