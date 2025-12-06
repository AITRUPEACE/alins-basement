"use client";

import { useState, useEffect } from "react";
import { getHighScores, submitHighScore, checkIfHighScore } from "@/lib/supabase/highscores";
import type { HighScore } from "@/lib/supabase/client";
import { useGameStore } from "@/lib/state/gameStore";
import { useShallow } from "zustand/react/shallow";

export function HighScores() {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { score, sanity, gameState } = useGameStore(
    useShallow((state) => ({
      score: state.score,
      sanity: state.sanity,
      gameState: state.gameState,
    }))
  );

  // Load high scores
  useEffect(() => {
    if (isOpen) {
      loadScores();
    }
  }, [isOpen]);

  // Check if player qualifies for high score when game ends
  useEffect(() => {
    if (gameState === "won" || gameState === "gameover") {
      checkIfHighScore(score).then((qualifies) => {
        if (qualifies && score > 0) {
          setShowSubmit(true);
        }
      });
    } else {
      setShowSubmit(false);
    }
  }, [gameState, score]);

  const loadScores = async () => {
    setLoading(true);
    const data = await getHighScores(10);
    setScores(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitting) return;

    setSubmitting(true);
    const result = await submitHighScore({
      player_name: playerName.trim(),
      score,
      sanity_remaining: Math.round(sanity),
      time_seconds: 0, // TODO: track game time
    });

    if (result) {
      setShowSubmit(false);
      setPlayerName("");
      loadScores();
      setIsOpen(true);
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* High Score Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1410] border-2 border-[#c9a959] rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-[#66fcf1] mb-2">🏆 New High Score!</h2>
            <p className="text-[#c9a959] mb-4">
              Score: <span className="text-[#66fcf1] font-bold">{score}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#3a2618] rounded text-[#c5c6c7] focus:border-[#66fcf1] focus:outline-none"
                maxLength={20}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!playerName.trim() || submitting}
                  className="flex-1 px-4 py-2 bg-[#c3073f] text-white rounded font-bold hover:bg-[#950740] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Saving..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="px-4 py-2 bg-[#3a2618] text-[#c5c6c7] rounded hover:bg-[#4a3628] transition-colors"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 bg-[#c9a959] text-[#1a1410] px-3 py-2 rounded-lg font-bold text-sm hover:bg-[#d9b969] transition-colors shadow-lg"
      >
        🏆 Leaderboard
      </button>

      {/* Leaderboard Panel */}
      {isOpen && (
        <div className="fixed top-16 left-4 z-40 bg-[#1a1410] border-2 border-[#3a2618] rounded-lg p-4 w-72 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#c9a959]">🏆 Top Scores</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#c5c6c7] hover:text-white"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center text-[#66fcf1] py-4 animate-pulse">Loading...</div>
          ) : scores.length === 0 ? (
            <div className="text-center text-[#8b7355] py-4">No scores yet. Be the first!</div>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    i === 0 ? "bg-[#c9a959]/20" : "bg-[#0a0a0a]/50"
                  }`}
                >
                  <span
                    className={`w-6 text-center font-bold ${
                      i === 0 ? "text-[#c9a959]" : i === 1 ? "text-[#c0c0c0]" : i === 2 ? "text-[#cd7f32]" : "text-[#8b7355]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[#c5c6c7] truncate">{s.player_name}</span>
                  <span className="text-[#66fcf1] font-mono font-bold">{s.score}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={loadScores}
            className="mt-4 w-full text-center text-xs text-[#66fcf1] hover:underline"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </>
  );
}

