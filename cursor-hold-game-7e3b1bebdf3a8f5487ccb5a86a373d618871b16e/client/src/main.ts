import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';
import { MouseFollowerManager } from './features/mouse-follower/MouseFollowerManager';
import { DraggableObject } from './features/draggable/DraggableObject';
import { VirusTubeManager } from './features/battle/VirusTubeManager';

console.log('[MainApp] main.ts loaded');

class MainApp {
  private gameEngine!: GameEngine;
  private networkManager!: NetworkManager;
  private inputManager!: InputManager;
  private uiController!: UIController;
  private chatManager!: ChatManager;
  private mouseFollower!: MouseFollowerManager;
  private draggableObject!: DraggableObject;
  private virusTubeManager!: VirusTubeManager;

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
      console.log('[MainApp] Creating VirusTubeManager...');
      this.virusTubeManager = new VirusTubeManager();

      console.log('[MainApp] Setting up interactions...');
      this.setupInteractions();

      // Инициализация PixiJS (асинхронно) — потом создаём mouse follower
      console.log('[MainApp] Initializing GameEngine...');
      this.gameEngine.init('canvasContainer').then(() => {
        console.log('[MainApp] GameEngine initialized!');

        // Создаём MouseFollowerManager ПОСЛЕ инициализации PixiJS
        console.log('[MainApp] Creating MouseFollowerManager...');
        this.mouseFollower = new MouseFollowerManager(this.gameEngine.app!.stage, this.networkManager);

        // Создаём DraggableObject в центре экрана
        console.log('[MainApp] Creating DraggableObject...');
        this.draggableObject = new DraggableObject(this.gameEngine.app!.stage, this.networkManager);
        this.draggableObject.init(window.innerWidth, window.innerHeight);

        // Подключаем InputManager к MouseFollowerManager
        this.inputManager.onMouseMove = (x, y) => {
          this.mouseFollower.updateLocalPosition(x, y);
        };

        console.log('[MainApp] Mouse follower and draggable object initialized!');
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

    // Настраиваем VirusTubeManager
    this.virusTubeManager.setOnParamsChange((params) => {
      console.log('[MainApp] Virus params changed:', params);
      this.networkManager.sendParameterUpdate(params);
    });

    // Кнопка RANDOMIZE
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        console.log('[MainApp] Randomize button clicked');
        this.virusTubeManager.randomize();
      });
    }

    // Кнопка READY
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
      readyBtn.addEventListener('click', () => {
        console.log('[MainApp] Ready button clicked');
        this.networkManager.sendToggleReady(true);
      });
    }

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
          // Устанавливаем network listeners для mouse follower и draggable object
          this.mouseFollower.setupNetworkListeners();
          this.draggableObject.setupNetworkListeners();
          // Устанавливаем mouse follower для создателя
          this.mouseFollower.onRoomJoined(true, this.networkManager.getSessionId()!);
          
          // Подписываемся на изменение количества игроков
          this.networkManager.onRoomStateChange = (count, max) => {
            this.uiController.updatePlayerCount(count, max);
          };
          // Обновляем счётчик при создании комнаты
          this.uiController.updatePlayerCount(this.networkManager.getPlayerCount(), 2);
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
          // Устанавливаем network listeners для mouse follower и draggable object
          this.mouseFollower.setupNetworkListeners();
          this.draggableObject.setupNetworkListeners();
          // Устанавливаем mouse follower для присоединившегося
          this.mouseFollower.onRoomJoined(false, this.networkManager.getSessionId()!);
          
          // Подписываемся на изменение количества игроков
          this.networkManager.onRoomStateChange = (count, max) => {
            this.uiController.updatePlayerCount(count, max);
          };
          // Обновляем счётчик при присоединении
          this.uiController.updatePlayerCount(this.networkManager.getPlayerCount(), 2);
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