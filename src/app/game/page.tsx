"use client";

import dynamic from "next/dynamic";
import { HudPanel } from "./HudPanel";
import { Overlays } from "./Overlays";
import { DebugPanel } from "./DebugPanel";
import { CollisionEditor } from "./CollisionEditor";
import { HighScores } from "./HighScores";

// Dynamically import GameCanvas with SSR disabled to avoid "window is not defined"
const GameCanvas = dynamic(() => import("./GameCanvas"), {
	ssr: false,
	loading: () => (
		<div className="relative aspect-video w-full overflow-hidden rounded-lg border-4 border-[#3a2618] bg-[#1a1a1d] flex items-center justify-center">
			<div className="text-[#66fcf1] animate-pulse">Initializing...</div>
		</div>
	),
});

export default function GamePage() {
	return (
		<main
			className="min-h-screen text-[#c5c6c7] px-6 py-8"
			style={{
				background: "linear-gradient(180deg, #1a1410 0%, #0b0c10 50%, #12161e 100%)",
			}}
		>
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				{/* Header */}
				<header className="text-center space-y-2">
					<h1
						className="text-4xl md:text-5xl font-black tracking-wider"
						style={{
							fontFamily: "'Press Start 2P', 'VT323', monospace",
							color: "#8b7355",
							textShadow: "3px 3px 0 #3a2618, -1px -1px 0 #c9a959",
							letterSpacing: "0.1em",
						}}
					>
						ALIN&apos;S BASEMENT
					</h1>
					<p className="text-sm text-[#c9a959]/70 font-mono">
						Clean the mess.. fix the Chinese lights.. make coffee.. try not to lose your mind in the dark. <br />
						And what are those voices?
					</p>
				</header>

				{/* Game Viewport */}
				<div className="relative">
					<GameCanvas />
					<Overlays />
					<DebugPanel />
					<CollisionEditor />
					<HighScores />
				</div>

				{/* HUD */}
				<HudPanel />

				{/* Controls Info */}
				<section className="grid gap-4 md:grid-cols-3">
					<div className="rounded-lg border border-[#3a2618] bg-[#1a1410]/80 p-4 text-sm">
						<div className="text-[#c9a959] font-bold mb-2 uppercase text-xs tracking-wider">Controls</div>
						<ul className="space-y-1 text-[#8b7355]">
							<li>
								<span className="text-[#66fcf1] font-mono">WASD</span> — Move
							</li>
							<li>
								<span className="text-[#66fcf1] font-mono">SHIFT</span> — Sprint
							</li>
							<li>
								<span className="text-[#66fcf1] font-mono">E</span> — Interact
							</li>
						</ul>
					</div>
					<div className="rounded-lg border border-[#3a2618] bg-[#1a1410]/80 p-4 text-sm">
						<div className="text-[#c9a959] font-bold mb-2 uppercase text-xs tracking-wider">Survival Tips</div>
						<ul className="space-y-1 text-[#8b7355]">
							<li>Keep sanity high by cleaning</li>
							<li>Drink coffee for energy</li>
							<li>Boot up the server to progress</li>
						</ul>
					</div>
					<div className="rounded-lg border border-[#3a2618] bg-[#1a1410]/80 p-4 text-sm">
						<div className="text-[#c9a959] font-bold mb-2 uppercase text-xs tracking-wider">Objects</div>
						<ul className="space-y-1 text-[#8b7355]">
							<li>
								<span className="inline-block w-3 h-3 bg-[#553322] mr-2 rounded-sm"></span>Trash
							</li>
							<li>
								<span className="inline-block w-3 h-3 bg-[#445566] mr-2 rounded-sm"></span>Computer
							</li>
							<li>
								<span className="inline-block w-3 h-3 bg-[#6f4e37] mr-2 rounded-sm"></span>Coffee
							</li>
							<li>
								<span className="inline-block w-3 h-3 bg-[#222] mr-2 rounded-sm"></span>Server
							</li>
						</ul>
					</div>
				</section>
			</div>
		</main>
	);
}
