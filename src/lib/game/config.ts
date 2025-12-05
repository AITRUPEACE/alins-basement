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
    backgroundColor: "#1a1a1d",
    width: 960,
    height: 540,
    pixelArt: true,
    scale: {
      mode: PhaserLib.Scale.FIT,
      autoCenter: PhaserLib.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: [MainScene],
  };
};
