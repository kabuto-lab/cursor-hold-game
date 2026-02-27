import * as PIXI from 'pixi.js';
import { NetworkManager } from '../../core/NetworkManager';

/**
 * Mouse Follower System (MFL)
 * 
 * Each player sees TWO followers in real-time:
 * - mfl1 (RED): Follows Player 1's (creator) mouse
 * - mfl2 (BLUE): Follows Player 2's (joiner) mouse
 * 
 * Both players see BOTH followers on their screen.
 */

interface MouseFollowerData {
  playerId: string;           // Server session ID
  label: 'mfl1' | 'mfl2';     // Clear label
  color: number;              // Red for mfl1, Blue for mfl2
  targetX: number;            // Target position (from network)
  targetY: number;
  currentX: number;           // Interpolated position
  currentY: number;
  graphics: PIXI.Container | null;
  labelSprite: PIXI.Text | null;
  trail: TrailParticle[];     // Trail particles behind follower
}

interface TrailParticle {
  x: number;
  y: number;
  alpha: number;
  radius: number;
  graphics: PIXI.Graphics;
}

export class MouseFollowerManager {
  private followers: Map<string, MouseFollowerData> = new Map();
  private localPlayerId: string | null = null;
  private isCreator: boolean = false;
  private lastSendTime: number = 0;
  private readonly SEND_INTERVAL_MS: number = 33; // ~30 updates per second
  private readonly TRAIL_LENGTH: number = 8;      // Number of trail particles
  private readonly TRAIL_SPAWN_RATE: number = 3;  // Spawn trail every N frames
  private frameCount: number = 0;

  constructor(
    private stage: PIXI.Container,
    private networkManager: NetworkManager
  ) {
    console.log('[MouseFollowerManager] Created');
  }

  /**
   * Setup network listeners (call after room is joined)
   */
  setupNetworkListeners() {
    // Subscribe to server messages
    this.networkManager.onMessage('mflUpdate', (data: {
      playerId: string;
      isCreator: boolean;
      x: number;
      y: number;
    }) => {
      this.updateRemoteFollower(data.playerId, data.isCreator, data.x, data.y);
    });

    // Start interpolation ticker
    PIXI.Ticker.shared.add((ticker) => this.update(ticker.deltaTime));

    console.log('[MouseFollowerManager] Network listeners setup complete');
  }

  /**
   * Call when room is joined/created
   */
  onRoomJoined(isCreator: boolean, localPlayerId: string) {
    this.localPlayerId = localPlayerId;
    this.isCreator = isCreator;

    console.log(`[MouseFollowerManager] Room joined - isCreator: ${isCreator}, playerId: ${localPlayerId}`);

    // Create local follower entry (we'll update it every frame)
    const label = isCreator ? 'mfl1' : 'mfl2';
    const color = isCreator ? 0xff0000 : 0x0000ff; // Red for mfl1, Blue for mfl2

    this.followers.set(localPlayerId, {
      playerId: localPlayerId,
      label,
      color,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      graphics: null,
      labelSprite: null,
      trail: [],
    });

    console.log(`[MouseFollowerManager] Created local follower: ${label}`);
  }

  /**
   * Update local mouse position - called every frame from InputManager
   */
  updateLocalPosition(x: number, y: number) {
    if (!this.localPlayerId) return;

    const follower = this.followers.get(this.localPlayerId);
    if (follower) {
      follower.targetX = x;
      follower.targetY = y;

      // Send to server (rate-limited)
      const now = Date.now();
      if (now - this.lastSendTime > this.SEND_INTERVAL_MS) {
        this.networkManager.sendToRoom('mflUpdate', {
          isCreator: this.isCreator,
          x,
          y
        });
        this.lastSendTime = now;
      }
    }
  }

  /**
   * Update remote follower position from server
   */
  private updateRemoteFollower(playerId: string, isCreator: boolean, x: number, y: number) {
    let follower = this.followers.get(playerId);

    if (!follower) {
      // New remote player joined - create follower
      const label = isCreator ? 'mfl1' : 'mfl2';
      const color = isCreator ? 0xff0000 : 0x0000ff;

      follower = {
        playerId,
        label,
        color,
        targetX: x,
        targetY: y,
        currentX: x,
        currentY: y,
        graphics: null,
        labelSprite: null,
        trail: [],
      };

      this.followers.set(playerId, follower);
      console.log(`[MouseFollowerManager] Created remote follower: ${label} (${playerId})`);
    }

    // Update target position
    follower.targetX = x;
    follower.targetY = y;
  }

  /**
   * Create visual representation for a follower
   */
  private createFollowerGraphics(follower: MouseFollowerData) {
    if (follower.graphics) return; // Already created

    const container = new PIXI.Container();

    // Create the follower circle (glowing effect)
    const circle = new PIXI.Graphics();
    circle.beginFill(follower.color, 0.5); // Semi-transparent fill
    circle.drawCircle(0, 0, 20);
    circle.endFill();
    circle.lineStyle(3, follower.color, 1); // Solid color border
    circle.drawCircle(0, 0, 20);

    // Inner glow
    const glow = new PIXI.Graphics();
    glow.beginFill(follower.color, 0.3);
    glow.drawCircle(0, 0, 25);
    glow.endFill();

    // Center dot
    const center = new PIXI.Graphics();
    center.beginFill(0xffffff, 1);
    center.drawCircle(0, 0, 5);
    center.endFill();

    // Create label text
    const labelSprite = new PIXI.Text(follower.label, {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: follower.color,
      fontWeight: 'bold',
      stroke: {
        color: 0x000000,
        width: 4,
      } as any,
    });
    labelSprite.anchor.set(0.5);
    labelSprite.x = 0;
    labelSprite.y = -35; // Above the circle

    // Assemble container
    container.addChild(glow);
    container.addChild(circle);
    container.addChild(center);
    container.addChild(labelSprite);

    container.zIndex = 1000;
    
    // КРИТИЧЕСКИ ВАЖНО: followers пропускают события мыши сквозь себя
    container.eventMode = 'none'; // Не блокирует mouse events

    this.stage.addChild(container);

    follower.graphics = container;
    follower.labelSprite = labelSprite;

    console.log(`[MouseFollowerManager] Created graphics for ${follower.label}`);
  }

  /**
   * Update all followers (interpolation + rendering + trail)
   */
  private update(delta: number) {
    const lerp = 0.2; // Smoother interpolation
    this.frameCount++;

    this.followers.forEach((follower) => {
      if (!follower.graphics) {
        // Create graphics on first update
        this.createFollowerGraphics(follower);
        return;
      }

      // Interpolate position
      follower.currentX += (follower.targetX - follower.currentX) * lerp * delta;
      follower.currentY += (follower.targetY - follower.currentY) * lerp * delta;

      // Update position
      follower.graphics.position.set(follower.currentX, follower.currentY);

      // Pulse effect for active followers
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
      follower.graphics.scale.set(pulse);

      // Spawn trail particles
      if (this.frameCount % this.TRAIL_SPAWN_RATE === 0) {
        this.spawnTrailParticle(follower);
      }

      // Update trail particles
      this.updateTrail(follower);
    });
  }

  /**
   * Spawn a new trail particle at follower's current position
   */
  private spawnTrailParticle(follower: MouseFollowerData) {
    // Create trail particle graphics
    const particle = new PIXI.Graphics();
    const radius = 12;
    particle.beginFill(follower.color, 0.6);
    particle.drawCircle(0, 0, radius);
    particle.endFill();
    particle.position.set(follower.currentX, follower.currentY);
    particle.zIndex = 999; // Just below the main follower

    this.stage.addChild(particle);

    // Add to trail array
    follower.trail.push({
      x: follower.currentX,
      y: follower.currentY,
      alpha: 0.6,
      radius,
      graphics: particle,
    });

    // Limit trail length
    if (follower.trail.length > this.TRAIL_LENGTH) {
      const oldParticle = follower.trail.shift();
      if (oldParticle && oldParticle.graphics) {
        this.stage.removeChild(oldParticle.graphics);
        oldParticle.graphics.destroy();
      }
    }
  }

  /**
   * Update trail particles (fade out and shrink)
   */
  private updateTrail(follower: MouseFollowerData) {
    follower.trail.forEach((particle, index) => {
      // Fade out based on position in trail (older = more faded)
      const fadeFactor = 1 - (index / this.TRAIL_LENGTH);
      particle.alpha = 0.6 * fadeFactor;
      
      // Shrink radius
      const newRadius = particle.radius * fadeFactor;
      
      // Update graphics
      particle.graphics.clear();
      particle.graphics.beginFill(follower.color, particle.alpha);
      particle.graphics.drawCircle(0, 0, newRadius);
      particle.graphics.endFill();
    });
  }

  /**
   * Get current follower count
   */
  getFollowerCount(): number {
    return this.followers.size;
  }

  /**
   * Clear all followers (on room leave)
   */
  destroy() {
    this.followers.forEach((follower) => {
      if (follower.graphics) {
        this.stage.removeChild(follower.graphics);
      }
      // Clean up trail particles
      follower.trail.forEach((particle) => {
        if (particle.graphics) {
          this.stage.removeChild(particle.graphics);
          particle.graphics.destroy();
        }
      });
      follower.trail = [];
    });
    this.followers.clear();
    console.log('[MouseFollowerManager] Destroyed');
  }
}
