/**
 * Основной класс игры Digital Hand Holding
 * Теперь использует архитектуру с разделением ответственности
 */

import { GameStateManager } from './GameStateManager';
import { NetworkManager } from './NetworkManager';
import { GameRenderer } from './GameRenderer';
import { UIController } from './UIController';

export class Game {
  private gameStateManager: GameStateManager;
  private networkManager: NetworkManager;
  private renderer: GameRenderer;
  private uiController: UIController;

  constructor() {
    this.gameStateManager = new GameStateManager();
    this.networkManager = new NetworkManager(this.gameStateManager);
    this.renderer = new GameRenderer(this.gameStateManager);
    this.uiController = new UIController(this.gameStateManager);
    
    // Set up callbacks for UI controller
    this.setupUICallbacks();
  }

  private setupUICallbacks(): void {
    this.uiController.onCreateRoom = () => this.createRoom();
    this.uiController.onJoinRoom = (roomId) => this.joinRoom(roomId);
    this.uiController.onLeaveRoom = () => this.leaveRoom();
    this.uiController.onSendMessage = (message) => this.sendMessage(message);
    this.uiController.onIncreaseParameter = (param) => this.increaseParameter(param);
    this.uiController.onDecreaseParameter = (param) => this.decreaseParameter(param);
    this.uiController.onToggleReady = (isReady) => this.toggleReady(isReady);
  }

  async init(): Promise<void> {
    // Initialize renderer
    await this.renderer.init();
    
    // Add renderer to DOM
    const container = document.getElementById('canvasContainer');
    if (container && this.renderer.canvas) {
      container.appendChild(this.renderer.canvas);
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start the game loop
    this.startGameLoop();
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.renderer.onResize();
    });
  }

  private startGameLoop(): void {
    // Start the main game loop
    const gameLoop = () => {
      // Update renderer
      this.renderer.render();
      
      // Continue the loop
      requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  }

  private async createRoom(): Promise<void> {
    try {
      const roomId = await this.networkManager.createRoom();
      this.uiController.updateCurrentRoomId(roomId);
      this.uiController.showGameScreen();
      this.renderer.onResize();
    } catch (error) {
      console.error('Failed to create room:', error);
      this.uiController.showError('Failed to create room. Please try again.');
    }
  }

  private async joinRoom(roomId: string): Promise<void> {
    try {
      await this.networkManager.connectToRoom(roomId);
      this.uiController.showGameScreen();
      this.renderer.onResize();
    } catch (error) {
      console.error('Failed to join room:', error);
      this.uiController.showError('Failed to join room. Invalid room ID or room is full.');
    }
  }

  private async leaveRoom(): Promise<void> {
    this.networkManager.leaveRoom();
    this.uiController.showLandingScreen();
    this.uiController.clearInputs();
    this.uiController.clearChat();
  }

  private sendMessage(message: string): void {
    this.networkManager.sendChatMessage(message);
  }

  private increaseParameter(param: string): void {
    if (this.gameStateManager.increaseParameter(param)) {
      this.uiController.updatePointsDisplay(this.gameStateManager.totalPoints);
      this.uiController.updateParamDisplay(param, this.gameStateManager.getParamValue(param));
      this.networkManager.sendParameterUpdate(this.gameStateManager.paramValues);
    }
  }

  private decreaseParameter(param: string): void {
    if (this.gameStateManager.decreaseParameter(param)) {
      this.uiController.updatePointsDisplay(this.gameStateManager.totalPoints);
      this.uiController.updateParamDisplay(param, this.gameStateManager.getParamValue(param));
      this.networkManager.sendParameterUpdate(this.gameStateManager.paramValues);
    }
  }

  private toggleReady(isReady: boolean): void {
    this.gameStateManager.setPlayerReady(isReady);
    this.networkManager.sendToggleReady(isReady);
    this.uiController.updateReadyButton(isReady);
  }

  public onResize(): void {
    this.renderer.onResize();
  }

  public destroy(): void {
    // Clean up resources
    this.renderer.destroy();
    
    // Remove event listeners
    window.removeEventListener('resize', () => {
      this.renderer.onResize();
    });
  }
}