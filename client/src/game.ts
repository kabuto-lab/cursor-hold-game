import * as PIXI from 'pixi.js';
import { Client } from 'colyseus.js';
import { PlayerSchema, DraggableObjectSchema } from './types/schema';
import { PixelateFilter } from '@pixi/filter-pixelate';
import { NoiseFilter } from '@pixi/filter-noise';
import { BloomFilter } from '@pixi/filter-bloom';
import { VirusBattleAlgebra, CellState } from './virus-battle-algebra';

export class Game {
  private app!: PIXI.Application;
  private client!: Client;
  private room: any;
  private cursors: Map<string, PIXI.Sprite> = new Map();
  private cursorLabels: Map<string, PIXI.Text> = new Map();
  private links: PIXI.Graphics[] = [];
  private objects: Map<string, PIXI.Container> = new Map();
  private currentPlayerId: string = '';
  // private gameState: RoomState | null = null;  // TODO: Use this for game state management - commented out for now to avoid unused error
  private playerName: string = '';
  
  // Track if current player is the room creator
  private isRoomCreator: boolean = false;
  
  
  // Chat elements
  private chatMessagesDiv!: HTMLElement;
  private chatInput!: HTMLInputElement;
  private chatSendBtn!: HTMLButtonElement;
  
  
  
  // Last known cursor positions for followers
  private lastCursorPositions: Map<string, { x: number; y: number }> = new Map();
  
  // Last sent target positions for followers
  private lastSentTargetPositions: Map<string, { x: number; y: number }> = new Map();
  
  // Sidebar elements
  private menuBtn!: HTMLButtonElement;
  private sidebar!: HTMLElement;
  private closeSidebarBtn!: HTMLButtonElement;
  
  // Left sidebar elements
  private leftMenuBtn!: HTMLButtonElement;
  private leftSidebar!: HTMLElement;
  private closeLeftSidebarBtn!: HTMLButtonElement;

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
  
  // Virus parameter elements
  private paramValues: { [key: string]: number } = {};
  private pointsRemainingEl!: HTMLElement;
  private readyBtn!: HTMLButtonElement;
  private randomizeBtn!: HTMLButtonElement;
  private totalPoints: number = 12;
  private maxParamValue: number = 12; // Maximum value for any single parameter

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

    // Initialize chat elements
    this.chatMessagesDiv = document.getElementById('chat-messages')!;
    this.chatInput = document.getElementById('chat-input')! as HTMLInputElement;
    this.chatSendBtn = document.getElementById('chat-send-btn')! as HTMLButtonElement;

    // Initialize sidebar elements
    this.menuBtn = document.getElementById('menuBtn')! as HTMLButtonElement;
    this.sidebar = document.getElementById('sidebar')!;
    this.closeSidebarBtn = document.getElementById('closeSidebarBtn')! as HTMLButtonElement;

    // Initialize left sidebar elements
    this.leftMenuBtn = document.getElementById('leftMenuBtn')! as HTMLButtonElement;
    this.leftSidebar = document.getElementById('leftSidebar')!;
    this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn')! as HTMLButtonElement;

    // Initialize virus parameter elements
    this.pointsRemainingEl = document.getElementById('points-remaining')!;
    this.readyBtn = document.getElementById('readyBtn')! as HTMLButtonElement;
    this.randomizeBtn = document.getElementById('randomizeBtn')! as HTMLButtonElement;

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
    this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());

    // Chat event listeners
    this.chatSendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Sidebar event listeners
    this.menuBtn.addEventListener('click', () => this.openSidebar());
    this.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());


    // Left sidebar event listeners
    this.leftMenuBtn.addEventListener('click', () => this.openLeftSidebar());
    this.closeLeftSidebarBtn.addEventListener('click', () => this.closeLeftSidebar());
    
    // Virus parameter event listeners
    this.setupVirusParameterEventListeners();
    
    // Ready button event listener
    this.readyBtn.addEventListener('click', () => this.toggleReadyStatus());
    
    // Randomize button event listener
    this.randomizeBtn.addEventListener('click', () => this.randomizeParameters());
    
    // Room ID click to copy event listener
    this.currentRoomIdEl.addEventListener('click', () => this.copyRoomIdToClipboard());
  }

  private setupVirusParameterEventListeners(): void {
    // Define all parameter names
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];

    // Initialize parameter values to 0
    paramNames.forEach(param => {
      this.paramValues[param] = 0;
    });

    // Add event listeners to each parameter cell
    paramNames.forEach(param => {
      const paramCell = document.querySelector(`.param-cell[data-param="${param}"]`);
      if (paramCell) {
        // Add click event to increase parameter value
        paramCell.addEventListener('click', () => {
          this.increaseParameterValue(param);
        });

        // Add click event to emoji and name to decrease parameter value
        const emojiEl = paramCell.querySelector('.param-emoji');
        const nameEl = paramCell.querySelector('.param-name');
        
        if (emojiEl) {
          emojiEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent click
            this.decreaseParameterValue(param);
          });
        }
        
        if (nameEl) {
          nameEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent click
            this.decreaseParameterValue(param);
          });
        }
      }
    });

    // Initialize the display
    this.updatePointsDisplay();
  }

  private increaseParameterValue(param: string): void {
    if (this.paramValues[param] < this.maxParamValue && this.totalPoints > 0) {
      this.paramValues[param]++;
      this.totalPoints--;
      this.updateParameterDisplay(param);
      this.updatePointsDisplay();
      
      // Send updated parameters to server
      this.sendParameterUpdate();
    }
  }

  private decreaseParameterValue(param: string): void {
    if (this.paramValues[param] > 0) {
      this.paramValues[param]--;
      this.totalPoints++;
      this.updateParameterDisplay(param);
      this.updatePointsDisplay();
      
      // Send updated parameters to server
      this.sendParameterUpdate();
    }
  }

  private updateParameterDisplay(param: string): void {
    const paramValueEl = document.getElementById(`param-${param}`);
    if (paramValueEl) {
      paramValueEl.textContent = this.paramValues[param].toString();
    }
  }

  private updatePointsDisplay(): void {
    if (this.pointsRemainingEl) {
      this.pointsRemainingEl.textContent = this.totalPoints.toString();
    }
  }

  private sendParameterUpdate(): void {
    if (this.room) {
      // Send current parameter values to server
      this.room.send('updateVirusParams', { params: this.paramValues });
    }
  }

  private toggleReadyStatus(): void {
    if (this.totalPoints === 0) {
      if (this.room) {
        // Toggle ready status
        this.room.send('toggleReady', { isReady: !this.isPlayerReady });
      }
    } else {
      alert('Please distribute all 12 points before marking as ready.');
    }
  }

  private isPlayerReady: boolean = false;
  
  // Virus battle simulation
  private virusBattle: VirusBattleAlgebra | null = null;
  private battleVisualization: PIXI.Graphics | null = null;
  private battleRunning: boolean = false;
  private battleTicker: PIXI.Ticker | null = null;
  
  // Server-synchronized battle grid
  private serverBattleGrid: number[] = [];
  
  // Battle visualization layer to avoid mouse event conflicts
  private battleLayer: PIXI.Container | null = null;

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

    // Set up ticker for follower movement
    this.setupFollowerTicker();

    // Make game instance accessible globally for resize handler
    (window as any).holdingHandsGame = this;
  }

  private setupFollowerTicker(): void {
    // Set up a ticker to update follower positions with easing
    this.app.ticker.add(() => {
      this.updateFollowers();
    });
  }

  private updateFollowers(): void {
    // Iterate through all objects to find followers
    for (const [id, container] of this.objects.entries()) {
      const objData = this.room?.state.objects.get(id);
      if (objData && objData.isFollower) {
        // Apply easing to move the follower toward its target position
        // Use a default value since the slider was removed
        const easingFactor = 0.1;
        
        // Calculate the difference between current position and target position
        const dx = objData.targetX - container.x;
        const dy = objData.targetY - container.y;
        
        // Move the container towards the target with easing
        container.x += dx * easingFactor;
        container.y += dy * easingFactor;

        // If the follower belongs to the current player, update the target position to follow the cursor
        if (objData.owner === this.currentPlayerId) {
          const cursor = this.cursors.get(this.currentPlayerId);
          if (cursor) {
            // Update the target position to follow the cursor with some delay
            // Only update if cursor is within canvas bounds
            if (cursor.x >= 0 && cursor.x <= this.app.screen.width && 
                cursor.y >= 0 && cursor.y <= this.app.screen.height) {
              objData.targetX = cursor.x;
              objData.targetY = cursor.y;
              
              // Store the last known cursor position
              this.lastCursorPositions.set(this.currentPlayerId, { x: cursor.x, y: cursor.y });
              
              // Send the new target position to the server
              this.room?.send('updateFollowerTarget', {
                id: id,
                x: objData.targetX,
                y: objData.targetY
              });
              
              // Store the last sent target position
              this.lastSentTargetPositions.set(id, { x: objData.targetX, y: objData.targetY });
            }
          }
        } else {
          // If this is another player's circle, ensure it's always following their cursor
          const otherPlayerCursor = this.cursors.get(objData.owner);
          if (otherPlayerCursor) {
            // Update the target position to follow the other player's cursor
            if (otherPlayerCursor.x >= 0 && otherPlayerCursor.x <= this.app.screen.width && 
                otherPlayerCursor.y >= 0 && otherPlayerCursor.y <= this.app.screen.height) {
              objData.targetX = otherPlayerCursor.x;
              objData.targetY = otherPlayerCursor.y;
            }
          }
        }
      }
    }
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
      this.isRoomCreator = true; // Set flag for room creator
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
      this.isRoomCreator = false; // Set flag for non-creator
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
      this.updatePlayerCount();
    };

    this.room.state.players.onRemove = (_player: PlayerSchema, key: string) => {
      this.removePlayer(key);
      this.updatePlayerCount();
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

    // Listen for chat messages
    this.room.onMessage('chatMessage', (data: { playerId: string; playerName: string; message: string; timestamp: number }) => {
      this.displayChatMessage(data.playerName, data.message, data.timestamp);
    });

    // Listen for ball creation
    this.room.onMessage('ballCreated', (data: { id: string; x: number; y: number; radius: number; color: number }) => {
      // Create a temporary DraggableObjectSchema object to pass to addObject
      const tempObj = {
        id: data.id,
        x: data.x,
        y: data.y,
        radius: data.radius,
        color: data.color,
        isBeingDragged: false,
        draggedBy: '',
        isFollower: false,
        owner: '',
        targetX: data.x,
        targetY: data.y
      };
      this.addObject(data.id, tempObj as DraggableObjectSchema);
    });

    // Listen for follower creation
    this.room.onMessage('followerCreated', (data: { id: string; x: number; y: number; radius: number; color: number; owner: string }) => {
      // Create a temporary DraggableObjectSchema object to pass to addObject
      const tempObj = {
        id: data.id,
        x: data.x,
        y: data.y,
        radius: data.radius,
        color: data.color,
        isBeingDragged: false,
        draggedBy: '',
        isFollower: true,
        owner: data.owner,
        targetX: data.x,
        targetY: data.y
      };
      this.addObject(data.id, tempObj as DraggableObjectSchema);
    });

    // Listen for follower target updates
    this.room.onMessage('followerTargetUpdated', (data: { id: string; x: number; y: number }) => {
      // Update the target position for the follower
      const objData = this.room.state.objects.get(data.id);
      if (objData) {
        objData.targetX = data.x;
        objData.targetY = data.y;

        // Also update our local record of the last sent position
        this.lastSentTargetPositions.set(data.id, { x: data.x, y: data.y });
      }
    });


    // Listen for virus parameter updates
    this.room.onMessage('virusParamsUpdated', (data: { playerId: string; params: { [key: string]: number } }) => {
      this.updateVirusParameters(data.playerId, data.params);
    });

    // Listen for ready status updates
    this.room.onMessage('playerReadyStatus', (data: { playerId: string; isReady: boolean }) => {
      this.updatePlayerReadyStatus(data.playerId, data.isReady);
    });

    // Listen for virus battle start
    this.room.onMessage('virusBattleStarted', (data: { message: string; battleGrid: number[]; timestamp: number }) => {
      this.startVirusBattle(data.message);
      // Initialize the battle grid from server data
      this.updateBattleVisualizationFromServer(data.battleGrid);
    });

    // Listen for virus battle tick
    this.room.onMessage('virusTick', (data: { tick: number; battleGrid: number[]; message: string }) => {
      // Update the battle grid from server data
      this.updateBattleVisualizationFromServer(data.battleGrid);
      this.handleVirusTick(data.tick, data.message);
    });

    // Listen for virus battle end
    this.room.onMessage('virusBattleEnded', (data: { message: string; winner: string; virusACount: number; virusBCount: number; timestamp: number }) => {
      this.endVirusBattle(`${data.message} Winner: ${data.winner}`);
    });

    // Listen for cursor updates
    this.room.onMessage('cursorUpdate', (data: { playerId: string; x: number; y: number }) => {
      if (data.playerId !== this.currentPlayerId && !this.battleRunning) {
        this.updateOtherCursor(data.x, data.y);
      }
    });

    // Handle room connection events
    this.room.onLeave((code: number) => {
      console.log('Left room with code:', code);
      this.handleDisconnection(code);
      
      // Remove other player's cursor when they disconnect, but not during battle
      if (this.otherCursor && !this.battleRunning) {
        this.app.stage.removeChild(this.otherCursor);
        this.otherCursor = null;
      }
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
    // Create cursor sprite with appropriate color
    const cursorSprite = this.createCursorSprite(playerId, player.color);
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
    
    // Remove other player's cursor if they disconnected
    if (this.otherCursor && playerId !== this.currentPlayerId && !this.battleRunning) {
      this.app.stage.removeChild(this.otherCursor);
      this.otherCursor = null;
    }
  }

  private addObject(objectId: string, obj: DraggableObjectSchema): void {
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
    
    // Store reference to the object ID for event handling
    (container as any).objectId = objectId;
    
    // Add drag event handlers to the container
    container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => this.startDraggingObject(event, objectId));
    container.on('globalpointermove', (_event: PIXI.FederatedPointerEvent) => this.draggingObject(_event, objectId));
    container.on('pointerup', (_event: PIXI.FederatedPointerEvent) => this.stopDraggingObject(_event, objectId));
    container.on('pointerupoutside', (_event: PIXI.FederatedPointerEvent) => this.stopDraggingObject(_event, objectId));
    
    // Add to stage and store in our map
    this.app.stage.addChild(container);
    this.objects.set(objectId, container);
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
    const container = this.objects.get(objectId);
    if (container) {
      // Get the circle graphics from the container
      const circle = container.children[0] as PIXI.Graphics;
      
      // Visually indicate that the object is being dragged by another player
      // For example, change the border color
      circle.clear();
      
      // Redraw the circle with the specified color and radius
      const objData = this.room.state.objects.get(objectId);
      if (objData) {
        circle.beginFill(objData.color);
        circle.drawCircle(0, 0, objData.radius);
        circle.endFill();
        
        // Add a different colored border to indicate it's being dragged
        circle.lineStyle(3, 0xffff00); // Yellow border when being dragged
        circle.drawCircle(0, 0, objData.radius);
      }
    }
  }

  private handleObjectDragStopped(objectId: string, _playerId: string): void {
    const container = this.objects.get(objectId);
    if (container) {
      // Get the circle graphics from the container
      const circle = container.children[0] as PIXI.Graphics;
      
      // Reset the visual indication that the object is being dragged
      const objData = this.room.state.objects.get(objectId);
      if (objData) {
        circle.clear();
        
        // Redraw the circle with the specified color and radius
        circle.beginFill(objData.color);
        circle.drawCircle(0, 0, objData.radius);
        circle.endFill();
        
        // Add a black border
        circle.lineStyle(2, 0x000000); // Black border
        circle.drawCircle(0, 0, objData.radius);
      }
    }
  }

  private updatePlayerCount(): void {
    const playerCount = this.room ? this.room.state.players.size : 0;
    const playerCountElement = document.getElementById('playerCount');
    if (playerCountElement) {
      playerCountElement.textContent = `${playerCount}/2`;
    }
  }

  private sendMessage(): void {
    const message = this.chatInput.value.trim();
    if (message && this.room) {
      // Send the message to the server
      this.room.send('chatMessage', { message });
      
      // Clear the input field
      this.chatInput.value = '';
    }
  }

  private displayChatMessage(senderName: string, message: string, timestamp: number): void {
    // Create a new message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    
    // Format the message with sender name and timestamp
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `<strong>[${timeString}] ${senderName}:</strong> ${message}`;
    
    // Add to the chat messages container
    this.chatMessagesDiv.appendChild(messageElement);
    
    // Scroll to the bottom of the chat
    this.chatMessagesDiv.scrollTop = this.chatMessagesDiv.scrollHeight;
  }




  private openSidebar(): void {
    this.sidebar.classList.add('active');
  }
  
  

  private closeSidebar(): void {
    this.sidebar.classList.remove('active');
  }



  private openLeftSidebar(): void {
    this.leftSidebar.classList.add('active');
  }

  private closeLeftSidebar(): void {
    this.leftSidebar.classList.remove('active');
  }

  private createCursorSprite(playerId: string, _originalColor: number): PIXI.Sprite {
    // Determine cursor color based on whether player is room creator
    let cursorColor: number;
    if (playerId === this.currentPlayerId) {
      // Use local variable for current player
      cursorColor = this.isRoomCreator ? 0xff0000 : 0x0000ff; // Red for creator, Blue for joiner
    } else {
      // For other players, get the data from the server state
      const playerData = this.room?.state.players.get(playerId);
      cursorColor = playerData?.isRoomCreator ? 0xff0000 : 0x0000ff; // Red for creator, Blue for joiner
    }

    // Create an 8-bit style cursor sprite
    const graphics = new PIXI.Graphics();

    // Draw an 8-bit style hand/cursor
    graphics.rect(-8, -8, 16, 16); // Main body
    graphics.fill({ color: cursorColor });

    // Add details to make it look more like a hand
    graphics.lineStyle(1, 0x000000); // Black outline (width, color)
    graphics.rect(-8, -8, 16, 16);
    graphics.stroke();

    // Add finger-like pixels
    graphics.rect(-6, -10, 4, 4); // Thumb
    graphics.fill({ color: cursorColor });
    graphics.rect(-2, -11, 4, 5); // Index finger
    graphics.fill({ color: cursorColor });
    graphics.rect(2, -10, 4, 4);  // Middle finger
    graphics.fill({ color: cursorColor });

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

    // Update player count when showing game screen
    this.updatePlayerCount();

    // Set up mouse/touch controls
    this.setupMouseControls();
  }

  private setupMouseControls(): void {
    // Handle mouse movement
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (!this.room || !this.currentPlayerId) return;

      // Don't process mouse movement during battle
      if (this.battleRunning) return;

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
      
      // Send cursor position to server with throttling
      if (this.room && (!this.lastCursorUpdate || Date.now() - this.lastCursorUpdate > 50)) {
        this.room.send('updateCursor', { x: pos.x, y: pos.y });
        this.lastCursorUpdate = Date.now();
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
    
    // Clean up other cursor on resize, but not during battle
    if (this.otherCursor && !this.battleRunning) {
      this.app.stage.removeChild(this.otherCursor);
      this.otherCursor = null;
    }
  }

  private updateVirusParameters(playerId: string, params: { [key: string]: number }): void {
    // Update the virus parameters for the specified player
    // For now, we'll just log the update
    console.log(`Virus parameters updated for player ${playerId}:`, params);
    
    // In the future, we could update UI elements to show opponent's parameters
    // or other visual indicators
  }

  private updatePlayerReadyStatus(playerId: string, isReady: boolean): void {
    // Update the ready status for the specified player
    if (playerId === this.currentPlayerId) {
      this.isPlayerReady = isReady;
      // Update UI to reflect ready status
      this.updateReadyButtonDisplay(isReady);
    } else {
      // Update UI for other player's ready status
      console.log(`Player ${playerId} ready status: ${isReady}`);
    }
  }

  private updateReadyButtonDisplay(isReady: boolean): void {
    if (this.readyBtn) {
      this.readyBtn.textContent = isReady ? 'UNREADY' : 'READY';
      this.readyBtn.style.backgroundColor = isReady ? '#00ff00' : '#ff00ff'; // Green if ready, magenta if not
    }
  }

  private startVirusBattle(message: string): void {
    console.log(message);
    
    // Show a message to the players
    this.showMessage('VIRUS BATTLE STARTED!');
    
    // Disable parameter adjustments during battle
    this.disableParameterAdjustments();
    
    // Hide player cursors during battle
    this.hidePlayerCursors();
    
    // Create visualization based on server data
    this.createBattleVisualization();
    
    // Start the battle visualization (will be updated by server ticks)
    this.battleRunning = true;
  }

  private handleVirusTick(_tick: number, message: string): void {
    console.log(`Virus tick: ${message}`);
    
    // Update the battle visualization if battle is running
    if (this.battleRunning) {
      this.updateBattleVisualization();
    }
  }

  private endVirusBattle(message: string): void {
    console.log(message);
    
    // Show a message to the players
    this.showMessage('VIRUS BATTLE ENDED!');
    
    // Stop the battle simulation
    this.battleRunning = false;
    
    // Stop the ticker if it exists
    if (this.battleTicker) {
      this.battleTicker.destroy();
      this.battleTicker = null;
    }
    
    // Clean up visualization
    if (this.battleVisualization) {
      if (this.battleLayer) {
        this.battleLayer.removeChild(this.battleVisualization);
      } else {
        this.app.stage.removeChild(this.battleVisualization);
      }
      this.battleVisualization = null;
    }
    
    // Remove the battle layer
    if (this.battleLayer) {
      this.app.stage.removeChild(this.battleLayer);
      this.battleLayer = null;
    }
    
    // Clear the server battle grid
    this.serverBattleGrid = [];
    
    // Show player cursors again
    this.showPlayerCursors();
    
    // Re-enable parameter adjustments after battle
    this.enableParameterAdjustments();
  }

  private disableParameterAdjustments(): void {
    // Disable clicking on parameter cells
    const paramCells = document.querySelectorAll('.param-cell');
    paramCells.forEach(cell => {
      cell.classList.add('disabled');
      (cell as HTMLElement).style.pointerEvents = 'none';
      (cell as HTMLElement).style.opacity = '0.5';
    });
    
    // Disable the ready button
    this.readyBtn.disabled = true;
  }

  private enableParameterAdjustments(): void {
    // Re-enable clicking on parameter cells
    const paramCells = document.querySelectorAll('.param-cell');
    paramCells.forEach(cell => {
      cell.classList.remove('disabled');
      (cell as HTMLElement).style.pointerEvents = 'auto';
      (cell as HTMLElement).style.opacity = '1';
    });
    
    // Re-enable the ready button
    this.readyBtn.disabled = false;
  }

  private hidePlayerCursors(): void {
    // Hide all player cursors during battle
    for (const [_, cursor] of this.cursors.entries()) {
      cursor.visible = false;
    }
    
    // Hide cursor labels
    for (const [_, label] of this.cursorLabels.entries()) {
      label.visible = false;
    }
  }

  private showPlayerCursors(): void {
    // Show all player cursors after battle
    for (const [_, cursor] of this.cursors.entries()) {
      cursor.visible = true;
    }
    
    // Show cursor labels
    for (const [_, label] of this.cursorLabels.entries()) {
      label.visible = true;
    }
  }

  private randomizeParameters(): void {
    // Reset all parameters to 0
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];

    // Reset all values to 0
    paramNames.forEach(param => {
      this.paramValues[param] = 0;
    });

    // Distribute 12 points randomly
    let pointsToDistribute = 12;
    while (pointsToDistribute > 0) {
      const randomParam = paramNames[Math.floor(Math.random() * paramNames.length)];
      if (this.paramValues[randomParam] < 12) { // Max 12 points per parameter
        this.paramValues[randomParam]++;
        pointsToDistribute--;
        this.updateParameterDisplay(randomParam);
      }
    }

    // Update the points display
    this.totalPoints = 0; // All points have been distributed
    this.updatePointsDisplay();

    // Update the liquid levels in the tubes
    paramNames.forEach(param => {
      this.updateLiquidLevel(param);
    });

    // Send the randomized parameters to the server
    this.sendParameterUpdate();
  }


  private updateLiquidLevel(param: string): void {
    const liquidElement = document.querySelector(`.param-cell[data-param="${param}"] .param-liquid`) as HTMLElement;
    if (liquidElement) {
      // Calculate the percentage based on the current value (max 12)
      const percentage = (this.paramValues[param] / 12) * 100;
      liquidElement.style.height = `${percentage}%`;
    }
  }




  private createBattleVisualization(): void {
    // Remove any existing battle visualization
    if (this.battleVisualization) {
      if (this.battleLayer) {
        this.battleLayer.removeChild(this.battleVisualization);
      } else {
        this.app.stage.removeChild(this.battleVisualization);
      }
    }
    
    // Create a battle layer if it doesn't exist
    if (!this.battleLayer) {
      this.battleLayer = new PIXI.Container();
      // Add battle layer to stage
      this.app.stage.addChild(this.battleLayer);
    }
    
    // Create a new graphics object for the battle visualization
    this.battleVisualization = new PIXI.Graphics();
    
    // Position it to match the battleGrid element in HTML
    // battleGrid in HTML starts at 33% from left and takes 33% width, full height
    const width = 20;
    const height = 32;

    // Calculate cell size to match the battleGrid CSS sizing
    // battleGrid has background-size: calc(100% / 20) calc(100% / 32) for 20x32 grid
    const gridWidth = this.app.screen.width * 0.33; // 33% of screen width
    const gridHeight = this.app.screen.height; // Full height
    // const cellSizeX = gridWidth / width; // Not used in this function
    // const cellSizeY = gridHeight / height; // Not used in this function
    // Use minimum to ensure it fits
    // const cellSize = Math.min(cellSizeX, cellSizeY); // Not used in this function

    // Position to match the battleGrid in HTML (starts at 33% from left, full height)
    this.battleVisualization.x = this.app.screen.width * 0.33; // Start from 33% from left
    this.battleVisualization.y = 0; // Align to top
    
    // Add to the battle layer (not directly to stage to avoid mouse conflicts)
    this.battleLayer.addChild(this.battleVisualization);
    
    // Draw the initial state
    this.updateBattleVisualization();
  }

  private updateBattleVisualization(): void {
    // Use the server-synchronized battle grid if available
    if (!this.battleVisualization) return;
    
    // Clear the previous visualization
    this.battleVisualization.clear();
    
    // Use the server grid if available, otherwise use local simulation
    if (this.serverBattleGrid && this.serverBattleGrid.length > 0) {
      this.renderBattleGrid(this.serverBattleGrid);
    } else if (this.virusBattle) {
      const grid = this.virusBattle.getGrid();
      // Calculate cell size based on available space
      const cellSize = Math.min(15, Math.floor((this.app.screen.width * 0.3) / grid[0].length)); // 30% of screen width
      
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          let color: number;
          
          switch (cell.state) {
            case CellState.EMPTY:
              color = 0x000000; // Black for empty
              break;
            case CellState.VIRUS_A:
              color = 0xff0000; // Red for player A
              break;
            case CellState.VIRUS_B:
              color = 0x0000ff; // Blue for player B
              break;
          }
          
          // Correct order: lineStyle before fill and draw
          this.battleVisualization.lineStyle(0.5, 0x333333); // Thin gray border
          this.battleVisualization.beginFill(color, cell.state === CellState.EMPTY ? 0.3 : 1); // More visible for empty cells
          this.battleVisualization.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
          this.battleVisualization.endFill();
        }
      }
      
      // Add debug info
      const stats = this.virusBattle.getStats();
      console.log(`Rendered grid: A=${stats.aPercent.toFixed(1)}%, B=${stats.bPercent.toFixed(1)}%`);
    }
  }

  private renderBattleGrid(battleGrid: number[]): void {
    if (!this.battleVisualization) return;
    
    // Clear the previous visualization
    this.battleVisualization.clear();
    
    // Grid dimensions (20x32)
    const width = 20;
    const height = 32;
    
    // Calculate cell size to match the battleGrid CSS sizing
    // battleGrid has background-size: calc(100% / 20) calc(100% / 32) for 20x32 grid
    const gridWidth = this.app.screen.width * 0.33; // 33% of screen width
    const gridHeight = this.app.screen.height; // Full height
    const cellSizeX = gridWidth / width;
    const cellSizeY = gridHeight / height;
    // Use minimum to ensure it fits
    const cellSize = Math.min(cellSizeX, cellSizeY);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cellState = battleGrid[idx];
        
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

  private updateBattleVisualizationFromServer(battleGrid: number[]): void {
    // Only update if battle is running
    if (!this.battleRunning) return;
    
    this.serverBattleGrid = [...battleGrid]; // Copy the server grid
    this.renderBattleGrid(this.serverBattleGrid);
  }

  // Remote cursor functionality
  private otherCursor: PIXI.Graphics | null = null;
  private lastCursorUpdate: number | null = null;

  private updateOtherCursor(x: number, y: number): void {
    // Don't update other cursor during battle
    if (this.battleRunning) return;
    
    if (!this.otherCursor) {
      this.otherCursor = new PIXI.Graphics();
      this.otherCursor.beginFill(0xff00ff); // Magenta color
      // Draw a simple arrow shape
      this.otherCursor.moveTo(0, 0);
      this.otherCursor.lineTo(10, 0);
      this.otherCursor.lineTo(5, -10);
      this.otherCursor.closePath();
      this.otherCursor.endFill();
      this.otherCursor.scale.set(1.5); // Slightly larger
      this.app.stage.addChild(this.otherCursor);
    }
    
    this.otherCursor.x = x;
    this.otherCursor.y = y;
  }


  private copyRoomIdToClipboard(): void {
    const roomId = this.currentRoomIdEl.textContent;
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        // Show "Copied" message
        this.showCopiedMessage();
      }).catch(err => {
        console.error('Failed to copy room ID: ', err);
        // Fallback: show message anyway
        this.showCopiedMessage();
      });
    }
  }

  private showCopiedMessage(): void {
    // Create a temporary "Copied" message element
    const copiedMessage = document.createElement('div');
    copiedMessage.className = 'copied-message';
    copiedMessage.textContent = 'COPIED!';
    
    document.body.appendChild(copiedMessage);
    
    // Remove the message after 2 seconds
    setTimeout(() => {
      if (copiedMessage.parentNode) {
        copiedMessage.parentNode.removeChild(copiedMessage);
      }
    }, 2000);
  }
}