import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Brain, Zap, Terminal, Trash2, AlertTriangle, Monitor, RotateCcw } from 'lucide-react';

// --- Constants & Config ---
const TILE_SIZE = 48;
const PLAYER_SPEED = 4;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const MAX_SANITY = 100;
const MAX_STAMINA = 100;

// Colors
const COLORS = {
  floor: '#1a1a1d',
  wall: '#4e4e50',
  accent: '#c3073f',
  text: '#950740',
  uiBg: '#0b0c10',
};

// --- Game State & Logic ---

export default function App() {
  // Game State
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover, won
  const [health, setHealth] = useState(5);
  const [sanity, setSanity] = useState(MAX_SANITY);
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [mission, setMission] = useState("Boot up the main server");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState(null); // Feedback text (e.g. "+10 Sanity")
  
  // Ref for canvas and game loop
  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  // Mutable game state (for performance in loop)
  const game = useRef({
    player: { x: 5 * TILE_SIZE, y: 5 * TILE_SIZE, w: 32, h: 32, vx: 0, vy: 0, direction: 'down', isMoving: false },
    keys: { w: false, a: false, s: false, d: false, shift: false, e: false },
    objects: [
      { id: 1, type: 'computer', x: 2 * TILE_SIZE, y: 2 * TILE_SIZE, w: 48, h: 48, active: true, label: 'PC-01' },
      { id: 2, type: 'trash', x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, w: 32, h: 32, active: true },
      { id: 3, type: 'trash', x: 12 * TILE_SIZE, y: 4 * TILE_SIZE, w: 32, h: 32, active: true },
      { id: 4, type: 'server', x: 15 * TILE_SIZE, y: 2 * TILE_SIZE, w: 48, h: 96, active: false, label: 'MAIN SERVER' },
      { id: 5, type: 'coffee', x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, w: 32, h: 32, active: true },
    ],
    particles: [],
    lastTime: 0,
    sanityTimer: 0
  });

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (game.current.keys.hasOwnProperty(key)) game.current.keys[key] = true;
      if (key === 'shift') game.current.keys.shift = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (game.current.keys.hasOwnProperty(key)) game.current.keys[key] = false;
      if (key === 'shift') game.current.keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Game Loop ---
  const update = useCallback((time) => {
    if (gameState !== 'playing') return;

    const dt = time - game.current.lastTime;
    game.current.lastTime = time;
    const g = game.current;

    // 1. Movement Logic
    let speed = PLAYER_SPEED;
    if (g.keys.shift && stamina > 0) {
      speed *= 1.5;
      setStamina(prev => Math.max(0, prev - 0.5));
    } else if (!g.keys.shift && stamina < MAX_STAMINA) {
      setStamina(prev => Math.min(MAX_STAMINA, prev + 0.2));
    }

    g.player.vx = 0;
    g.player.vy = 0;

    if (g.keys.w) g.player.vy = -speed;
    if (g.keys.s) g.player.vy = speed;
    if (g.keys.a) g.player.vx = -speed;
    if (g.keys.d) g.player.vx = speed;

    // Update position
    g.player.x += g.player.vx;
    g.player.y += g.player.vy;
    g.player.isMoving = (g.player.vx !== 0 || g.player.vy !== 0);

    // Direction for rendering
    if (g.player.vy < 0) g.player.direction = 'up';
    if (g.player.vy > 0) g.player.direction = 'down';
    if (g.player.vx < 0) g.player.direction = 'left';
    if (g.player.vx > 0) g.player.direction = 'right';

    // World Bounds
    g.player.x = Math.max(TILE_SIZE, Math.min(g.player.x, (MAP_WIDTH - 2) * TILE_SIZE));
    g.player.y = Math.max(TILE_SIZE, Math.min(g.player.y, (MAP_HEIGHT - 2) * TILE_SIZE));

    // 2. Sanity Drain
    g.sanityTimer += dt;
    if (g.sanityTimer > 1000) { // Every second
      setSanity(prev => {
        const newSanity = prev - 0.5; // Slow drain
        if (newSanity <= 0) setGameState('gameover');
        return newSanity;
      });
      g.sanityTimer = 0;
    }

    // 3. Interactions
    if (g.keys.e) {
      // Find nearest object
      const interactionDist = 60;
      const target = g.objects.find(obj => {
        const dx = (g.player.x + g.player.w/2) - (obj.x + obj.w/2);
        const dy = (g.player.y + g.player.h/2) - (obj.y + obj.h/2);
        return Math.sqrt(dx*dx + dy*dy) < interactionDist && obj.active;
      });

      if (target) {
        handleInteraction(target);
        g.keys.e = false; // Prevent holding E
      }
    }

    // 4. Render
    render();
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, stamina]);

  // --- Interaction Logic ---
  const handleInteraction = (obj) => {
    // Simple particle effect simulation
    game.current.particles.push({x: obj.x, y: obj.y, life: 30});

    switch(obj.type) {
      case 'trash':
        obj.active = false;
        setSanity(s => Math.min(MAX_SANITY, s + 10));
        setScore(s => s + 50);
        showMessage("Cleaned Trash (+10 Sanity)");
        checkMission('Clean trash');
        break;
      case 'computer':
        setSanity(s => Math.max(0, s - 5)); // Computers are stressful
        setScore(s => s + 20);
        showMessage("Fixed Bug (-5 Sanity)");
        break;
      case 'coffee':
        obj.active = false;
        setSanity(s => Math.min(MAX_SANITY, s + 25));
        setStamina(MAX_STAMINA);
        showMessage("Drank Coffee (Energy Restored)");
        // Respawn coffee later?
        setTimeout(() => { obj.active = true; }, 10000);
        break;
      case 'server':
        if (mission === "Boot up the main server") {
          setScore(s => s + 500);
          showMessage("SERVER ONLINE");
          setMission("Clean up the remaining mess");
          obj.active = false; // "On" state
        } else {
            showMessage("Server is running smoothly...");
        }
        break;
      default: break;
    }
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2000);
  };

  const checkMission = (action) => {
     // Simple mission logic placeholder
     const trashLeft = game.current.objects.filter(o => o.type === 'trash' && o.active).length;
     if (trashLeft === 0 && mission === "Clean up the remaining mess") {
         setMission("Go to sleep (Game Win)");
         setGameState('won');
     }
  };

  // --- Rendering ---
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = game.current;

    // Clear Screen
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Floor tiles)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw Walls
    ctx.fillStyle = COLORS.wall;
    // Top wall
    ctx.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, TILE_SIZE);
    // Bottom wall
    ctx.fillRect(0, (MAP_HEIGHT - 1) * TILE_SIZE, MAP_WIDTH * TILE_SIZE, TILE_SIZE);
    // Left
    ctx.fillRect(0, 0, TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
    // Right
    ctx.fillRect((MAP_WIDTH - 1) * TILE_SIZE, 0, TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // Draw Objects
    g.objects.forEach(obj => {
      if (!obj.active && obj.type !== 'server') return; // Server stays visible

      ctx.save();
      if (obj.type === 'computer') {
        ctx.fillStyle = '#445';
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        // Screen glow
        ctx.fillStyle = Math.random() > 0.9 ? '#0f0' : '#0a0';
        ctx.fillRect(obj.x + 5, obj.y + 5, obj.w - 10, obj.h - 20);
      } else if (obj.type === 'trash') {
        ctx.fillStyle = '#553322';
        ctx.beginPath();
        ctx.arc(obj.x + obj.w/2, obj.y + obj.h/2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#332'; // specks
        ctx.fillRect(obj.x + 5, obj.y+5, 4, 4);
      } else if (obj.type === 'server') {
        ctx.fillStyle = '#111';
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        // Blinking lights
        ctx.fillStyle = Math.random() > 0.5 ? '#f00' : '#222';
        ctx.fillRect(obj.x + 5, obj.y + 10, 8, 4);
        ctx.fillStyle = Math.random() > 0.5 ? '#0f0' : '#222';
        ctx.fillRect(obj.x + 20, obj.y + 10, 8, 4);
      } else if (obj.type === 'coffee') {
        ctx.fillStyle = '#6f4e37';
        ctx.fillRect(obj.x + 8, obj.y + 10, 16, 20);
        ctx.fillStyle = '#fff'; // Steam
        if (Math.random() > 0.5) ctx.fillRect(obj.x + 12, obj.y - 5, 2, 8);
      }
      ctx.restore();
    });

    // Draw Player (Alin)
    ctx.fillStyle = '#3498db'; // Shirt
    ctx.fillRect(g.player.x, g.player.y, g.player.w, g.player.h);
    // Head
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(g.player.x + 4, g.player.y - 8, 24, 20);
    // Hair
    ctx.fillStyle = '#4a3000';
    ctx.fillRect(g.player.x + 2, g.player.y - 10, 28, 8);

    // Interaction Prompt
    const nearestObj = g.objects.find(obj => {
        const dx = (g.player.x + g.player.w/2) - (obj.x + obj.w/2);
        const dy = (g.player.y + g.player.h/2) - (obj.y + obj.h/2);
        return Math.sqrt(dx*dx + dy*dy) < 60 && obj.active;
    });

    if (nearestObj) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText("[E] Interact", g.player.x - 10, g.player.y - 20);
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, update]);

  // --- Helper Components ---
  const ProgressBar = ({ value, max, color, icon: Icon, label }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1 rounded bg-gray-800 border border-gray-600 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs uppercase text-gray-400 mb-1">
          <span>{label}</span>
          <span>{Math.floor(value)}/{max}</span>
        </div>
        <div className="h-4 bg-gray-900 rounded-sm overflow-hidden border border-gray-700">
          <div 
            className={`h-full transition-all duration-300 ${color.replace('text-', 'bg-')}`} 
            style={{ width: `${(value / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-mono flex flex-col items-center justify-center p-4">
      
      {/* Header / HUD */}
      <div className="w-full max-w-4xl bg-[#1f2833] p-4 rounded-lg shadow-2xl border-2 border-[#45a29e] mb-4">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Status Bars */}
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold text-[#66fcf1] mb-2 flex items-center gap-2">
              <Monitor /> ALIN'S BASEMENT OS v1.0
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <ProgressBar value={health} max={5} color="text-red-500" icon={Heart} label="Physical Health" />
                <ProgressBar value={sanity} max={MAX_SANITY} color="text-purple-400" icon={Brain} label="Mental Sanity" />
            </div>
            <ProgressBar value={stamina} max={MAX_STAMINA} color="text-yellow-400" icon={Zap} label="Stamina" />
          </div>

          {/* Mission & Score */}
          <div className="md:w-64 bg-[#0b0c10] p-3 rounded border border-[#45a29e] flex flex-col justify-center">
            <div className="text-xs text-gray-500 uppercase mb-1">Current Objective</div>
            <div className="text-[#66fcf1] font-bold leading-tight mb-3">{mission}</div>
            
            <div className="text-xs text-gray-500 uppercase mb-1">Score</div>
            <div className="text-xl text-white font-mono">{score.toString().padStart(6, '0')}</div>
          </div>

        </div>
      </div>

      {/* Game Viewport */}
      <div className="relative border-4 border-[#1f2833] rounded-lg shadow-2xl bg-black overflow-hidden">
        
        {/* Overlay Message */}
        {message && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <div className="bg-[#45a29e] text-black px-4 py-2 rounded shadow font-bold border-2 border-white">
              {message}
            </div>
          </div>
        )}

        {/* Start Screen Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 text-center p-8">
            <h1 className="text-6xl font-bold text-[#66fcf1] mb-4 pixel-font tracking-widest">ALIN'S BASEMENT</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md">
              Clean the mess. Fix the servers. Try not to lose your mind in the dark.
            </p>
            <div className="grid grid-cols-2 gap-8 text-left mb-8 text-sm text-gray-400 bg-gray-900 p-6 rounded border border-gray-700">
              <div>
                <strong className="text-white block mb-2">CONTROLS</strong>
                <ul className="space-y-1">
                  <li><span className="bg-gray-700 px-1 rounded">WASD</span> to Move</li>
                  <li><span className="bg-gray-700 px-1 rounded">SHIFT</span> to Sprint</li>
                  <li><span className="bg-gray-700 px-1 rounded">E</span> to Interact</li>
                </ul>
              </div>
              <div>
                <strong className="text-white block mb-2">SURVIVAL TIPS</strong>
                <ul className="space-y-1">
                  <li>Keep sanity high by cleaning</li>
                  <li>Drink coffee for stamina</li>
                  <li>Avoid faulty electronics</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => {
                setGameState('playing');
                game.current.lastTime = performance.now();
                update(performance.now());
              }}
              className="px-8 py-4 bg-[#c3073f] hover:bg-[#a10635] text-white font-bold text-xl rounded shadow-lg transform transition hover:scale-105"
            >
              ENTER BASEMENT
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20">
            <AlertTriangle size={64} className="text-white mb-4" />
            <h2 className="text-5xl font-bold text-white mb-2">MENTAL BREAKDOWN</h2>
            <p className="text-white/80 mb-6">Alin could not handle the basement anymore.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Win Screen */}
        {gameState === 'won' && (
          <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center z-20">
            <Monitor size={64} className="text-white mb-4" />
            <h2 className="text-5xl font-bold text-white mb-2">SYSTEM RESTORED</h2>
            <p className="text-white/80 mb-6">The basement is clean. The servers are running. You survived.</p>
            <div className="text-2xl font-bold text-green-300 mb-8">Final Score: {score}</div>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          width={MAP_WIDTH * TILE_SIZE} 
          height={MAP_HEIGHT * TILE_SIZE}
          className="bg-[#1a1a1d] cursor-none"
        />
      </div>

      {/* Inventory Hotbar (Static Mockup based on image) */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
          <div key={slot} className={`w-12 h-12 border-2 ${slot === 1 ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 bg-gray-900'} rounded flex items-center justify-center relative`}>
            <span className="absolute top-0 left-1 text-[10px] text-gray-500">{slot}</span>
            {slot === 1 && <Terminal size={20} className="text-green-400" />}
            {slot === 2 && <Trash2 size={20} className="text-gray-400" />}
            {slot === 6 && <div className="text-red-500 font-bold text-xs">MED</div>}
          </div>
        ))}
      </div>

    </div>
  );
}