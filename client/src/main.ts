import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';

class MainApp {
  private gameEngine: GameEngine;
  private networkManager: NetworkManager;
  private inputManager: InputManager; // eslint-disable-line @typescript-eslint/no-unused-vars
  private uiController: UIController;
  private chatManager: ChatManager;

  constructor() {
    // Инициализация всех модулей
    this.gameEngine = new GameEngine('game-canvas');
    this.networkManager = new NetworkManager(process.env.SERVER_URL || 'ws://localhost:2567');
    this.inputManager = new InputManager();
    this.uiController = new UIController();
    this.chatManager = new ChatManager();

    // Настройка взаимодействия между модулями
    this.setupInteractions();
    
    // Запуск игры
    this.gameEngine.start();
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
    // Обработка создания комнаты
    this.uiController.onCreateRoom = async (roomId) => {
      try {
        // Создаём комнату через NetworkManager
        const createdRoomId = await this.networkManager.createRoom(roomId);
        
        // Показываем ID созданной комнаты
        this.uiController.showCreatedRoomId(createdRoomId);
        
        // Переключаемся в комнату
        this.uiController.setView('room');
        
        // Подключаем чат к комнате
        this.chatManager.attachToRoom(this.networkManager.getCurrentRoom()!);
        
        // Устанавливаем имя игрока (временно фиктивное)
        this.uiController.setPlayerName('Player 1');
        
        // Подписываемся на обновления состояния комнаты
        this.setupRoomStateListener();
      } catch (error) {
        console.error('Failed to create room:', error);
        alert('Failed to create room. Please try again.');
      }
    };

    // Обработка присоединения к комнате
    this.uiController.onJoinRoom = async (roomId) => {
      try {
        // Присоединяемся к комнате
        await this.networkManager.joinRoom(roomId);
        
        // Переключаемся в комнату
        this.uiController.setView('room');
        
        // Подключаем чат к комнате
        this.chatManager.attachToRoom(this.networkManager.getCurrentRoom()!);
        
        // Устанавливаем имя игрока (временно фиктивное)
        this.uiController.setPlayerName('Player 2');
        
        // Подписываемся на обновления состояния комнаты
        this.setupRoomStateListener();
      } catch (error) {
        console.error('Failed to join room:', error);
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
window.addEventListener('load', () => {
  new MainApp();
});