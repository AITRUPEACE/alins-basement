"use client";

import { useState, useEffect, useCallback } from "react";
import { loadCollisionBoxes, saveCollisionBoxes, CollisionBox } from "@/lib/supabase/collisionBoxes";

// Default boxes (fallback if database is empty)
const DEFAULT_BOXES: CollisionBox[] = [
	{ id: "1", x: 1488, y: 236, w: 2947, h: 444 },
	{ id: "2", x: 2517, y: 550, w: 558, h: 503 },
	{ id: "3", x: 2170, y: 550, w: 352, h: 492 },
	{ id: "4", x: 2017, y: 1101, w: 140, h: 217 },
	{ id: "5", x: 2170, y: 1107, w: 142, h: 222 },
	{ id: "6", x: 2707, y: 1020, w: 142, h: 397 },
	{ id: "7", x: 1421, y: 1311, w: 2813, h: 248 },
	{ id: "8", x: 334, y: 592, w: 233, h: 408 },
	{ id: "9", x: 121, y: 734, w: 73, h: 90 },
	{ id: "10", x: 101, y: 596, w: 206, h: 248 },
	{ id: "11", x: 69, y: 944, w: 137, h: 194 },
	{ id: "12", x: 122, y: 1121, w: 192, h: 138 },
	{ id: "13", x: 852, y: 1046, w: 128, h: 309 },
	{ id: "14", x: 996, y: 1086, w: 125, h: 236 },
	{ id: "15", x: 502, y: 647, w: 201, h: 293 },
	{ id: "16", x: 507, y: 1097, w: 183, h: 191 },
	{ id: "17", x: 435, y: 1129, w: 125, h: 98 },
];

export function CollisionEditor() {
	const [isOpen, setIsOpen] = useState(false);
	const [boxes, setBoxes] = useState<CollisionBox[]>([]);
	const [showExport, setShowExport] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

	// Sync with Phaser editor
	useEffect(() => {
		// Listen for changes from Phaser
		window.onCollisionBoxesChange = (newBoxes: CollisionBox[]) => {
			setBoxes(newBoxes);
		};

		return () => {
			window.onCollisionBoxesChange = undefined;
		};
	}, []);

	// Toggle editor mode in Phaser when panel opens/closes
	useEffect(() => {
		if (window.phaserEditor) {
			window.phaserEditor.setEditorMode(isOpen);
		}
	}, [isOpen]);

	// Load boxes from database on mount
	useEffect(() => {
		async function loadBoxes() {
			const { boxes: dbBoxes, exists } = await loadCollisionBoxes("level1");
			const initialBoxes = exists ? dbBoxes : DEFAULT_BOXES;
			setBoxes(initialBoxes);

			// Send to Phaser
			if (window.phaserEditor) {
				window.phaserEditor.setBoxes(initialBoxes);
			}

			console.log(exists ? `Loaded ${dbBoxes.length} collision boxes from database` : "Using default collision boxes");
		}

		// Wait a bit for Phaser to initialize
		const timeout = setTimeout(loadBoxes, 500);
		return () => clearTimeout(timeout);
	}, []);

	// Save boxes to database
	const handleSaveToDatabase = async () => {
		setIsSaving(true);
		setSaveStatus("idle");
		const currentBoxes = window.phaserEditor?.getBoxes() || boxes;
		const success = await saveCollisionBoxes(currentBoxes, "level1");
		setIsSaving(false);
		setSaveStatus(success ? "saved" : "error");
		setTimeout(() => setSaveStatus("idle"), 3000);
	};

	const handleDeleteSelected = () => {
		window.phaserEditor?.deleteSelected();
	};

	const handleClearAll = () => {
		if (confirm("Clear all collision boxes?")) {
			window.phaserEditor?.clearAll();
		}
	};

	const exportBoxes = useCallback(() => {
		const currentBoxes = window.phaserEditor?.getBoxes() || boxes;
		const lines = currentBoxes.map((b) => `      { x: ${b.x}, y: ${b.y}, w: ${b.w}, h: ${b.h} },`);
		return `const collisionBoxes = [\n${lines.join("\n")}\n    ];`;
	}, [boxes]);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(exportBoxes());
	};

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed top-16 right-4 z-50 bg-[#2a4a2a] text-[#8fc98f] px-3 py-2 rounded-lg font-bold text-sm hover:bg-[#3a5a3a] transition-colors shadow-lg"
			>
				📦 Collision Editor
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 z-50 w-72 bg-[#1a2a1a]/95 border-2 border-[#2a4a2a] rounded-lg p-4 text-sm max-h-[80vh] overflow-y-auto">
			<div className="flex justify-between items-center mb-4">
				<span className="text-[#8fc98f] font-bold uppercase text-xs tracking-wider">Collision Editor</span>
				<button onClick={() => setIsOpen(false)} className="text-[#5a8a5a] hover:text-white">
					✕
				</button>
			</div>

			<div className="space-y-3">
				<div className="text-[#5a8a5a] text-xs">
					<p>• Click & drag on game to draw box</p>
					<p>• Click box to select (green)</p>
					<p>• Delete/Backspace to remove</p>
					<p className="text-[#8fc98f] mt-1">📍 Boxes move with camera!</p>
				</div>

				<div className="flex gap-2">
					<button onClick={handleDeleteSelected} className="flex-1 px-2 py-1 text-xs bg-[#4a2a2a] text-[#c98f8f] rounded hover:bg-[#5a3a3a]">
						Delete Selected
					</button>
					<button onClick={handleClearAll} className="flex-1 px-2 py-1 text-xs bg-[#4a2a2a] text-[#c98f8f] rounded hover:bg-[#5a3a3a]">
						Clear All
					</button>
				</div>

				<div className="border-t border-[#2a4a2a] pt-3">
					<div className="text-[#8fc98f] text-xs mb-2">Boxes: {boxes.length}</div>
					<div className="max-h-32 overflow-y-auto space-y-1">
						{boxes.map((box) => (
							<div key={box.id} className="text-xs px-2 py-1 rounded bg-[#1a2a1a] text-[#5a8a5a]">
								x:{Math.round(box.x)} y:{Math.round(box.y)} w:{Math.round(box.w)} h:{Math.round(box.h)}
							</div>
						))}
					</div>
				</div>

				{/* Database Actions */}
				<div className="border-t border-[#2a4a2a] pt-3 space-y-2">
					<div className="text-[#8fc98f] text-xs font-bold">💾 Database</div>
					<button
						onClick={handleSaveToDatabase}
						disabled={isSaving}
						className="w-full px-2 py-2 text-xs bg-[#4a6a4a] text-white rounded hover:bg-[#5a7a5a] disabled:opacity-50"
					>
						{isSaving ? "Saving..." : "Save to Database"}
					</button>
					{saveStatus === "saved" && <div className="text-[#8fc98f] text-xs text-center">✓ Saved!</div>}
					{saveStatus === "error" && <div className="text-[#c98f8f] text-xs text-center">✗ Failed</div>}
				</div>

				{/* Export Code */}
				<button
					onClick={() => setShowExport(!showExport)}
					className="w-full px-2 py-2 text-xs bg-[#2a4a2a] text-[#8fc98f] rounded hover:bg-[#3a5a3a]"
				>
					{showExport ? "Hide" : "Show"} Export Code
				</button>

				{showExport && (
					<div className="space-y-2">
						<pre className="text-[10px] bg-[#0a1a0a] p-2 rounded overflow-x-auto text-[#5a8a5a] max-h-40 overflow-y-auto">{exportBoxes()}</pre>
						<button onClick={copyToClipboard} className="w-full px-2 py-1 text-xs bg-[#4a6a4a] text-white rounded hover:bg-[#5a7a5a]">
							Copy to Clipboard
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
