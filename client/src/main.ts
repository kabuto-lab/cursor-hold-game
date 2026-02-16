import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';

// === DEBUG: main.ts загружен ===
console.log('=== MAIN.TS LOADED ===');
console.log('window.addEventListener load registering...');

class MainApp {
  private gameEngine: GameEngine;
  private networkManager: NetworkManager;
  private inputManager: InputManager; // eslint-disable-line @typescript-eslint/no-unused-vars
  private uiController: UIController;
  private chatManager: ChatManager;

  constructor() {
    console.log('[MainApp] Constructor started...');
    // Инициализация всех модулей
    console.log('[MainApp] Creating GameEngine...');
    this.gameEngine = new GameEngine('canvasContainer');
    console.log('[MainApp] Creating NetworkManager...');
    this.networkManager = new NetworkManager();
    console.log('[MainApp] Creating InputManager...');
    this.inputManager = new InputManager();
    console.log('[MainApp] Creating UIController...');
    this.uiController = new UIController();
    console.log('[MainApp] Creating ChatManager...');
    this.chatManager = new ChatManager();

    console.log('[MainApp] Setting up interactions...');
    // Настройка взаимодействия между модулями
    this.setupInteractions();

    console.log('[MainApp] Starting game engine...');
    // Запуск игры
    this.gameEngine.start();
    
    console.log('[MainApp] Constructor finished!');
  }

  /**
   * Получить менеджер ввода
   * Используется для предотвращения ошибки неиспользуемой переменной
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * Настройка взаимодействия между модулями
   */
  private setupInteractions(): void {
    console.log('[MainApp] Setting up interactions...');
    
    // Обработка создания комнаты
    this.uiController.onCreateRoom = async () => {
      console.log('[MainApp] onCreateRoom called! Starting room creation...');
      try {
        console.log('[MainApp] Calling networkManager.createRoom()...');
        const roomId = await this.networkManager.createRoom();
        console.log('[MainApp] Room created with ID:', roomId);

        console.log('[MainApp] Switching to room view...');
        this.uiController.setView('room');

        console.log('[MainApp] Getting current room...');
        const room = this.networkManager.getCurrentRoom();
        if (room) {
          console.log('[MainApp] Attaching chat to room...');
          this.chatManager.attachToRoom(room);
          console.log('[MainApp] Updating room ID display...');
          this.uiController.updateRoomIdFromRoom(room);
        } else {
          console.error('[MainApp] Current room is null after createRoom!');
        }

        console.log('[MainApp] Setting player name...');
        this.uiController.setPlayerName('Player 1');

        console.log('[MainApp] Setting up room state listener...');
        this.setupRoomStateListener();
      } catch (error) {
        console.error('[MainApp] ERROR in onCreateRoom:', error);
        alert('Failed to create room. Please try again.');
      }
    };

    // Обработка присоединения к комнате
    this.uiController.onJoinRoom = async (roomId) => {
      console.log('[MainApp] onJoinRoom called with roomId:', roomId);
      try {
        console.log('[MainApp] Calling networkManager.joinRoom()...');
        await this.networkManager.joinRoom(roomId);
        console.log('[MainApp] Joined room successfully');

        this.uiController.setView('room');

        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
          this.uiController.updateRoomIdFromRoom(room);
        }

        this.uiController.setPlayerName('Player 2');
        this.setupRoomStateListener();
      } catch (error) {
        console.error('[MainApp] ERROR in onJoinRoom:', error);
        alert('Failed to join room. Invalid room ID or connection error.');
      }
    };
  }

  /**
   * Настройка подписки на обновления состояния комнаты
   */
  private setupRoomStateListener(): void {
    // Подписываемся на обновления состояния комнаты
    this.networkManager.onStateChange((state) => {
      // Обновляем счётчик игроков при изменении состояния
      if (state && state.players) {
        this.uiController.updatePlayerCount(state.players.size);
      }
    });

    // Инициализируем счётчик при подключении
    const initialState = this.networkManager.getState();
    if (initialState && initialState.players) {
      this.uiController.updatePlayerCount(initialState.players.size);
    }
  }
}

// Запуск приложения при загрузке страницы
console.log('window.addEventListener("load") registering callback...');
window.addEventListener('load', () => {
  console.log('=== LOAD EVENT FIRED ===');
  console.log('Creating new MainApp()...');
  new MainApp();
  console.log('MainApp() created!');
});
console.log('window.addEventListener("load") callback registered');