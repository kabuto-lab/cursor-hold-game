/**
 * main.ts
 * Entry point for the application
 * Orchestrates all components using composition
 */

import { GameEngine } from './core/GameEngine';
import { InputManager } from './core/InputManager';
import { NetworkManager } from './core/NetworkManager';
import { UIController } from './ui/UIController';
import { CursorManager, CursorData } from './features/cursor/CursorManager';
import { CursorRenderer } from './features/cursor/CursorRenderer';
import { BattleManager } from './features/battle/BattleManager';
import { BattleRenderer } from './features/battle/BattleRenderer';
import { VirusParamsUI } from './features/battle/VirusParamsUI';
import { ChatManager } from './features/chat/ChatManager';

class Application {
  private gameEngine: GameEngine;
  private inputManager: InputManager;
  private networkManager: NetworkManager;
  private uiController: UIController;
  private cursorManager: CursorManager;
  private cursorRenderer: CursorRenderer;
  private battleManager: BattleManager;
  private battleRenderer: BattleRenderer;
  private virusParamsUI: VirusParamsUI;
  private chatManager: ChatManager;

  constructor() {
    // Initialize core components
    this.gameEngine = new GameEngine();
    this.inputManager = new InputManager(window);
    this.networkManager = new NetworkManager();

    // Initialize UI controller
    this.uiController = new UIController({
      onCreateRoom: () => this.handleCreateRoom(),
      onJoinRoom: (roomId) => this.handleJoinRoom(roomId),
      onLeaveRoom: () => this.handleLeaveRoom()
    });

    // Initialize cursor components
    this.cursorManager = new CursorManager();
    this.cursorRenderer = new CursorRenderer(this.gameEngine.application);

    // Initialize battle components
    this.battleManager = new BattleManager();
    this.battleRenderer = new BattleRenderer(this.gameEngine.application);

    // Initialize virus params UI
    this.virusParamsUI = new VirusParamsUI('virusParamsContainer', {
      onReady: (params) => {
        // Send params to server when ready
        this.networkManager.updateVirusParams(params);
        // Tell server we're ready
        this.networkManager.setPlayerReady(true);
      }
    });

    // Initialize chat manager
    this.chatManager = new ChatManager('chat-messages', 'chat-input', 'chat-send-btn');

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Network events
    this.networkManager.setCallbacks({
      onPlayerJoined: (playerId, player) => {
        this.cursorManager.addOrUpdateCursor(player);
        this.updatePlayerCount();
      },
      onPlayerLeft: (playerId) => {
        this.cursorManager.removeCursor(playerId);
        this.updatePlayerCount();
      },
      onPlayerUpdated: (playerId, player) => {
        this.cursorManager.addOrUpdateCursor(player);
      },
      onVirusParamsUpdated: (playerId, params) => {
        // Handle virus params update from other players
        console.log(`Virus params updated for player ${playerId}:`, params);
      },
      onVirusBattleStarted: (message) => {
        console.log('Virus battle started:', message);
        this.battleManager.startBattle();
      },
      onVirusBattleEnded: (message) => {
        console.log('Virus battle ended:', message);
        const winner = message.includes('A') ? 'A' : message.includes('B') ? 'B' : 'draw';
        this.battleManager.endBattle(winner);
      },
      onVirusTick: (tick, message) => {
        console.log(`Virus tick ${tick}:`, message);
        // Update battle visualization
      },
      onCursorUpdate: (playerId, x, y) => {
        this.cursorManager.updateCursorPosition(playerId, x, y);
      },
      onChatMessage: (message) => {
        this.chatManager.addMessage(message);
      },
      onError: (error) => {
        console.error('Network error:', error);
      },
      onDisconnected: () => {
        console.log('Disconnected from server');
        this.uiController.showLandingScreen();
      }
    });

    // Cursor events
    this.cursorManager.setEvents({
      onCursorAdded: (cursor) => {
        this.cursorRenderer.updateAllCursors(this.cursorManager.getAllCursors());
      },
      onCursorUpdated: (cursor) => {
        this.cursorRenderer.updateAllCursors(this.cursorManager.getAllCursors());
      },
      onCursorRemoved: (cursorId) => {
        this.cursorRenderer.updateAllCursors(this.cursorManager.getAllCursors());
      }
    });

    // Battle events
    this.battleManager.setEvents({
      onStateChanged: (newState) => {
        this.battleRenderer.update(newState);
        
        // Update UI based on battle state
        switch (newState.type) {
          case 'idle':
            this.virusParamsUI.setVisible(true);
            break;
          case 'preparing':
            this.virusParamsUI.setVisible(true);
            break;
          case 'running':
            this.virusParamsUI.setVisible(false);
            break;
          case 'ended':
            this.virusParamsUI.setVisible(false);
            break;
        }
      }
    });

    // Input events
    this.inputManager.setCallbacks({
      onMouseMove: (x, y) => {
        // Send cursor position to server
        this.networkManager.updatePosition(x, y);
      },
      onClick: (x, y) => {
        // Handle click events
        console.log(`Click at (${x}, ${y})`);
      }
    });
  }

  private async handleCreateRoom(): Promise<void> {
    try {
      const roomId = await this.networkManager.createRoom();
      this.uiController.updateRoomInfo(roomId);
      this.uiController.showGameScreen();
      this.uiController.updatePlayerCount(1);
      
      // Enable input and start game loop
      this.inputManager.initialize();
      this.gameEngine.start();
      
      console.log(`Created room: ${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  }

  private async handleJoinRoom(roomId: string): Promise<void> {
    try {
      await this.networkManager.connectToRoom(roomId);
      this.uiController.updateRoomInfo(roomId);
      this.uiController.showGameScreen();
      
      // Get initial player count
      const playerCount = this.networkManager.getPlayerCount();
      this.uiController.updatePlayerCount(playerCount);
      
      // Enable input and start game loop
      this.inputManager.initialize();
      this.gameEngine.start();
      
      console.log(`Joined room: ${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  private async handleLeaveRoom(): Promise<void> {
    try {
      await this.networkManager.leaveRoom();
      this.uiController.showLandingScreen();
      this.uiController.clearRoomInfo();
      
      // Reset game state
      this.cursorManager.destroy();
      this.cursorRenderer.destroy();
      this.battleManager.destroy();
      this.battleRenderer.destroy();
      this.virusParamsUI.destroy();
      
      // Stop input and game loop
      this.inputManager.destroy();
      this.gameEngine.stop();
      
      console.log('Left room');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  private updatePlayerCount(): void {
    const count = this.networkManager.getPlayerCount();
    this.uiController.updatePlayerCount(count);
  }

  async init(): Promise<void> {
    // Wait for DOM to be loaded
    if (document.readyState === 'loading') {
      await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
    }

    console.log('Application initialized');
  }

  destroy(): void {
    // Clean up all components
    this.gameEngine.destroy();
    this.inputManager.destroy();
    this.networkManager.destroy();
    this.uiController.destroy();
    this.cursorManager.destroy();
    this.cursorRenderer.destroy();
    this.battleManager.destroy();
    this.battleRenderer.destroy();
    this.virusParamsUI.destroy();
    this.chatManager.destroy();
  }
}

// Initialize the application when the page loads
let app: Application;

window.addEventListener('load', async () => {
  try {
    app = new Application();
    await app.init();
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});