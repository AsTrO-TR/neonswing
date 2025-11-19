
import { GameData, Platform, Coin, Enemy } from '../types';
import { GAME_CONFIG } from '../constants';

// Helper to generate coins in an arc or line
const createCoinArc = (centerX: number, centerY: number, radius: number, count: number, startAngle: number, endAngle: number): Coin[] => {
  const coins: Coin[] = [];
  const step = (endAngle - startAngle) / (count - 1 || 1);
  
  for (let i = 0; i < count; i++) {
    const angle = startAngle + step * i;
    coins.push({
      id: Math.random(),
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      collected: false,
      radius: GAME_CONFIG.COIN_RADIUS
    });
  }
  return coins;
};

export const getLevelData = (levelIndex: number): GameData => {
  const w = GAME_CONFIG.CANVAS_WIDTH;
  const h = GAME_CONFIG.CANVAS_HEIGHT;
  
  // Default floor and walls
  const borders: Platform[] = [
    { x: 0, y: h - 20, w: w, h: 20 }, // Floor
    { x: -20, y: 0, w: 20, h: h }, // Left Wall
    { x: w, y: 0, w: 20, h: h }, // Right Wall
    { x: 0, y: -100, w: w, h: 100 }, // Ceiling cap (invisible mostly)
  ];

  if (levelIndex === 1) {
    return {
      bounds: { w, h },
      spawnPoint: { x: 100, y: h - 100 },
      exitPoint: { x: w - 100, y: h - 100 },
      platforms: [
        ...borders,
        { x: 300, y: 400, w: 100, h: 20 }, // Mid platform
        { x: 500, y: 250, w: 200, h: 20 }, // High platform for grapple
        { x: 800, y: 400, w: 100, h: 20 }, // Landing pad
      ],
      coins: [
        ...createCoinArc(600, 250, 150, 5, Math.PI * 0.2, Math.PI * 0.8) // Swing arc coins
      ],
      enemies: [
        { id: 101, x: 550, y: 230, radius: GAME_CONFIG.ENEMY_RADIUS, type: 'turret', cooldown: 0, dead: false }
      ]
    };
  }

  if (levelIndex === 2) {
    return {
      bounds: { w, h },
      spawnPoint: { x: 50, y: h - 100 },
      exitPoint: { x: w - 50, y: 150 }, // High exit
      platforms: [
        { x: 0, y: h - 20, w: 300, h: 20 }, // Start floor
        { x: w - 300, y: 200, w: 300, h: 20 }, // End platform
        { x: w, y: 0, w: 20, h: h }, // Right Wall
        { x: -20, y: 0, w: 20, h: h }, // Left Wall
        { x: 0, y: -100, w: w, h: 100 }, // Ceiling
        
        // Pillars to swing between
        { x: 400, y: 0, w: 40, h: 300, type: 'normal' },
        { x: 800, y: 0, w: 40, h: 400, type: 'normal' },
        
        // Hazard floor
        { x: 300, y: h - 10, w: w - 300, h: 10, type: 'hazard' }
      ],
      coins: [
        { id: 1, x: 420, y: 400, collected: false, radius: 8 },
        { id: 2, x: 600, y: 500, collected: false, radius: 8 },
        { id: 3, x: 820, y: 500, collected: false, radius: 8 },
        { id: 4, x: 1000, y: 300, collected: false, radius: 8 },
      ],
      enemies: [
        { id: 201, x: 420, y: 350, radius: GAME_CONFIG.ENEMY_RADIUS, type: 'turret', cooldown: 0, dead: false },
        { id: 202, x: 820, y: 450, radius: GAME_CONFIG.ENEMY_RADIUS, type: 'turret', cooldown: 60, dead: false }
      ]
    };
  }

  // Level 3 - Verticality
  return {
      bounds: { w, h },
      spawnPoint: { x: w/2, y: h - 60 },
      exitPoint: { x: w/2, y: 100 },
      platforms: [
        { x: 0, y: h - 20, w: w, h: 20 },
        { x: -20, y: 0, w: 20, h: h },
        { x: w, y: 0, w: 20, h: h },
        { x: 0, y: -100, w: w, h: 100 },

        { x: 200, y: 500, w: 100, h: 20 },
        { x: w - 300, y: 500, w: 100, h: 20 },
        
        { x: 400, y: 300, w: 20, h: 20 }, // Tiny grapple point
        { x: w - 420, y: 300, w: 20, h: 20 }, // Tiny grapple point
        
        { x: w/2 - 50, y: 200, w: 100, h: 20 }, // Top blocker
      ],
      coins: [
        ...createCoinArc(w/2, 500, 300, 7, Math.PI + 0.2, 2 * Math.PI - 0.2),
        { id: 99, x: w/2, y: 250, collected: false, radius: 8 }
      ],
      enemies: [
        { id: 301, x: 250, y: 480, radius: GAME_CONFIG.ENEMY_RADIUS, type: 'turret', cooldown: 0, dead: false },
        { id: 302, x: w - 250, y: 480, radius: GAME_CONFIG.ENEMY_RADIUS, type: 'turret', cooldown: 60, dead: false }
      ]
  };
};
