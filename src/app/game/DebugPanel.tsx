"use client";

import { useState, useEffect } from "react";

interface DebugSettings {
	zoom: number;
	playerScale: number;
	moveSpeed: number;
	showCollision: boolean;
}

// Global settings that Phaser can read
declare global {
	interface Window {
		gameDebug?: DebugSettings;
	}
}

export function DebugPanel() {
	const [isOpen, setIsOpen] = useState(false);
	const [zoom, setZoom] = useState(0.5);
	const [playerScale, setPlayerScale] = useState(0.6);
	const [moveSpeed, setMoveSpeed] = useState(370);
	const [showCollision, setShowCollision] = useState(false);

	// Sync to window object for Phaser to read
	useEffect(() => {
		window.gameDebug = { zoom, playerScale, moveSpeed, showCollision };
	}, [zoom, playerScale, moveSpeed, showCollision]);

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed top-4 right-4 z-50 px-3 py-1 text-xs bg-[#3a2618] text-[#c9a959] rounded border border-[#c9a959]/50 hover:bg-[#4a3628]"
			>
				Debug
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 z-50 w-64 bg-[#1a1410]/95 border-2 border-[#3a2618] rounded-lg p-4 text-sm">
			<div className="flex justify-between items-center mb-4">
				<span className="text-[#c9a959] font-bold uppercase text-xs tracking-wider">Debug Controls</span>
				<button onClick={() => setIsOpen(false)} className="text-[#8b7355] hover:text-white">
					✕
				</button>
			</div>

			<div className="space-y-4">
				{/* Camera Zoom */}
				<div>
					<label className="block text-[#8b7355] text-xs mb-1">Camera Zoom: {zoom.toFixed(2)}</label>
					<input
						type="range"
						min="0.2"
						max="1.5"
						step="0.05"
						value={zoom}
						onChange={(e) => setZoom(parseFloat(e.target.value))}
						className="w-full accent-[#c9a959]"
					/>
				</div>

				{/* Player Scale */}
				<div>
					<label className="block text-[#8b7355] text-xs mb-1">Player Scale: {playerScale.toFixed(2)}</label>
					<input
						type="range"
						min="0.2"
						max="2.0"
						step="0.1"
						value={playerScale}
						onChange={(e) => setPlayerScale(parseFloat(e.target.value))}
						className="w-full accent-[#c9a959]"
					/>
				</div>

				{/* Move Speed */}
				<div>
					<label className="block text-[#8b7355] text-xs mb-1">Move Speed: {moveSpeed}</label>
					<input
						type="range"
						min="50"
						max="500"
						step="10"
						value={moveSpeed}
						onChange={(e) => setMoveSpeed(parseInt(e.target.value))}
						className="w-full accent-[#c9a959]"
					/>
				</div>

				{/* Show Collision Boxes */}
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="showCollision"
						checked={showCollision}
						onChange={(e) => setShowCollision(e.target.checked)}
						className="accent-[#c9a959]"
					/>
					<label htmlFor="showCollision" className="text-[#8b7355] text-xs">
						Show Collision Boxes
					</label>
				</div>

				{/* Quick presets */}
				<div className="pt-2 border-t border-[#3a2618]">
					<div className="text-[#8b7355] text-xs mb-2">Presets:</div>
					<div className="flex gap-2">
						<button
							onClick={() => {
								setZoom(0.3);
								setPlayerScale(0.5);
							}}
							className="px-2 py-1 text-xs bg-[#3a2618] text-[#c9a959] rounded hover:bg-[#4a3628]"
						>
							Zoomed Out
						</button>
						<button
							onClick={() => {
								setZoom(0.5);
								setPlayerScale(1.0);
							}}
							className="px-2 py-1 text-xs bg-[#3a2618] text-[#c9a959] rounded hover:bg-[#4a3628]"
						>
							Default
						</button>
						<button
							onClick={() => {
								setZoom(1.0);
								setPlayerScale(1.5);
							}}
							className="px-2 py-1 text-xs bg-[#3a2618] text-[#c9a959] rounded hover:bg-[#4a3628]"
						>
							Close Up
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
