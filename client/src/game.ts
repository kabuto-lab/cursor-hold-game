import * as PIXI from 'pixi.js';
import { Client } from 'colyseus.js';
import { PlayerSchema, DraggableObjectSchema } from './types/schema';
import { PixelateFilter } from '@pixi/filter-pixelate';
import { NoiseFilter } from '@pixi/filter-noise';
import { BloomFilter } from '@pixi/filter-bloom';

export class Game {
  private app!: PIXI.Application;
  private client!: Client;
  private room: any;
  private cursors: Map<string, PIXI.Sprite> = new Map();
  private cursorLabels: Map<string, PIXI.Text> = new Map();
  private links: PIXI.Graphics[] = [];
  private objects: Map<string, PIXI.Graphics> = new Map();
  private currentPlayerId: string = '';
  // private gameState: RoomState | null = null;  // TODO: Use this for game state management - commented out for now to avoid unused error
  private playerName: string = '';

  // UI elements
  private landingScreen!: HTMLElement;
  private gameScreen!: HTMLElement;
  private createRoomBtn!: HTMLButtonElement;
  private joinRoomBtn!: HTMLButtonElement;
  private roomIdInput!: HTMLInputElement;
  private leaveRoomBtn!: HTMLButtonElement;
  private connectionStatus!: HTMLElement;
  private playerNameEl!: HTMLElement;
  private otherPlayerNameEl!: HTMLElement;
  private currentRoomIdEl!: HTMLElement;

  constructor() {
    // Initialize UI elements
    this.landingScreen = document.getElementById('landingScreen')!;
    this.gameScreen = document.getElementById('gameScreen')!;
    this.createRoomBtn = document.getElementById('createRoomBtn')! as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn')! as HTMLButtonElement;
    this.roomIdInput = document.getElementById('roomIdInput')! as HTMLInputElement;
    this.leaveRoomBtn = document.getElementById('leaveRoomBtn')! as HTMLButtonElement;
    this.connectionStatus = document.getElementById('connectionStatus')!;
    this.playerNameEl = document.getElementById('playerName')!;
    this.otherPlayerNameEl = document.getElementById('otherPlayerName')!;
    this.currentRoomIdEl = document.getElementById('currentRoomId')!;

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
    this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
  }

  async init(): Promise<void> {
    // Initialize the PixiJS application
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
    const pixelateFilter = new PixelateFilter();
    pixelateFilter.size = new PIXI.Point(4, 4); // Set size using Point

    const noiseFilter = new NoiseFilter(); // Create without arguments
    noiseFilter.noise = 0.1; // Set noise level
    noiseFilter.seed = Math.random(); // Set seed

    const bloomFilter = new BloomFilter(); // Create without arguments

    this.app.stage.filters = [pixelateFilter, noiseFilter, bloomFilter] as any;

    // Add the PixiJS application canvas to the canvas container
    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
      canvasContainer.appendChild(this.app.canvas);
    }

    // Create a starry background
    this.createStarryBackground();

    // Initialize the Colyseus client with secure connection
    let serverUrl;
    if (window.location.protocol === 'https:') {
      // Production: use WSS for secure connection
      serverUrl = 'wss://cursor-hold-game-server.onrender.com';
    } else {
      // Development: use WS for local connection
      serverUrl = `ws://${window.location.hostname}:2567`;
    }
    this.client = new Client(serverUrl);

    // Set up keyboard controls for accessibility
    this.setupKeyboardControls();

    // Make game instance accessible globally for resize handler
    (window as any).holdingHandsGame = this;
  }

  private createStarryBackground(): void {
    // Create a container for stars
    const starContainer = new PIXI.Container();
    
    // Generate random stars
    for (let i = 0; i < 200; i++) {
      const size = Math.random() * 2;
      const star = new PIXI.Graphics()
        .circle(0, 0, size)
        .fill({ color: 0xFFFFFF });

      // Random position
      star.x = Math.random() * this.app.screen.width;
      star.y = Math.random() * this.app.screen.height;

      // Random twinkle effect
      (star as any).alpha = 0.3 + Math.random() * 0.7;

      starContainer.addChild(star);
    }
    
    this.app.stage.addChildAt(starContainer, 0); // Add at bottom layer
  }

  private setupKeyboardControls(): void {
    // Allow arrow key movement for accessibility
    window.addEventListener('keydown', (e) => {
      if (!this.room || !this.currentPlayerId) return;
      
      const speed = 10;
      let dx = 0;
      let dy = 0;
      
      switch(e.key) {
        case 'ArrowUp': dy = -speed; break;
        case 'ArrowDown': dy = speed; break;
        case 'ArrowLeft': dx = -speed; break;
        case 'ArrowRight': dx = speed; break;
        case ' ': // Spacebar to hold hands
          this.toggleHoldHands();
          break;
        case 'Escape': // Escape to release hold
          if (this.isHoldingHands()) {
            this.releaseHold();
          }
          break;
      }
      
      if (dx !== 0 || dy !== 0) {
        const cursor = this.cursors.get(this.currentPlayerId);
        if (cursor) {
          const newX = Math.max(0, Math.min(this.app.screen.width, cursor.x + dx));
          const newY = Math.max(0, Math.min(this.app.screen.height, cursor.y + dy));
          
          cursor.x = newX;
          cursor.y = newY;
          
          // Send position update to server
          this.room.send('updatePosition', { x: newX, y: newY });
        }
      }
    });
  }

  private async createRoom(): Promise<void> {
    // Ensure client is initialized
    if (!this.client) {
      alert('Client not initialized. Please refresh the page.');
      return;
    }

    try {
      // Create room without specifying custom ID - let Colyseus assign one
      this.room = await this.client.create('holding_room', {});
      this.currentPlayerId = this.room.sessionId;
      this.setupRoomHandlers();

      // Prompt for player name
      this.playerName = prompt('Enter your name:', `Player${this.currentPlayerId.substring(0, 4)}`) || `Player${this.currentPlayerId.substring(0, 4)}`;
      this.room.send('setPlayerName', { name: this.playerName });

      // Show game screen - use the actual room ID assigned by Colyseus
      this.showGameScreen(this.room.id);
    } catch (error: any) {
      console.error('Failed to create room:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      alert(`Failed to create room: ${error.message || 'Connection timeout or server issue'}. Please try again.`);
    }
  }

  private async joinRoom(): Promise<void> {
    const roomId = this.roomIdInput.value.trim();
    if (!roomId) {
      alert('Please enter a room ID');
      return;
    }

    // Ensure client is initialized
    if (!this.client) {
      alert('Client not initialized. Please refresh the page.');
      return;
    }

    try {
      this.room = await this.client.joinById(roomId);
      this.currentPlayerId = this.room.sessionId;
      this.setupRoomHandlers();

      // Prompt for player name
      this.playerName = prompt('Enter your name:', `Player${this.currentPlayerId.substring(0, 4)}`) || `Player${this.currentPlayerId.substring(0, 4)}`;
      this.room.send('setPlayerName', { name: this.playerName });

      // Show game screen - use the actual room ID from the room object
      this.showGameScreen(this.room.id);
    } catch (error: any) {
      console.error('Failed to join room:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      alert(`Failed to join room: ${error.message || 'Connection timeout or server issue'}. The room may not exist or be full.`);
    }
  }

  private setupRoomHandlers(): void {
    // Handle room state changes
    this.room.state.players.onAdd = (_player: PlayerSchema, key: string) => {
      this.addPlayer(key, _player);
    };

    this.room.state.players.onRemove = (_player: PlayerSchema, key: string) => {
      this.removePlayer(key);
    };

    // Handle draggable objects state changes
    this.room.state.objects.onAdd = (obj: DraggableObjectSchema, key: string) => {
      this.addObject(key, obj);
    };

    this.room.state.objects.onRemove = (_obj: DraggableObjectSchema, key: string) => {
      this.removeObject(key);
    };

    // Listen for state changes
    // this.room.state.onChange(() => {
    //   this.gameState = this.room.state;
    // });

    // Listen for position updates
    this.room.onMessage('updatePosition', (data: { playerId: string; x: number; y: number }) => {
      // Update the cursor position for the player who sent the update
      this.updateCursorPosition(data.playerId, { x: data.x, y: data.y });
    });

    // Listen for hold hands events
    this.room.onMessage('holdHands', (data: { player1Id: string; player2Id: string }) => {
      this.startHoldingHands(data.player1Id, data.player2Id);
    });

    this.room.onMessage('releaseHands', (data: { player1Id: string; player2Id: string }) => {
      this.stopHoldingHands(data.player1Id, data.player2Id);
    });

    // Listen for player name updates
    this.room.onMessage('playerNameUpdated', (data: { playerId: string; name: string }) => {
      this.updatePlayerName(data.playerId, data.name);
    });

    // Listen for object drag events
    this.room.onMessage('objectDragStarted', (data: { objectId: string; playerId: string }) => {
      this.handleObjectDragStarted(data.objectId, data.playerId);
    });

    this.room.onMessage('objectPositionUpdated', (data: { objectId: string; x: number; y: number }) => {
      this.updateObjectPosition(data.objectId, { x: data.x, y: data.y });
    });

    this.room.onMessage('objectDragStopped', (data: { objectId: string; playerId: string }) => {
      this.handleObjectDragStopped(data.objectId, data.playerId);
    });

    // Handle room connection events
    this.room.onLeave((code: number) => {
      console.log('Left room with code:', code);
      this.handleDisconnection(code);
    });

    this.room.onError((err: any) => {
      console.error('Room error:', err);
      this.showError('Connection error occurred. Please refresh the page.');
    });

    // Handle reconnection attempts - Note: Modern Colyseus doesn't use .on() for these
    // These events are handled internally by the client, so we'll remove them
    // Reconnection status is handled by connection events
  }

  private addPlayer(playerId: string, player: PlayerSchema): void {
    // Create cursor sprite
    const cursorSprite = this.createCursorSprite(player.color);
    this.app.stage.addChild(cursorSprite);
    this.cursors.set(playerId, cursorSprite);

    // Create label for the player
    const nameLabel = new PIXI.Text(player.name || `Player ${playerId.substring(0, 4)}`, {
      fontFamily: 'Courier New',
      fontSize: 14,
      fill: player.color,
      align: 'center'
    });
    nameLabel.anchor.set(0.5, 1.2); // Position below cursor
    this.app.stage.addChild(nameLabel);
    this.cursorLabels.set(playerId, nameLabel);

    // Update cursor position
    cursorSprite.x = player.x;
    cursorSprite.y = player.y;
    nameLabel.x = player.x;
    nameLabel.y = player.y;

    // Add click handler for holding hands (for non-current player)
    if (playerId !== this.currentPlayerId) {
      cursorSprite.eventMode = 'static';
      cursorSprite.on('pointerdown', () => {
        this.toggleHoldHandsWith(playerId);
      });
    }
  }

  private removePlayer(playerId: string): void {
    const cursor = this.cursors.get(playerId);
    if (cursor) {
      this.app.stage.removeChild(cursor);
      this.cursors.delete(playerId);
    }

    const label = this.cursorLabels.get(playerId);
    if (label) {
      this.app.stage.removeChild(label);
      this.cursorLabels.delete(playerId);
    }

    // Remove any links associated with this player
    this.links = this.links.filter(link => {
      if (link.userData && (link.userData.player1 === playerId || link.userData.player2 === playerId)) {
        this.app.stage.removeChild(link);
        return false;
      }
      return true;
    });
  }

  private addObject(objectId: string, obj: DraggableObjectSchema): void {
    // Create a circle graphic for the draggable object
    const circle = new PIXI.Graphics();
    
    // Draw the circle with the specified color and radius
    circle.beginFill(obj.color);
    circle.drawCircle(0, 0, obj.radius);
    circle.endFill();
    
    // Add a border to make it more visible
    circle.lineStyle(2, 0x000000); // Black border
    circle.drawCircle(0, 0, obj.radius);
    
    // Position the circle
    circle.x = obj.x;
    circle.y = obj.y;
    
    // Enable interactivity
    circle.eventMode = 'static';
    circle.cursor = 'pointer';
    
    // Store reference to the object ID for event handling
    (circle as any).objectId = objectId;
    
    // Add drag event handlers
    circle.on('pointerdown', (event: PIXI.FederatedPointerEvent) => this.startDraggingObject(event, objectId));
    circle.on('globalpointermove', (_event: PIXI.FederatedPointerEvent) => this.draggingObject(_event, objectId));
    circle.on('pointerup', (_event: PIXI.FederatedPointerEvent) => this.stopDraggingObject(_event, objectId));
    circle.on('pointerupoutside', (_event: PIXI.FederatedPointerEvent) => this.stopDraggingObject(_event, objectId));
    
    // Add to stage and store in our map
    this.app.stage.addChild(circle);
    this.objects.set(objectId, circle);
  }

  private removeObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (object) {
      this.app.stage.removeChild(object);
      this.objects.delete(objectId);
    }
  }

  private startDraggingObject(_event: PIXI.FederatedPointerEvent, objectId: string): void {
    if (!this.room) return;
    
    // Send message to server to start dragging
    this.room.send('startDraggingObject', { objectId });
  }

  private draggingObject(_event: PIXI.FederatedPointerEvent, objectId: string): void {
    if (!this.room) return;
    
    const object = this.objects.get(objectId);
    if (!object) return;
    
    // Get global position and convert to local stage coordinates
    const pos = _event.global;
    
    // Update object position
    object.x = pos.x;
    object.y = pos.y;
    
    // Send position update to server
    this.room.send('updateObjectPosition', { 
      objectId, 
      x: pos.x, 
      y: pos.y 
    });
  }

  private stopDraggingObject(_event: PIXI.FederatedPointerEvent, objectId: string): void {
    if (!this.room) return;
    
    // Send message to server to stop dragging
    this.room.send('stopDraggingObject', { objectId });
  }

  private updateObjectPosition(objectId: string, position: { x: number; y: number }): void {
    const object = this.objects.get(objectId);
    if (object) {
      // Update the object's position with smooth interpolation
      object.x = position.x;
      object.y = position.y;
    }
  }

  private handleObjectDragStarted(objectId: string, _playerId: string): void {
    const object = this.objects.get(objectId);
    if (object) {
      // Visually indicate that the object is being dragged by another player
      // For example, change the border color
      object.clear();
      
      // Redraw the circle with the specified color and radius
      const objData = this.room.state.objects.get(objectId);
      if (objData) {
        object.beginFill(objData.color);
        object.drawCircle(0, 0, objData.radius);
        object.endFill();
        
        // Add a different colored border to indicate it's being dragged
        object.lineStyle(3, 0xffff00); // Yellow border when being dragged
        object.drawCircle(0, 0, objData.radius);
      }
    }
  }

  private handleObjectDragStopped(objectId: string, _playerId: string): void {
    const object = this.objects.get(objectId);
    if (object) {
      // Reset the visual indication that the object is being dragged
      const objData = this.room.state.objects.get(objectId);
      if (objData) {
        object.clear();
        
        // Redraw the circle with the specified color and radius
        object.beginFill(objData.color);
        object.drawCircle(0, 0, objData.radius);
        object.endFill();
        
        // Add a black border
        object.lineStyle(2, 0x000000); // Black border
        object.drawCircle(0, 0, objData.radius);
      }
    }
  }

  private createCursorSprite(color: number): PIXI.Sprite {
    // Create an 8-bit style cursor sprite
    const graphics = new PIXI.Graphics();
    
    // Draw an 8-bit style hand/cursor
    graphics.rect(-8, -8, 16, 16); // Main body
    graphics.fill({ color: color });

    // Add details to make it look more like a hand
    graphics.lineStyle(1, 0x000000); // Black outline (width, color)
    graphics.rect(-8, -8, 16, 16);
    graphics.stroke();

    // Add finger-like pixels
    graphics.rect(-6, -10, 4, 4); // Thumb
    graphics.fill({ color: color });
    graphics.rect(-2, -11, 4, 5); // Index finger
    graphics.fill({ color: color });
    graphics.rect(2, -10, 4, 4);  // Middle finger
    graphics.fill({ color: color });
    
    // Convert to texture and create sprite
    const texture = this.app.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    
    // Add pixel art scaling
    sprite.scale.x = 2;
    sprite.scale.y = 2;
    
    return sprite;
  }

  private updateCursorPosition(playerId: string, position: { x: number; y: number }): void {
    const cursor = this.cursors.get(playerId);
    const label = this.cursorLabels.get(playerId);
    
    if (cursor) {
      // Smooth interpolation for smoother movement
      cursor.x = position.x;
      cursor.y = position.y;
    }
    
    if (label) {
      label.x = position.x;
      label.y = position.y;
    }
    
    // Update link positions if players are holding hands
    this.updateLinks();
  }

  private updatePlayerName(playerId: string, name: string): void {
    const label = this.cursorLabels.get(playerId);
    if (label) {
      label.text = name;
    }
    
    // Update UI labels
    if (playerId === this.currentPlayerId) {
      this.playerNameEl.textContent = name;
    } else {
      this.otherPlayerNameEl.textContent = name;
    }
  }

  private toggleHoldHandsWith(targetPlayerId: string): void {
    if (!this.room) return;
    
    // Check if already holding hands
    const isAlreadyHolding = Array.from(this.links).some(link =>
      link.userData && 
      ((link.userData.player1 === this.currentPlayerId && link.userData.player2 === targetPlayerId) ||
      (link.userData.player1 === targetPlayerId && link.userData.player2 === this.currentPlayerId))
    );
    
    if (isAlreadyHolding) {
      this.releaseHold();
    } else {
      this.room.send('requestHoldHands', { targetPlayerId });
    }
  }

  private toggleHoldHands(): void {
    // Find the other player to hold hands with
    const otherPlayerId = Array.from(this.cursors.keys()).find(id => id !== this.currentPlayerId);
    if (otherPlayerId) {
      this.toggleHoldHandsWith(otherPlayerId);
    }
  }

  private isHoldingHands(): boolean {
    return this.links.length > 0;
  }

  private startHoldingHands(player1Id: string, player2Id: string): void {
    // Remove any existing links
    this.clearLinks();
    
    // Create a link between the two players
    const link = new PIXI.Graphics();
    (link as any).userData = { player1: player1Id, player2: player2Id };
    this.app.stage.addChild(link);
    this.links.push(link);
    
    this.updateLinks();
    
    // Start the timer for the easter egg
    if (player1Id === this.currentPlayerId || player2Id === this.currentPlayerId) {
      this.startEasterEggTimer();
    }
  }

  private easterEggTimer: number | null = null;
  private easterEggInterval: number | null = null;

  private startEasterEggTimer(): void {
    // Clear any existing timer
    if (this.easterEggTimer) {
      clearTimeout(this.easterEggTimer);
    }
    
    // Clear any existing interval
    if (this.easterEggInterval) {
      clearInterval(this.easterEggInterval);
    }
    
    // Set timer for 30 seconds
    this.easterEggTimer = window.setTimeout(() => {
      this.triggerEasterEgg();
    }, 30000); // 30 seconds
    
    // Also set an interval to check if holding hands is still active
    this.easterEggInterval = window.setInterval(() => {
      // Check if still holding hands
      if (!this.isHoldingHands()) {
        this.clearEasterEggTimers();
      }
    }, 1000);
  }

  private clearEasterEggTimers(): void {
    if (this.easterEggTimer) {
      clearTimeout(this.easterEggTimer);
      this.easterEggTimer = null;
    }
    
    if (this.easterEggInterval) {
      clearInterval(this.easterEggInterval);
      this.easterEggInterval = null;
    }
  }

  private triggerEasterEgg(): void {
    // Clear the timers
    this.clearEasterEggTimers();
    
    // Create heart particles
    this.createHeartParticles();
    
    // Show a message
    this.showMessage("Aww! You've been holding hands for 30 seconds! 💕");
  }

  private createHeartParticles(): void {
    const heartContainer = new PIXI.Container();
    
    // Create heart-shaped particles
    for (let i = 0; i < 50; i++) {
      const heart = new PIXI.Graphics();
      
      // Draw a simple heart shape
      const points = [
        0, -5,
        -3, -8,
        -6, -10,
        -3, -12,
        0, -10,
        3, -12,
        6, -10,
        3, -8,
        0, -5
      ];
      heart.poly(points);
      heart.fill({ color: 0xFF00FF }); // Pink/purple color
      
      // Random position near the center
      heart.x = this.app.screen.width / 2 + (Math.random() - 0.5) * 200;
      heart.y = this.app.screen.height / 2 + (Math.random() - 0.5) * 200;
      
      // Random rotation and scale
      heart.rotation = Math.random() * Math.PI * 2;
      heart.scale.set(0.5 + Math.random() * 0.5);
      
      // Add animation properties
      (heart as any).vx = (Math.random() - 0.5) * 2;
      (heart as any).vy = (Math.random() - 0.5) * 2;
      (heart as any).life = 200; // Frames to live
      
      heartContainer.addChild(heart);
    }
    
    this.app.stage.addChild(heartContainer);
    
    // Animate the particles
    let frameCount = 0;
    const animateHearts = () => {
      frameCount++;
      if (frameCount > 200) { // Run for ~200 frames
        this.app.ticker.remove(animateHearts);
        this.app.stage.removeChild(heartContainer);
        return;
      }
      
      for (let i = 0; i < heartContainer.children.length; i++) {
        const heart = heartContainer.children[i] as PIXI.Graphics;
        (heart as any).x += (heart as any).vx;
        (heart as any).y += (heart as any).vy;
        
        // Fade out over time
        heart.alpha = (heart as any).life / 200;
        (heart as any).life--;
      }
    };
    
    this.app.ticker.add(animateHearts);
  }

  private showMessage(text: string): void {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = text;
    messageEl.style.cssText = `
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 10px 20px;
      border: 2px solid #00ffff;
      border-radius: 0;
      font-family: 'Courier New', monospace;
      font-size: 1.2rem;
      z-index: 1000;
      text-align: center;
      animation: fadeInOut 3s ease-in-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageEl);
    
    // Remove after animation completes
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  }

  private stopHoldingHands(player1Id: string, player2Id: string): void {
    // Find and remove the link between these players
    const linkIndex = this.links.findIndex(link =>
      link.userData && 
      ((link.userData.player1 === player1Id && link.userData.player2 === player2Id) ||
      (link.userData.player1 === player2Id && link.userData.player2 === player1Id))
    );
    
    if (linkIndex !== -1) {
      const link = this.links[linkIndex];
      this.app.stage.removeChild(link);
      this.links.splice(linkIndex, 1);
    }
    
    // Clear easter egg timers if we were holding hands
    if (player1Id === this.currentPlayerId || player2Id === this.currentPlayerId) {
      this.clearEasterEggTimers();
    }
  }

  private clearLinks(): void {
    this.links.forEach(link => {
      this.app.stage.removeChild(link);
    });
    this.links = [];
  }

  private updateLinks(): void {
    this.links.forEach(link => {
      if (!link.userData) return; // Skip if userData is not set
      
      const player1Id = link.userData.player1;
      const player2Id = link.userData.player2;

      if (!player1Id || !player2Id) return; // Skip if player IDs are not set

      const cursor1 = this.cursors.get(player1Id);
      const cursor2 = this.cursors.get(player2Id);

      if (cursor1 && cursor2) {
        link.clear();

        // Draw a chain-like link between cursors with 8-bit style
        link.lineStyle(2, 0x00ff00);

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
    });
  }

  private releaseHold(): void {
    if (!this.room) return;
    this.room.send('releaseHands');
  }

  private showGameScreen(roomId: string): void {
    this.landingScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    
    this.currentRoomIdEl.textContent = roomId;
    
    // Set up mouse/touch controls
    this.setupMouseControls();
  }

  private setupMouseControls(): void {
    // Handle mouse movement
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (!this.room || !this.currentPlayerId) return;

      const pos = event.global;
      const cursor = this.cursors.get(this.currentPlayerId);

      if (cursor) {
        // Wrap around screen edges
        let newX = pos.x;
        let newY = pos.y;

        if (pos.x < 0) newX = this.app.screen.width;
        else if (pos.x > this.app.screen.width) newX = 0;

        if (pos.y < 0) newY = this.app.screen.height;
        else if (pos.y > this.app.screen.height) newY = 0;

        cursor.x = newX;
        cursor.y = newY;

        // Update label position
        const label = this.cursorLabels.get(this.currentPlayerId);
        if (label) {
          label.x = newX;
          label.y = newY;
        }

        // Send position update to server
        this.room.send('updatePosition', { x: newX, y: newY });
      }
    });
  }

  // Keeping this function for tests and potential future use
  public generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private handleDisconnection(code?: number): void {
    // Show a message about the disconnection
    if (code === 4000) {
      // Room was full
      this.showError('Room is full. Please try again later.');
    } else if (code === 1006) {
      // Connection lost
      this.showError('Connection lost. Attempting to reconnect...');
      // Try to reconnect after a delay
      setTimeout(() => {
        if (!this.room) {
          this.reconnectToRoom();
        }
      }, 2000);
    } else {
      // Normal disconnection
      this.leaveRoom();
    }
  }

  private showError(message: string): void {
    // Create an error message element
    let errorEl = document.getElementById('errorMessage');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'errorMessage';
      errorEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ff0000;
        color: white;
        padding: 15px 25px;
        border: 2px solid #ffff00;
        border-radius: 0;
        font-family: 'Courier New', monospace;
        font-size: 1rem;
        z-index: 1000;
        text-align: center;
      `;
      document.body.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorEl && errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    if (this.connectionStatus) {
      this.connectionStatus.className = `connection-status ${status}`;
    }
  }

  private async reconnectToRoom(): Promise<void> {
    if (!this.currentRoomIdEl) return;

    const roomId = this.currentRoomIdEl.textContent;
    if (!roomId) return;

    // Ensure client is initialized
    if (!this.client) {
      console.error('Client not initialized for reconnection.');
      return;
    }

    try {
      // Reconnect to the same room
      this.room = await this.client.joinById(roomId);
      this.setupRoomHandlers();

      // Update UI
      this.updateConnectionStatus('connected');
    } catch (error: any) {
      console.error('Reconnection failed:', error);
      console.error('Reconnection error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      setTimeout(() => this.reconnectToRoom(), 5000); // Retry after 5 seconds
    }
  }

  private async leaveRoom(): Promise<void> {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    
    // Clear all game objects
    this.cursors.forEach(cursor => this.app.stage.removeChild(cursor));
    this.cursorLabels.forEach(label => this.app.stage.removeChild(label));
    this.links.forEach(link => this.app.stage.removeChild(link));
    
    this.cursors.clear();
    this.cursorLabels.clear();
    this.links = [];
    
    // Show landing screen again
    this.gameScreen.classList.add('hidden');
    this.landingScreen.classList.remove('hidden');
  }

  public onResize(): void {
    // Resize the PixiJS application to fit the window
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }
}