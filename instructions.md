instructions:

Product Requirements Document (PRD): Alin's Basement

1. Executive Summary

Project Name: Alin's Basement
Type: 2D Top-Down Pixel Art Survival/Puzzle Game
Platform: Web (Browser-based)

Concept:
Alin is trapped in his basement and must complete technical missions (fixing servers, coding, cleaning) while managing his dwindling "Sanity" and "Physical Health." The game combines frantic time-management mechanics with a dark, retro aesthetic.

2. Technology Stack & Architecture

2.1 Core Framework

Framework: Next.js 14+ (App Router)

Reasoning: Provides robust routing for Main Menu, Settings, and Game Over screens. excellent for eventual backend integration (saving high scores/progress via server actions).

Hosting: Vercel (preferred for Next.js).

2.2 Game Engine

Engine: Phaser 3

Reasoning: While React can handle simple UI, it is inefficient for a 60FPS game loop with many moving entities. Phaser provides dedicated systems for Physics (Arcade), Input, and Asset Loading.

Rendering: WebGL (with Canvas fallback).

2.3 State Management (The "Bridge")

Library: Zustand

Usage: This is critical. Phaser runs outside the React render cycle. We need a store that can be updated by Phaser (e.g., playerHit()) and subscribed to by React (e.g., <HealthBar />).

Pattern: Phaser emits events -> Zustand Store updates -> React UI re-renders.

2.4 Animations & Assets

Game Sprites: Aseprite (JSON Array format) loaded into Phaser.

UI Animations: Framer Motion. Used for "Juice" (screen shake on damage, bouncing buttons, smooth health bar transitions).

Map Editor: Tiled (exporting to JSON). Allows designing the basement layout visually rather than in code.

3. Game Mechanics & Logic

3.1 Player Controller

Movement: 8-directional top-down movement.

Input: WASD for movement, Shift for sprint (consumes Stamina).

Interaction: 'E' key to interact with "Usable" objects within a 48px radius.

3.2 The "Sanity" System (Core Loop)

Mechanic: Sanity is a float value (0-100) that drains constantly (e.g., -0.5 per second).

Stressors: interacting with "Buggy Code" or "Broken Servers" drains Sanity faster.

Relief: "Cleaning Trash" or "Drinking Coffee" restores Sanity.

Fail State: If Sanity reaches 0, the screen warps (shader effect), controls invert, and the game eventually ends in a "Mental Breakdown."

3.3 Interactive Objects

Trash: Simple interaction. Click to remove. Reward: Small Sanity boost.

Computer Terminals: Opens a mini-modal (React UI) requiring a sequence input (e.g., "Press Up, Down, Left, Right") to "Fix Bug."

Server Racks: The primary objective. Requires holding 'E' for 3 seconds (progress bar) to reboot.

Coffee Machine: Refills Stamina and gives a temporary speed boost.

4. Art & Aesthetic Direction

4.1 Visual Style

Pixel Art: 16-bit era style (SNES/GBA vibes).

Palette: Dark, high-contrast. (Backgrounds: #1a1a1d, #0b0c10; Accents: #c3073f, #66fcf1).

Lighting: The basement should be dark. The player should have a "light radius" or flashlight effect (implemented via Phaser Pipeline or rt-lighting plugin).

4.2 UI/HUD (React Overlay)

The UI sits on top of the Phaser canvas.

Health/Sanity/Stamina: Bars in the top-left.

Hotbar: Bottom center (1-9 keys). Even if empty, the visual slots should remain to reinforce the RPG feel.

Dialog Box: Typewriter effect text appearing at the bottom for narrative.

5. Development Roadmap for LLM/Developer

Phase 1: The Setup

Initialize Next.js project.

Install phaser and zustand.

Create a GameComponent that initializes the Phaser Game instance inside a useEffect hook.

Ensure proper cleanup (destroy game instance on component unmount) to prevent memory leaks (React.StrictMode often triggers double-mounts).

Phase 2: The World

Load a basic tilemap (exported from Tiled).

Implement Player Sprite with Idle/Run animations.

Implement Arcade Physics collision (Player vs Walls).

Phase 3: The Systems

Implement the Zustand store (useGameStore).

Create the Sanity/Stamina ticking logic inside the Phaser update() loop.

Sync logic: update() -> store.setState({ sanity: newSanity }).

Phase 4: Interaction & Polish

Add Zone objects in Phaser for Trash/Computers.

Add Raycasting or Distance checks for the 'E' key.

Implement "Juice":

Particle emitters when cleaning trash.

Camera shake when taking damage.

Red vignette overlay when Sanity is low (CSS overlay controlled by React).

6. Asset Requirements (To be Generated)

Char_Alin.png: Sprite sheet (Idle, Walk Down/Up/Left/Right).

Tileset_Basement.png: Walls, concrete floor, cables, servers.

Icons.png: Coffee cup, Brain (sanity), Heart (health), Trash pile.
