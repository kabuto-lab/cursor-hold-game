import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';
import { CursorManager } from './features/cursor/CursorManager';
import { CursorRenderer } from './features/cursor/CursorRenderer';
import { CursorDebugUI } from './features/cursor/CursorDebugUI';

console.log('[MainApp] main.ts loaded');

class MainApp {
  private gameEngine!: GameEngine;
  private networkManager!: NetworkManager;
  private inputManager!: InputManager;
  private uiController!: UIController;
  private chatManager!: ChatManager;
  private cursorManager!: CursorManager;
  private cursorDebugUI!: CursorDebugUI;

  constructor() {
    console.log('[MainApp] Constructor started...');

    try {
      console.log('[MainApp] Creating GameEngine...');
      this.gameEngine = new GameEngine();
      console.log('[MainApp] Creating NetworkManager...');
      this.networkManager = new NetworkManager();
      console.log('[MainApp] Creating InputManager...');
      this.inputManager = new InputManager();
      console.log('[MainApp] Creating UIController...');
      this.uiController = new UIController();
      console.log('[MainApp] Creating ChatManager...');
      this.chatManager = new ChatManager();

      console.log('[MainApp] Setting up interactions...');
      this.setupInteractions();

      // Инициализация PixiJS (асинхронно) — потом создаём курсоры
      console.log('[MainApp] Initializing GameEngine...');
      this.gameEngine.init('canvasContainer').then(() => {
        console.log('[MainApp] GameEngine initialized!');
        
        // Создаём CursorManager и CursorRenderer ПОСЛЕ инициализации PixiJS
        console.log('[MainApp] Creating CursorManager...');
        this.cursorManager = new CursorManager(this.inputManager, this.networkManager);
        console.log('[MainApp] Creating CursorRenderer...');
        new CursorRenderer(this.gameEngine.app!.stage, this.cursorManager);
        console.log('[MainApp] Creating CursorDebugUI...');
        this.cursorDebugUI = new CursorDebugUI();

        // Подключаем UI к CursorManager
        this.cursorManager.onLocalCursorUpdate = (x, y) => {
          this.cursorDebugUI.updatePlayer1(x, y);
        };

        // Для обновления координат второго игрока
        this.cursorManager.onRemoteCursorUpdate = (_playerId, x, y) => {
          this.cursorDebugUI.updatePlayer2(x, y);
        };
        
        console.log('[MainApp] Cursor system initialized!');
        this.gameEngine.start();
      }).catch((error) => {
        console.error('[MainApp] GameEngine init ERROR:', error);
      });

      console.log('[MainApp] Constructor finished!');
    } catch (error) {
      console.error('[MainApp] Constructor ERROR:', error);
    }
  }

  private setupInteractions(): void {
    console.log('[MainApp] Setting up interactions...');
    
    this.uiController.onCreateRoom = async () => {
      console.log('[MainApp] onCreateRoom called!');
      try {
        console.log('[MainApp] Calling networkManager.createRoom()...');
        const roomId = await this.networkManager.createRoom();
        console.log('[MainApp] Room created with ID:', roomId);

        // Ждём следующего тика, чтобы DOM был готов
        await new Promise(resolve => setTimeout(resolve, 0));

        console.log('[MainApp] Calling setView(room)...');
        this.uiController.setView('room');
        console.log('[MainApp] setView(room) completed');

        // Показываем ID комнаты сразу
        this.uiController.showCreatedRoomId(roomId);

        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
        }
        this.uiController.setPlayerName('Player 1');
      } catch (error) {
        console.error('[MainApp] ERROR in onCreateRoom:', error);
        alert('Create room ERROR: ' + error);
      }
    };

    this.uiController.onJoinRoom = async (roomId) => {
      console.log('[MainApp] onJoinRoom called with roomId:', roomId);
      try {
        await this.networkManager.joinRoom(roomId);
        console.log('[MainApp] Joined room successfully');

        // Ждём следующего тика, чтобы DOM был готов
        await new Promise(resolve => setTimeout(resolve, 0));

        console.log('[MainApp] Calling setView(room)...');
        this.uiController.setView('room');
        console.log('[MainApp] setView(room) completed');

        // Показываем ID комнаты сразу
        this.uiController.showCreatedRoomId(roomId);

        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
        }
        this.uiController.setPlayerName('Player 2');
      } catch (error) {
        console.error('[MainApp] ERROR in onJoinRoom:', error);
        alert('Join room ERROR: ' + error);
      }
    };
  }
}

// Запуск приложения при загрузке страницы
console.log('[MainApp] Registering load event listener...');

window.addEventListener('load', () => {
  console.log('[MainApp] LOAD EVENT FIRED');
  console.log('Creating new MainApp()...');
  new MainApp();
  console.log('MainApp() created!');
});

console.log('[MainApp] Load event listener registered');