
import React, { useState, useEffect } from 'react';
import GameEngine from './components/GameEngine';
import { ScreenState } from './types';
import { Play, RotateCcw, Trophy, Info } from 'lucide-react';
import { sfx } from './utils/audio';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>(ScreenState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [level, setLevel] = useState(1);

  // Music Management
  useEffect(() => {
    if (screen === ScreenState.PLAYING) {
      sfx.startMusic();
    } else {
      sfx.stopMusic();
    }
  }, [screen]);

  const handleGameEnd = (score: number, won: boolean, nextLevel?: number) => {
    setFinalScore(score);
    if (won && nextLevel) {
      setLevel(nextLevel);
      setScreen(ScreenState.LEVEL_COMPLETE);
    } else if (won && !nextLevel) {
      setScreen(ScreenState.VICTORY);
    } else {
      setScreen(ScreenState.GAME_OVER);
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-slate-900 text-white font-sans overflow-hidden">
      
      {/* Game Layer */}
      {screen === ScreenState.PLAYING && (
        <GameEngine 
          levelIndex={level} 
          onGameOver={(score) => handleGameEnd(score, false)} 
          onLevelComplete={(score, nextLevel) => handleGameEnd(score, true, nextLevel)}
          onExit={() => setScreen(ScreenState.MENU)}
        />
      )}

      {/* Menu Layer */}
      {screen === ScreenState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="p-8 border-2 border-cyan-500/50 rounded-2xl bg-slate-800/80 shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-md text-center">
            <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 tracking-tighter">
              NEON SWING
            </h1>
            <p className="text-slate-300 mb-8 text-lg">
              Use your <span className="text-cyan-400 font-bold">Left Mouse Button</span> to grapple.
              <br/>
              <span className="text-purple-400 font-bold">A / D</span> or <span className="text-purple-400 font-bold">Arrows</span> to swing.
              <br/>
              Collect all nodes to open the portal.
            </p>
            
            <button 
              onClick={() => {
                setLevel(1);
                setScreen(ScreenState.PLAYING);
              }}
              className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
            >
              <Play className="w-6 h-6 fill-current" />
              START SYSTEM
              <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Level Complete Layers */}
      {(screen === ScreenState.GAME_OVER || screen === ScreenState.LEVEL_COMPLETE || screen === ScreenState.VICTORY) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-md">
          <div className="p-8 border border-slate-700 rounded-xl bg-slate-900 shadow-2xl text-center min-w-[300px]">
            
            {screen === ScreenState.VICTORY && (
              <>
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-yellow-400 mb-2">SYSTEM CONQUERED</h2>
                <p className="text-slate-400 mb-6">All levels complete.</p>
              </>
            )}

            {screen === ScreenState.LEVEL_COMPLETE && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse" />
                </div>
                <h2 className="text-4xl font-bold text-green-400 mb-2">SECTOR CLEARED</h2>
                <p className="text-slate-400 mb-6">Access granted to next sector.</p>
              </>
            )}

            {screen === ScreenState.GAME_OVER && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                   <RotateCcw className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-4xl font-bold text-red-500 mb-2">SIGNAL LOST</h2>
                <p className="text-slate-400 mb-6">You fell into the void.</p>
              </>
            )}

            <div className="text-2xl font-mono mb-8">
              SCORE: <span className="text-cyan-400">{finalScore}</span>
            </div>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setScreen(ScreenState.MENU)}
                className="px-6 py-3 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Main Menu
              </button>
              <button 
                onClick={() => {
                  if (screen === ScreenState.VICTORY) {
                    setLevel(1);
                  }
                  // If level complete, logic handled by state already being set to next level
                  setScreen(ScreenState.PLAYING);
                }}
                className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-lg shadow-cyan-500/20"
              >
                {screen === ScreenState.LEVEL_COMPLETE ? 'Next Sector' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-slate-600 text-xs pointer-events-none">
        v1.1.0 • Canvas Physics Engine
      </div>
    </div>
  );
};

export default App;