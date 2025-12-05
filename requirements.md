# Requirements – Alin's Basement

## 1) Goals & Scope
- Build a web-based top-down survival/puzzle game where Alin cleans, fixes servers/computers, and manages sanity/health.
- Deliver a dark, retro pixel-art basement with clear objectives and a responsive HUD.
- Target platform: Browser; preferred hosting: Vercel (per PRD).

## 2) Target Tech Stack (from PRD)
- Framework: Next.js 14+ (App Router).
- Game engine: Phaser 3 (WebGL with Canvas fallback).
- State bridge: Zustand to sync Phaser game state with React UI.
- UI animation/juice: Framer Motion; camera/effects handled in Phaser.
- Map pipeline: Tiled → JSON tilemap.

## 3) Current Prototype Snapshot (`demo.tsx`)
- React-only canvas mock (no Next.js/Phaser/Zustand yet).
- Systems: WASD + Shift sprint, E interact, stamina drain/regen, sanity slow drain with gameover, simple mission flow, score, message overlay, start/gameover/win overlays, basic objects (trash, computer, server, coffee), simple particles array, static hotbar mock.
- Rendering: manual canvas draw (walls, grid, objects, player), no physics, no lighting, no sprite assets.
- Gaps vs PRD: not using Next.js/Phaser/Zustand; no tilemap/physics; no mini-modal for computers, no hold-to-reboot servers, no coffee speed boost, no proper particle emitters/camera shake/vignette; no asset pipeline; hotbar is static; no persistence/high scores; no type-safe store/events.

## 4) Core Requirements (condensed from `instructions.md`)
- Player: 8-directional movement, sprint consuming stamina, interact radius (~48px), physics collisions with walls.
- Sanity system: constant drain; stressors (buggy code/servers) drain faster; relief from trash/coffee; fail state with visual effects; eventual breakdown if sanity hits 0.
- Interactive objects: Trash (quick clean, sanity boost), Computer terminals (mini input sequence UI), Server racks (hold E ~3s to reboot, primary objective), Coffee machine (refills stamina + temporary speed boost).
- UI/HUD: Health/Sanity/Stamina bars, hotbar (1-9), dialog box/typewriter text, overlays for start/gameover/win, juice (shake, particles, vignette).
- Art direction: 16-bit pixel art, dark palette (#1a1a1d/#0b0c10 accents #c3073f/#66fcf1), lighting/flashlight feel.

## 5) Implementation Phases (actionable)
- Phase 1: Setup
  - Initialize Next.js 14 App Router project; add Phaser 3, Zustand, Framer Motion; wire basic page scaffolding.
  - Create `GameComponent` that mounts/destroys Phaser game cleanly (handles React StrictMode double-mount).
- Phase 2: World
  - Import Tiled JSON map + tileset; configure Phaser scene, camera, layers; add player sprite + idle/run animations; enable Arcade Physics collisions with walls.
- Phase 3: Systems
  - Implement `useGameStore` (Zustand) for health/sanity/stamina/score/mission flags.
  - Tick sanity/stamina in `update`; wire Phaser events → store updates; React HUD subscribes to store.
- Phase 4: Interaction & Juice
  - Add zones/entities for trash/computer/server/coffee; distance/hold logic for E; mini-modal for computer sequence; hold-to-reboot server with progress; coffee speed buff.
  - Add particles for cleaning, camera shake on damage, vignette overlay for low sanity, hotbar interactivity, dialog/typewriter.
- Phase 5: Polish & Delivery
  - Hook up win/lose flows, score formatting, persistence hook (future), performance pass, QA pass.

## 6) Asset Needs (from PRD)
- `Char_Alin.png` sprite sheet (idle/walk in 4 dirs).
- `Tileset_Basement.png` (walls, floor, cables, servers).
- `Icons.png` (coffee, brain, heart, trash).

## 7) Assumptions & Open Questions
- OK to start a fresh Next.js app in this repo, or should we integrate into an existing app?
- Any preference on directory layout (e.g., `app/game/page.tsx`, `lib/game/`, `public/assets/`)?
- Should we prioritize desktop only for now, or add basic responsive scaling?
- Do we need immediate persistence/high-score storage, or defer?

