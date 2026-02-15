/**
 * GameRenderer - отвечает за визуализацию игры
 * Изолирует PixiJS-рендеринг от остальной логики
 */

import * as PIXI from 'pixi.js';
import { PlayerSchema, DraggableObjectSchema } from './types/schema';
import { GameStateManager } from './GameStateManager';

export class GameRenderer {
  private app: PIXI.Application | null = null;
  private gameStateManager: GameStateManager;
  private cursors: Map<string, PIXI.Sprite> = new Map();
  private cursorLabels: Map<string, PIXI.Text> = new Map();
  private objects: Map<string, PIXI.Container> = new Map();
  private links: PIXI.Graphics[] = new Map();
  private battleVisualization: PIXI.Graphics | null = null;
  private battleLayer: PIXI.Container | null = null;
  private battleContainer: PIXI.Container | null = null;

  constructor(gameStateManager: GameStateManager) {
    this.gameStateManager = gameStateManager;
  }

  async init(): Promise<void> {
    this.app = new PIXI.Application();
    await this.app.init({
      backgroundColor: 0x0f0f23, // Dark blue background
      antialias: false, // For crisp pixel art
      autoDensity: true,
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
    });

    // Add retro filters to the stage
    // Note: We'll need to import these filters appropriately
    // const pixelateFilter = new PixelateFilter();
    // pixelateFilter.size = new PIXI.Point(4, 4);

    // const noiseFilter = new NoiseFilter();
    // noiseFilter.noise = 0.1;
    // noiseFilter.seed = Math.random();

    // const bloomFilter = new BloomFilter();
    
    // this.app.stage.filters = [pixelateFilter, noiseFilter, bloomFilter] as any;
  }

  render(): void {
    if (!this.app) return;

    // Clear previous frame
    // this.app.renderer.render(this.app.stage);

    // Render current game state
    this.renderPlayers();
    this.renderObjects();
    this.renderLinks();
    if (this.gameStateManager.battleRunning) {
      this.renderBattle();
    }
  }

  private renderPlayers(): void {
    if (!this.app) return;

    // Clear existing cursors
    this.cursors.forEach(cursor => {
      if (cursor.parent) {
        cursor.parent.removeChild(cursor);
      }
    });
    this.cursorLabels.forEach(label => {
      if (label.parent) {
        label.parent.removeChild(label);
      }
    });

    // Render each player
    this.gameStateManager.players.forEach((player, playerId) => {
      this.renderPlayer(playerId, player);
    });
  }

  private renderPlayer(playerId: string, player: PlayerSchema): void {
    if (!this.app) return;

    // Create or update cursor
    let cursor = this.cursors.get(playerId);
    if (!cursor) {
      cursor = this.createCursorSprite(player.color);
      this.app.stage.addChild(cursor);
      this.cursors.set(playerId, cursor);
    }

    cursor.x = player.x;
    cursor.y = player.y;

    // Create or update label
    let label = this.cursorLabels.get(playerId);
    if (!label) {
      label = new PIXI.Text(player.name || `Player ${playerId.substring(0, 4)}`, {
        fontFamily: 'Courier New',
        fontSize: 14,
        fill: player.color,
        align: 'center'
      });
      label.anchor.set(0.5, 1.2); // Position below cursor
      this.app.stage.addChild(label);
      this.cursorLabels.set(playerId, label);
    }

    label.x = player.x;
    label.y = player.y;

    // Add click handler for holding hands (for non-current player)
    if (playerId !== this.gameStateManager.currentPlayerId) {
      cursor.eventMode = 'static';
      cursor.on('pointerdown', () => {
        // Trigger callback to handle hold hands
      });
    }
  }

  private createCursorSprite(color: number): PIXI.Sprite {
    // Create an 8-bit style cursor sprite
    const graphics = new PIXI.Graphics();

    // Draw an 8-bit style hand/cursor
    graphics.rect(-8, -8, 16, 16); // Main body
    graphics.fill({ color });

    // Add details to make it look more like a hand
    graphics.lineStyle(1, 0x000000); // Black outline (width, color)
    graphics.rect(-8, -8, 16, 16);
    graphics.stroke();

    // Add finger-like pixels
    graphics.rect(-6, -10, 4, 4); // Thumb
    graphics.fill({ color });
    graphics.rect(-2, -11, 4, 5); // Index finger
    graphics.fill({ color });
    graphics.rect(2, -10, 4, 4);  // Middle finger
    graphics.fill({ color });

    // Convert to texture and create sprite
    const texture = this.app?.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);

    // Add pixel art scaling
    sprite.scale.x = 2;
    sprite.scale.y = 2;

    return sprite;
  }

  private renderObjects(): void {
    if (!this.app) return;

    // Clear existing objects
    this.objects.forEach(container => {
      if (container.parent) {
        container.parent.removeChild(container);
      }
    });

    // Render each object
    this.gameStateManager.objects.forEach((obj, objectId) => {
      this.renderObject(objectId, obj);
    });
  }

  private renderObject(objectId: string, obj: DraggableObjectSchema): void {
    if (!this.app) return;

    // Create a container for the circle and text
    const container = new PIXI.Container();

    // Create a circle graphic for the draggable object
    const circle = new PIXI.Graphics();

    // Draw the circle with the specified color and radius
    circle.beginFill(obj.color);
    circle.drawCircle(0, 0, obj.radius);
    circle.endFill();

    // Add a border to make it more visible
    circle.lineStyle(2, 0x000000); // Black border
    circle.drawCircle(0, 0, obj.radius);

    // Create text to put inside the circle
    const text = new PIXI.Text("HERE", {
      fontFamily: 'Courier New',
      fontSize: 10,
      fill: 0x000000, // Black text
      align: 'center'
    });
    text.anchor.set(0.5); // Center the text

    // Position the container
    container.x = obj.x;
    container.y = obj.y;

    // Add circle and text to the container
    container.addChild(circle);
    container.addChild(text);

    // Enable interactivity on the container
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Add to stage and store in our map
    this.app.stage.addChild(container);
    this.objects.set(objectId, container);
  }

  private renderLinks(): void {
    if (!this.app) return;

    // Clear existing links
    this.links.forEach(link => {
      if (link.parent) {
        link.parent.removeChild(link);
      }
    });
    this.links.clear();

    // Create links between holding hands
    this.gameStateManager.players.forEach((player, playerId) => {
      if (player.isHoldingHands && player.holdingHandsWith) {
        const otherPlayerId = player.holdingHandsWith;
        const cursor1 = this.cursors.get(playerId);
        const cursor2 = this.cursors.get(otherPlayerId);

        if (cursor1 && cursor2) {
          this.createLink(playerId, otherPlayerId, cursor1, cursor2);
        }
      }
    });
  }

  private createLink(player1Id: string, player2Id: string, cursor1: PIXI.Sprite, cursor2: PIXI.Sprite): void {
    if (!this.app) return;

    const link = new PIXI.Graphics();
    (link as any).userData = { player1: player1Id, player2: player2Id };
    this.app.stage.addChild(link);
    this.links.set(link);

    // Update link position
    this.updateLinkPosition(link, cursor1, cursor2);
  }

  private updateLinkPosition(link: PIXI.Graphics, cursor1: PIXI.Sprite, cursor2: PIXI.Sprite): void {
    if (!link.userData) return; // Skip if userData is not set

    const player1Id = link.userData.player1;
    const player2Id = link.userData.player2;

    if (!player1Id || !player2Id) return; // Skip if player IDs are not set

    // Calculate distance between cursors
    const dx = cursor2.x - cursor1.x;
    const dy = cursor2.y - cursor1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Draw a pixelated chain effect
    const chainSegmentLength = 10;
    const numSegments = distance > 0 ? Math.floor(distance / chainSegmentLength) : 0;

    if (numSegments > 0) {
      // Calculate direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Draw chain segments
      for (let i = 0; i < numSegments; i++) {
        const startX = cursor1.x + dirX * i * chainSegmentLength;
        const startY = cursor1.y + dirY * i * chainSegmentLength;
        const endX = cursor1.x + dirX * (i + 1) * chainSegmentLength;
        const endY = cursor1.y + dirY * (i + 1) * chainSegmentLength;

        // Alternate between filled and empty segments for chain effect
        if (i % 2 === 0) {
          link.lineStyle(2, 0x00ff00);
          link.moveTo(startX, startY);
          link.lineTo(endX, endY);
        } else {
          // Draw a small circle to represent a chain link
          link.circle(startX, startY, 2);
          link.fill({ color: 0x00ff00 });
        }
      }
    }

    // Draw a line from last segment to the second cursor
    const dirX = distance > 0 ? dx / distance : 0; // Recalculate if needed for the final line
    const dirY = distance > 0 ? dy / distance : 0;
    const lastX = cursor1.x + dirX * numSegments * chainSegmentLength;
    const lastY = cursor1.y + dirY * numSegments * chainSegmentLength;
    link.lineStyle(2, 0x00ff00);
    link.moveTo(lastX, lastY);
    link.lineTo(cursor2.x, cursor2.y);
  }

  private renderBattle(): void {
    if (!this.app || !this.gameStateManager.battleRunning) return;

    // Create battle visualization if it doesn't exist
    if (!this.battleVisualization) {
      this.createBattleVisualization();
    }

    // Update battle visualization
    this.updateBattleVisualization();
  }

  private createBattleVisualization(): void {
    if (!this.app) return;

    // Create battle layer if it doesn't exist
    if (!this.battleLayer) {
      this.battleLayer = new PIXI.Container();
      this.app.stage.addChild(this.battleLayer);
    }

    // Create battle container for easy positioning
    if (!this.battleContainer) {
      this.battleContainer = new PIXI.Container();
    }

    // Create visualization graphics
    this.battleVisualization = new PIXI.Graphics();

    // Position battle zone at the start of the second third of the screen (640px wide)
    // Second third starts at ~33% of screen width
    this.battleVisualization.x = this.app.screen.width * 0.33; // Start from 33% from left (second third)
    // Center vertically to accommodate the fixed grid height
    const gridHeight = (640 / 20) * 32; // Calculate height based on 640px width
    this.battleVisualization.y = (this.app.screen.height - gridHeight) / 2; // Center vertically

    // Add visualization to container
    this.battleContainer.addChild(this.battleVisualization);

    // Add container to battle layer
    this.battleLayer.addChild(this.battleContainer);
  }

  private updateBattleVisualization(): void {
    if (!this.battleVisualization || !this.gameStateManager.serverBattleGrid) return;

    // Clear the previous visualization
    this.battleVisualization.clear();

    // Grid dimensions (20x32)
    const width = 20;
    const height = 32;

    // Calculate cell size based on fixed width of 640px
    const gridWidth = 640; // Fixed width of 640px
    const gridHeight = (640 / width) * height; // Maintain aspect ratio
    const cellSizeX = gridWidth / width;
    const cellSizeY = gridHeight / height;
    // Use minimum to ensure it fits
    const cellSize = Math.min(cellSizeX, cellSizeY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cellState = this.gameStateManager.serverBattleGrid[idx];

        let color: number;
        switch (cellState) {
          case 0: // EMPTY
            color = 0x000000; // Black for empty
            break;
          case 1: // VIRUS_A
            color = 0xff0000; // Red for player A
            break;
          case 2: // VIRUS_B
            color = 0x0000ff; // Blue for player B
            break;
          default:
            color = 0x000000; // Default to black
        }

        // Correct order: lineStyle before fill and draw
        this.battleVisualization.lineStyle(0.5, 0x333333); // Thin gray border
        this.battleVisualization.beginFill(color, cellState === 0 ? 0.3 : 1); // More visible for empty cells
        this.battleVisualization.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
        this.battleVisualization.endFill();
      }
    }
  }

  onResize(): void {
    if (this.app) {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    // Destroy all graphics objects
    this.cursors.forEach(cursor => cursor.destroy());
    this.cursorLabels.forEach(label => label.destroy());
    this.objects.forEach(container => container.destroy(true));
    this.links.forEach(link => link.destroy());

    this.cursors.clear();
    this.cursorLabels.clear();
    this.objects.clear();
    this.links.clear();

    if (this.battleVisualization) {
      this.battleVisualization.destroy();
      this.battleVisualization = null;
    }

    if (this.battleLayer) {
      this.battleLayer.destroy();
      this.battleLayer = null;
    }

    if (this.battleContainer) {
      this.battleContainer.destroy();
      this.battleContainer = null;
    }
  }

  get canvas(): HTMLCanvasElement | null {
    return this.app?.canvas || null;
  }

  get renderer(): PIXI.Renderer | null {
    return this.app?.renderer || null;
  }
}