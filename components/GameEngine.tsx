
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Heart } from 'lucide-react';
import { Player, Rope, GameData, Vector, Platform, Projectile, Enemy } from '../types';
import { PHYSICS, GAME_CONFIG, COLORS } from '../constants';
import { getLevelData } from '../utils/levels';
import { sfx } from '../utils/audio';

interface GameEngineProps {
  levelIndex: number;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number, nextLevel?: number) => void;
  onExit: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ levelIndex, onGameOver, onLevelComplete, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  // Game State Refs
  const playerRef = useRef<Player>({
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    radius: GAME_CONFIG.PLAYER_RADIUS,
    grounded: false,
    facingRight: true,
    hp: GAME_CONFIG.PLAYER_MAX_HP,
    maxHp: GAME_CONFIG.PLAYER_MAX_HP,
    invulnTimer: 0,
    attackCooldown: 0,
    attackActive: false,
    attackFrame: 0
  });
  
  const ropeRef = useRef<Rope>({ active: false, anchor: { x: 0, y: 0 }, length: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number, y: number, leftClicked: boolean, rightClicked: boolean }>({ x: 0, y: 0, leftClicked: false, rightClicked: false });
  
  // Mutable Combat State (Enemies & Projectiles handled locally to loop for speed, synced to state for init)
  // We use a Ref for mutable game entities in the loop to avoid React overhead
  const entitiesRef = useRef<{ projectiles: Projectile[], enemies: Enemy[] }>({ projectiles: [], enemies: [] });

  // Advanced Jump Mechanics Refs
  const coyoteFramesRef = useRef(0);
  const jumpBufferFramesRef = useRef(0);
  
  // React State for UI
  const [score, setScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerHp, setPlayerHp] = useState(GAME_CONFIG.PLAYER_MAX_HP); // Sync for UI

  // ----------------------------------------------------------------
  // Physics Helpers
  // ----------------------------------------------------------------

  const getDistance = (v1: Vector, v2: Vector) => {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const checkCircleCollision = (c1: {x: number, y: number, radius: number}, c2: {x: number, y: number, radius: number}) => {
    const dist = getDistance({x: c1.x, y: c1.y}, {x: c2.x, y: c2.y});
    return dist < c1.radius + c2.radius;
  };

  // Raycast to find anchor point
  const findAnchor = (origin: Vector, target: Vector, platforms: Platform[]): Vector | null => {
    let bestPoint: Vector | null = null;
    let minDist = GAME_CONFIG.ROPE_RANGE;

    platforms.forEach(p => {
      // Check closest point on platform rect to target (mouse)
      const px = Math.max(p.x, Math.min(target.x, p.x + p.w));
      const py = Math.max(p.y, Math.min(target.y, p.y + p.h));
      
      const distToMouse = getDistance(target, { x: px, y: py });
      
      // If mouse is close enough to a surface, snap to it
      if (distToMouse < 60) {
        const distToPlayer = getDistance(origin, { x: px, y: py });
        if (distToPlayer < minDist) {
          minDist = distToPlayer;
          bestPoint = { x: px, y: py };
        }
      }
    });

    return bestPoint;
  };

  // ----------------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------------
  useEffect(() => {
    const data = getLevelData(levelIndex);
    setGameData(data);
    setTotalCoins(data.coins.length);
    setScore(0);
    setPlayerHp(GAME_CONFIG.PLAYER_MAX_HP);
    
    // Reset Player
    playerRef.current = {
      pos: { ...data.spawnPoint },
      vel: { x: 0, y: 0 },
      radius: GAME_CONFIG.PLAYER_RADIUS,
      grounded: false,
      facingRight: true,
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      invulnTimer: 0,
      attackCooldown: 0,
      attackActive: false,
      attackFrame: 0
    };
    ropeRef.current = { active: false, anchor: { x: 0, y: 0 }, length: 0 };
    entitiesRef.current = {
      projectiles: [],
      enemies: data.enemies.map(e => ({ ...e })) // Deep copy
    };

    coyoteFramesRef.current = 0;
    jumpBufferFramesRef.current = 0;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  // ----------------------------------------------------------------
  // Game Loop
  // ----------------------------------------------------------------

  const update = useCallback(() => {
    if (!gameData) return;

    const player = playerRef.current;
    const rope = ropeRef.current;
    const keys = keysRef.current;
    const entities = entitiesRef.current;
    
    frameCountRef.current++;

    // --- Player Combat Logic ---
    
    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invulnTimer > 0) player.invulnTimer--;

    // Attack Input
    if (mouseRef.current.rightClicked && player.attackCooldown === 0) {
      player.attackActive = true;
      player.attackCooldown = GAME_CONFIG.ATTACK_COOLDOWN;
      player.attackFrame = GAME_CONFIG.ATTACK_DURATION;
      sfx.playAttack();
      mouseRef.current.rightClicked = false; // Consume input
    }

    if (player.attackFrame > 0) {
      player.attackFrame--;
      // Attack Hitbox Check
      if (player.attackActive) {
         // Simple Attack Hitbox: Semi-circle in front
         const attackRange = 40;
         const dir = player.facingRight ? 1 : -1;
         const attackCenter = { x: player.pos.x + dir * 20, y: player.pos.y };
         
         // Check Enemies
         entities.enemies.forEach(enemy => {
            if (!enemy.dead) {
              const dist = getDistance(attackCenter, enemy);
              if (dist < attackRange + enemy.radius) {
                 enemy.dead = true;
                 sfx.playHit();
              }
            }
         });
         
         // Only active for one frame (instant hit) or maybe a few? 
         // Let's make it active for the first few frames of animation
         if (player.attackFrame < GAME_CONFIG.ATTACK_DURATION - 5) {
            player.attackActive = false; 
         }
      }
    }

    // --- Movement & Physics ---

    // Decrease Jump Timers
    if (coyoteFramesRef.current > 0) coyoteFramesRef.current--;
    if (jumpBufferFramesRef.current > 0) jumpBufferFramesRef.current--;

    // Update Coyote Time
    if (player.grounded) {
      coyoteFramesRef.current = 10;
    }

    // Input Forces
    if (keys['KeyA'] || keys['ArrowLeft']) {
      player.vel.x -= PHYSICS.MOVE_SPEED;
      player.facingRight = false;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      player.vel.x += PHYSICS.MOVE_SPEED;
      player.facingRight = true;
    }

    // Jump
    const canJump = coyoteFramesRef.current > 0 || rope.active;
    const wantsJump = jumpBufferFramesRef.current > 0;

    if (wantsJump && canJump) {
      player.vel.y = PHYSICS.JUMP_FORCE;
      player.grounded = false;
      coyoteFramesRef.current = 0; 
      jumpBufferFramesRef.current = 0; 
      rope.active = false; 
      sfx.playJump();
    }

    // Gravity
    player.vel.y += PHYSICS.GRAVITY;

    // Rope
    if (mouseRef.current.leftClicked) {
      if (!rope.active) {
        const anchor = findAnchor(player.pos, mouseRef.current, gameData.platforms);
        if (anchor) {
          rope.active = true;
          rope.anchor = anchor;
          rope.length = getDistance(player.pos, anchor);
          sfx.playShoot();
          player.grounded = false;
        }
      }
    } else {
      rope.active = false;
    }

    if (rope.active) {
      const dist = getDistance(player.pos, rope.anchor);
      const dx = rope.anchor.x - player.pos.x;
      const dy = rope.anchor.y - player.pos.y;

      if (dist > rope.length) {
        const k = 0.05; 
        const force = (dist - rope.length) * k;
        const ax = (dx / dist) * force;
        const ay = (dy / dist) * force;

        player.vel.x += ax;
        player.vel.y += ay;

        player.vel.x *= 0.99;
        player.vel.y *= 0.99;
      }

      if (keys['KeyA'] || keys['ArrowLeft']) player.vel.x -= PHYSICS.SWING_FORCE;
      if (keys['KeyD'] || keys['ArrowRight']) player.vel.x += PHYSICS.SWING_FORCE;
      
      if (keys['KeyW'] || keys['ArrowUp']) rope.length = Math.max(rope.length - 3, 20);
      if (keys['KeyS'] || keys['ArrowDown']) rope.length += 3;
    }

    // Friction & Limits
    player.vel.x *= player.grounded ? PHYSICS.GROUND_FRICTION : PHYSICS.FRICTION;
    player.vel.y *= PHYSICS.FRICTION;

    const speed = Math.sqrt(player.vel.x**2 + player.vel.y**2);
    if (speed > PHYSICS.MAX_SPEED) {
      const ratio = PHYSICS.MAX_SPEED / speed;
      player.vel.x *= ratio;
      player.vel.y *= ratio;
    }

    if (player.vel.y > PHYSICS.MAX_FALL_SPEED) {
      player.vel.y = PHYSICS.MAX_FALL_SPEED;
    }

    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;

    // Platform Collision
    player.grounded = false;
    for (const p of gameData.platforms) {
      const closestX = Math.max(p.x, Math.min(player.pos.x, p.x + p.w));
      const closestY = Math.max(p.y, Math.min(player.pos.y, p.y + p.h));
      
      const distX = player.pos.x - closestX;
      const distY = player.pos.y - closestY;
      const distSq = distX*distX + distY*distY;

      if (distSq < player.radius * player.radius) {
        if (p.type === 'hazard') {
          // Hazard does damage now instead of instant kill? 
          // Prompt implies "health bar", so let's do damage.
          if (player.invulnTimer === 0) {
             player.hp--;
             player.invulnTimer = GAME_CONFIG.INVULN_TIME;
             setPlayerHp(player.hp);
             sfx.playHit();
             
             // Knockback
             player.vel.y = -10;
          }
        }

        const dist = Math.sqrt(distSq);
        const overlap = player.radius - dist;
        let nx = distX / (dist || 1);
        let ny = distY / (dist || 1);
        if (dist === 0) { nx = 0; ny = -1; }

        player.pos.x += nx * overlap;
        player.pos.y += ny * overlap;

        if (ny < -0.5) {
           player.grounded = true;
           if (player.vel.y > 0) player.vel.y = 0;
        } else if (ny > 0.5) {
           if (player.vel.y < 0) player.vel.y = 0;
        }
        
        if (Math.abs(nx) > 0.5) {
          player.vel.x = 0;
        }
      }
    }

    // --- Entities Logic ---

    // Enemies
    entities.enemies.forEach(enemy => {
       if (enemy.dead) return;

       // Shooting Logic
       if (enemy.type === 'turret') {
         const dist = getDistance(player.pos, enemy);
         if (dist < 400) { // Range
           if (enemy.cooldown > 0) {
             enemy.cooldown--;
           } else {
             // Shoot
             const dx = player.pos.x - enemy.x;
             const dy = player.pos.y - enemy.y;
             const mag = Math.sqrt(dx*dx + dy*dy);
             
             entities.projectiles.push({
                id: Math.random(),
                x: enemy.x,
                y: enemy.y,
                vx: (dx/mag) * GAME_CONFIG.PROJECTILE_SPEED,
                vy: (dy/mag) * GAME_CONFIG.PROJECTILE_SPEED,
                radius: GAME_CONFIG.PROJECTILE_RADIUS,
                active: true
             });
             
             enemy.cooldown = GAME_CONFIG.ENEMY_COOLDOWN;
             sfx.playEnemyShoot();
           }
         }
       }

       // Contact Damage
       if (player.invulnTimer === 0 && checkCircleCollision({ x: player.pos.x, y: player.pos.y, radius: player.radius }, enemy)) {
          player.hp--;
          player.invulnTimer = GAME_CONFIG.INVULN_TIME;
          setPlayerHp(player.hp);
          sfx.playHit();
          
          // Knockback away from enemy
          const dx = player.pos.x - enemy.x;
          const dy = player.pos.y - enemy.y;
          player.vel.x = dx > 0 ? 5 : -5;
          player.vel.y = -5;
       }
    });

    // Projectiles
    for (let i = entities.projectiles.length - 1; i >= 0; i--) {
      const proj = entities.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      // Bounds check
      if (proj.x < 0 || proj.x > gameData.bounds.w || proj.y < 0 || proj.y > gameData.bounds.h) {
        proj.active = false;
      }

      // Wall Check
      for (const p of gameData.platforms) {
         if (proj.x > p.x && proj.x < p.x + p.w && proj.y > p.y && proj.y < p.y + p.h) {
            proj.active = false;
         }
      }
      
      // Player Hit Check
      if (proj.active && player.invulnTimer === 0 && checkCircleCollision({ x: player.pos.x, y: player.pos.y, radius: player.radius }, proj)) {
         player.hp--;
         player.invulnTimer = GAME_CONFIG.INVULN_TIME;
         setPlayerHp(player.hp);
         sfx.playHit();
         proj.active = false;
      }

      if (!proj.active) {
        entities.projectiles.splice(i, 1);
      }
    }

    // Coin Collection
    gameData.coins.forEach(coin => {
      if (!coin.collected) {
        const d = getDistance(player.pos, coin);
        if (d < player.radius + coin.radius) {
          coin.collected = true;
          sfx.playCollect();
          setScore(prev => prev + 1);
        }
      }
    });

    // Level Exit
    if (score >= totalCoins) { 
       const dToExit = getDistance(player.pos, gameData.exitPoint);
       if (dToExit < 30) {
         sfx.playWin();
         onLevelComplete(score, levelIndex < 3 ? levelIndex + 1 : undefined);
       }
    }
    
    // Death Logic
    if (player.pos.y > gameData.bounds.h + 100 || player.hp <= 0) {
      sfx.playDie();
      onGameOver(score);
    }

  }, [gameData, score, totalCoins, levelIndex, onGameOver, onLevelComplete]);

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  const drawHumanoid = (ctx: CanvasRenderingContext2D, p: Player, ropeActive: boolean, anchor: Vector) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    
    // Flash if invulnerable
    if (p.invulnTimer > 0 && Math.floor(frameCountRef.current / 4) % 2 === 0) {
       ctx.globalAlpha = 0.5;
    }

    const dir = p.facingRight ? 1 : -1;
    
    // Animation params
    const speed = Math.abs(p.vel.x);
    const time = frameCountRef.current * 0.2;
    const legOffset = p.grounded && speed > 0.1 ? Math.sin(time) * 5 : 0;
    const bob = p.grounded && speed > 0.1 ? Math.abs(Math.sin(time)) * 2 : 0;
    
    ctx.strokeStyle = COLORS.PLAYER;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // --- LEGS ---
    ctx.beginPath();
    if (p.grounded) {
        if (speed > 0.1) {
            ctx.moveTo(0, 5); ctx.lineTo(-4 * dir + legOffset, 14); 
            ctx.moveTo(0, 5); ctx.lineTo(4 * dir - legOffset, 14); 
        } else {
            ctx.moveTo(0, 5); ctx.lineTo(-3, 14); 
            ctx.moveTo(0, 5); ctx.lineTo(3, 14); 
        }
    } else {
        if (ropeActive) {
            const swingLag = -p.vel.x * 1.5; 
            ctx.moveTo(0, 5); ctx.lineTo(-2 + swingLag, 12);
            ctx.moveTo(0, 5); ctx.lineTo(2 + swingLag, 14);
        } else {
             ctx.moveTo(0, 5); ctx.lineTo(-4 * dir, 10); ctx.lineTo(-6 * dir, 14);
             ctx.moveTo(0, 5); ctx.lineTo(2 * dir, 9); ctx.lineTo(6 * dir, 13);
        }
    }
    ctx.stroke();

    // --- TORSO ---
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(0 + (p.vel.x * 0.2), -6 + bob);
    ctx.stroke();

    // --- ARMS ---
    ctx.beginPath();
    if (ropeActive) {
        const dx = anchor.x - p.pos.x;
        const dy = anchor.y - p.pos.y;
        const angle = Math.atan2(dy, dx);
        const armLen = 10;
        ctx.moveTo(0, -4 + bob);
        ctx.lineTo(Math.cos(angle) * armLen, Math.sin(angle) * armLen - 4 + bob);
        ctx.moveTo(0, -4 + bob);
        ctx.lineTo(Math.cos(angle) * 5, Math.sin(angle) * 5 - 2 + bob);
    } else if (p.attackFrame > 0) {
        // Attack pose
        ctx.moveTo(0, -4 + bob); ctx.lineTo(10 * dir, 0); // Punch out
        ctx.moveTo(0, -4 + bob); ctx.lineTo(-5 * dir, 2); // Back arm
    } else {
        if (speed > 0.1 && p.grounded) {
             ctx.moveTo(0, -4 + bob); ctx.lineTo(-6 * dir - legOffset, 2 + bob);
             ctx.moveTo(0, -4 + bob); ctx.lineTo(6 * dir + legOffset, 2 + bob);
        } else {
             ctx.moveTo(0, -4); ctx.lineTo(5 * dir, 0);
             ctx.moveTo(0, -4); ctx.lineTo(-5 * dir, 0);
        }
    }
    ctx.stroke();

    // --- HEAD ---
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.beginPath();
    ctx.arc(0 + (p.vel.x * 0.2), -9 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(0 + (p.vel.x * 0.2), -9 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // --- ATTACK SWIPE EFFECT ---
    if (p.attackFrame > 0) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw arc
      ctx.arc(0, 0, 25, (dir > 0 ? -0.5 : 0.5) * Math.PI, (dir > 0 ? 0.5 : 1.5) * Math.PI, false);
      ctx.stroke();
      
      ctx.strokeStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(0, 0, 20, (dir > 0 ? -0.3 : 0.7) * Math.PI, (dir > 0 ? 0.3 : 1.3) * Math.PI, false);
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y < canvas.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Rope
    if (ropeRef.current.active) {
      ctx.beginPath();
      ctx.moveTo(playerRef.current.pos.x, playerRef.current.pos.y - 5);
      ctx.lineTo(ropeRef.current.anchor.x, ropeRef.current.anchor.y);
      ctx.strokeStyle = COLORS.ROPE;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = COLORS.ROPE;
      ctx.beginPath();
      ctx.arc(ropeRef.current.anchor.x, ropeRef.current.anchor.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } 

    // Platforms
    gameData.platforms.forEach(p => {
      if (p.type === 'hazard') {
        ctx.fillStyle = COLORS.HAZARD;
      } else {
        ctx.fillStyle = COLORS.PLATFORM;
      }
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = COLORS.PLATFORM_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // Enemies
    entitiesRef.current.enemies.forEach(e => {
       if (!e.dead) {
          ctx.fillStyle = COLORS.ENEMY;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye
          const pdx = playerRef.current.pos.x - e.x;
          const pdy = playerRef.current.pos.y - e.y;
          const dist = Math.sqrt(pdx*pdx + pdy*pdy);
          const eyeX = (pdx/dist) * 4;
          const eyeY = (pdy/dist) * 4;

          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(e.x + eyeX, e.y + eyeY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(e.x + eyeX, e.y + eyeY, 2, 0, Math.PI * 2);
          ctx.fill();
       }
    });

    // Projectiles
    entitiesRef.current.projectiles.forEach(p => {
       ctx.fillStyle = COLORS.PROJECTILE;
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
       ctx.fill();
       ctx.shadowColor = COLORS.PROJECTILE;
       ctx.shadowBlur = 10;
       ctx.stroke();
       ctx.shadowBlur = 0;
    });

    // Coins
    const time = Date.now() * 0.005;
    gameData.coins.forEach(c => {
      if (!c.collected) {
        const floatY = Math.sin(time + c.x) * 3;
        ctx.fillStyle = COLORS.COIN;
        ctx.beginPath();
        ctx.arc(c.x, c.y + floatY, c.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(c.x - 2, c.y + floatY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Exit
    const exitOpen = score >= totalCoins;
    ctx.fillStyle = exitOpen ? COLORS.EXIT_OPEN : COLORS.EXIT_LOCKED;
    ctx.beginPath();
    ctx.arc(gameData.exitPoint.x, gameData.exitPoint.y, exitOpen ? 25 : 15, 0, Math.PI * 2);
    ctx.fill();
    if (exitOpen) {
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 2;
       ctx.setLineDash([5, 5]);
       ctx.beginPath();
       ctx.arc(gameData.exitPoint.x, gameData.exitPoint.y, 30 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
       ctx.stroke();
       ctx.setLineDash([]);
    }

    // Player
    drawHumanoid(ctx, playerRef.current, ropeRef.current.active, ropeRef.current.anchor);

    // Cursor
    const target = mouseRef.current;
    ctx.strokeStyle = COLORS.PLAYER_GLOW;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
    ctx.stroke();

  }, [gameData, score, totalCoins]);

  // ----------------------------------------------------------------
  // Loop Management
  // ----------------------------------------------------------------
  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  // ----------------------------------------------------------------
  // Event Listeners
  // ----------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      keysRef.current[e.code] = true; 
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        jumpBufferFramesRef.current = 10; 
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    
    const canvas = canvasRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };
    const handleMouseDown = (e: MouseEvent) => { 
       if (e.button === 0) mouseRef.current.leftClicked = true;
       if (e.button === 2) mouseRef.current.rightClicked = true;
    };
    const handleMouseUp = (e: MouseEvent) => { 
       if (e.button === 0) mouseRef.current.leftClicked = false;
       if (e.button === 2) mouseRef.current.rightClicked = false;
    };
    const handleContextMenu = (e: MouseEvent) => {
       e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    window.addEventListener('mousemove', handleMouseMove); 
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);


  return (
    <div className="relative shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden bg-black select-none">
      {/* Heads Up Display */}
      <div className="absolute top-4 left-4 flex items-center gap-4 pointer-events-none select-none z-10">
         {/* Health Bar */}
         <div className="flex gap-1">
            {[...Array(GAME_CONFIG.PLAYER_MAX_HP)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-8 h-8 fill-current ${i < playerHp ? 'text-red-500' : 'text-slate-700'}`}
              />
            ))}
         </div>

         <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 px-4 py-2 rounded-full text-white font-mono flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            LEVEL {levelIndex}
         </div>
         <div className="bg-slate-900/80 backdrop-blur border border-amber-500/30 px-4 py-2 rounded-full text-amber-400 font-mono font-bold">
            NODES: {score} / {totalCoins}
         </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto z-10">
         <button 
           onClick={onExit}
           className="p-2 bg-slate-800/50 hover:bg-red-500/80 text-white rounded-full transition-colors"
           title="Exit Level"
         >
            <AlertCircle className="w-5 h-5" />
         </button>
      </div>
      
      <div className="absolute bottom-4 left-4 pointer-events-none text-white/30 text-sm z-10">
        Right Click to Attack
      </div>

      <canvas 
        ref={canvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        className="block w-full h-full max-h-[80vh] max-w-[80vw] cursor-crosshair"
        style={{ aspectRatio: `${GAME_CONFIG.CANVAS_WIDTH}/${GAME_CONFIG.CANVAS_HEIGHT}` }}
      />
    </div>
  );
};

export default GameEngine;
