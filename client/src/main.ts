/**
 * main.ts - entry point with composition
 */

import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './features/chat/ChatManager';

class Application {
  private gameEngine: GameEngine;
  private networkManager: NetworkManager;
  private uiController: UIController;
  private chatManager: ChatManager;

  constructor() {
    // Initialize core components
    this.gameEngine = new GameEngine();
    this.networkManager = new NetworkManager();
    this.uiController = new UIController();
    this.chatManager = new ChatManager();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Network events
    this.networkManager.setCallbacks({
      onPlayerJoined: (playerId, player) => {
        console.log(`Player joined: ${playerId}`, player);
        this.updatePlayerCount();
      },
      onPlayerLeft: (playerId) => {
        console.log(`Player left: ${playerId}`);
        this.updatePlayerCount();
      },
      onPlayerUpdated: (playerId, player) => {
        console.log(`Player updated: ${playerId}`, player);
      },
      onChatMessage: (message) => {
        this.uiController.addChatMessage(message);
      },
      onError: (error) => {
        console.error('Network error:', error);
      },
      onDisconnected: () => {
        console.log('Disconnected from server');
        this.uiController.showLandingScreen();
      }
    });

    // Chat events
    this.chatManager.setCallbacks({
      onMessageReceived: (message) => {
        this.uiController.addChatMessage(`${message.playerName}: ${message.message}`);
      },
      onMessageSent: (message) => {
        console.log('Message sent:', message);
      }
    });

    // UI events - these would need to be connected differently in a real implementation
    // For now, we'll add event listeners directly to the DOM elements
    const createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    const leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement;
    const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const chatSendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;

    if (createRoomBtn) {
      createRoomBtn.onclick = () => this.handleCreateRoom();
    }

    if (joinRoomBtn) {
      joinRoomBtn.onclick = () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
          this.handleJoinRoom(roomId);
        }
      };
    }

    if (leaveRoomBtn) {
      leaveRoomBtn.onclick = () => this.handleLeaveRoom();
    }

    if (chatSendBtn) {
      chatSendBtn.onclick = () => {
        const message = chatInput.value.trim();
        if (message) {
          this.handleSendMessage(message);
          chatInput.value = '';
        }
      };
    }

    if (chatInput) {
      chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          const message = chatInput.value.trim();
          if (message) {
            this.handleSendMessage(message);
            chatInput.value = '';
          }
        }
      };
    }
  }

  private async handleCreateRoom(): Promise<void> {
    try {
      const roomId = await this.networkManager.createRoom();
      this.uiController.updateRoomInfo(roomId);
      this.uiController.showGameScreen();
      this.uiController.updatePlayerCount(1);
      
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
      const count = this.networkManager.getPlayerCount();
      this.uiController.updatePlayerCount(count);
      
      console.log(`Joined room: ${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  private async handleLeaveRoom(): Promise<void> {
    try {
      this.networkManager.leaveRoom();
      this.uiController.showLandingScreen();
      this.uiController.clearRoomInfo();
      
      console.log('Left room');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  private handleSendMessage(message: string): void {
    this.networkManager.sendChatMessage(message);
    // Also add to local chat display
    this.uiController.addChatMessage(`You: ${message}`);
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
    this.networkManager.leaveRoom();
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