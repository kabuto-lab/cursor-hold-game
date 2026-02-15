/**
 * main.ts
 * Главная точка входа игры - компоновка всех модулей
 */

import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { CursorManager } from './features/cursor/CursorManager';
import { BattleManager } from './features/battle/BattleManager';
import { ChatManager } from './features/chat/ChatManager';

export class GameApp {
  private engine: GameEngine;
  private network: NetworkManager;
  private input: InputManager;
  private cursorManager: CursorManager;
  private battleManager: BattleManager;
  private chatManager: ChatManager;

  constructor() {
    this.engine = new GameEngine();
    this.network = new NetworkManager();
    this.input = new InputManager(this.engine.application);
    this.cursorManager = new CursorManager(this.engine.application);
    this.battleManager = new BattleManager();
    this.chatManager = new ChatManager();
    
    this.setupConnections();
  }

  private setupConnections(): void {
    // Connect network events to other managers
    this.network.setCallbacks({
      onPlayerJoined: (playerId, player) => {
        this.cursorManager.createCursor(playerId, player);
      },
      
      onPlayerLeft: (playerId) => {
        this.cursorManager.removeCursor(playerId);
      },
      
      onPlayerUpdated: (playerId, player) => {
        this.cursorManager.updateCursor(playerId, player.x, player.y);
      },
      
      onCursorUpdate: (playerId, x, y) => {
        this.cursorManager.updateCursor(playerId, x, y);
      },
      
      onVirusBattleStarted: (message) => {
        this.battleManager.startBattle();
      },
      
      onVirusBattleEnded: (message) => {
        const winner = message.includes('A') ? 'A' : message.includes('B') ? 'B' : 'draw';
        this.battleManager.endBattle(winner);
      },
      
      onVirusTick: (tick, message) => {
        // Battle tick handling
      },
      
      onChatMessage: (message) => {
        this.chatManager.addMessage(message);
      }
    });

    // Connect input events to network
    this.input.setCallbacks({
      onMouseMove: (x, y) => {
        // Only send position when in game
        if (this.network.isConnected()) {
          this.network.sendPosition(x, y);
        }
      }
    });
  }

  async init(): Promise<void> {
    await this.engine.init();
    
    // Add to DOM
    const container = document.getElementById('canvasContainer');
    if (container && this.engine.application.canvas) {
      container.appendChild(this.engine.application.canvas);
    }

    // Set up window resize handler
    window.addEventListener('resize', () => {
      this.engine.resize(window.innerWidth, window.innerHeight);
    });

    // Start the engine
    this.engine.start();
  }

  destroy(): void {
    this.engine.destroy();
    this.network.leaveRoom();
    this.input.destroy();
    this.cursorManager.destroy();
    this.battleManager.destroy();
  }
}

// Initialize the game when the page loads
window.addEventListener('load', async () => {
  const game = new GameApp();
  try {
    await game.init();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});