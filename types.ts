
export enum ScreenState {
  MENU,
  PLAYING,
  GAME_OVER,
  LEVEL_COMPLETE,
  VICTORY
}

export interface Vector {
  x: number;
  y: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'normal' | 'bouncy' | 'hazard' | 'exit';
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  radius: number;
}

export interface Rope {
  active: boolean;
  anchor: Vector;
  length: number;
}

export interface Player {
  pos: Vector;
  vel: Vector;
  radius: number;
  grounded: boolean;
  facingRight: boolean;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  attackCooldown: number;
  attackActive: boolean; // Is the hitbox active?
  attackFrame: number; // Visual frame for animation
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'turret';
  cooldown: number;
  dead: boolean;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface GameData {
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  spawnPoint: Vector;
  exitPoint: Vector; // The portal
  bounds: { w: number, h: number };
}
