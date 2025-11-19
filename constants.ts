

export const PHYSICS = {
  GRAVITY: 0.12, // Significantly reduced for floaty/long fall feel
  FRICTION: 0.95, // Less drag to maintain momentum in air
  GROUND_FRICTION: 0.82,
  MOVE_SPEED: 0.35,
  JUMP_FORCE: -9.2, // High jump force combined with low gravity = very high jump
  SWING_FORCE: 0.4, 
  ELASTICITY: 0.0, 
  MAX_SPEED: 10, 
  MAX_FALL_SPEED: 8.0, // Lower terminal velocity for floaty fall
  ROPE_TENSION: 0.1,
  ROPE_DAMPING: 0.8,
};

export const GAME_CONFIG = {
  PLAYER_RADIUS: 10, 
  COIN_RADIUS: 8,
  ENEMY_RADIUS: 12,
  PROJECTILE_RADIUS: 5,
  ROPE_RANGE: 450,
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  PLAYER_MAX_HP: 3,
  INVULN_TIME: 60, 
  ATTACK_COOLDOWN: 20, 
  ATTACK_DURATION: 10, 
  ENEMY_COOLDOWN: 180, 
  PROJECTILE_SPEED: 2.5, 
};

export const COLORS = {
  PLAYER: '#22d3ee', 
  PLAYER_GLOW: '#06b6d4',
  ROPE: '#e879f9', 
  PLATFORM: '#1e293b',
  PLATFORM_BORDER: '#334155',
  COIN: '#fbbf24', 
  BACKGROUND: '#0f172a',
  HAZARD: '#ef4444', 
  EXIT_LOCKED: '#475569',
  EXIT_OPEN: '#10b981',
  ENEMY: '#ef4444',
  PROJECTILE: '#f59e0b',
  HEART_FULL: '#ef4444',
  HEART_EMPTY: '#334155',
};