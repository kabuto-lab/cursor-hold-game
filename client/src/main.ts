import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';
import { MouseFollowerManager } from './features/mouse-follower/MouseFollowerManager';
import { BattleManager } from './features/battle/BattleManager';
import { BattleRenderer } from './features/battle/BattleRenderer';
import { VirusTubeManager } from './features/battle/VirusTubeManager';

console.log('[MainApp] main.ts loaded');

class MainApp {
  private gameEngine!: GameEngine;
  private networkManager!: NetworkManager;
  private inputManager!: InputManager;
  private uiController!: UIController;
  private chatManager!: ChatManager;
  private mouseFollower!: MouseFollowerManager;
  private virusTubeManager!: VirusTubeManager;
  private battleManager!: BattleManager;
  private battleRenderer!: BattleRenderer;

  constructor() {
    console.log('[DIAGNOSTIC] main.ts started');
    console.log('[DIAGNOSTIC] URL:', window.location.href);
    console.log('[DIAGNOSTIC] referrer:', document.referrer);
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
      console.log('[MainApp] Creating BattleManager...');
      this.battleManager = new BattleManager();

      console.log('[MainApp] Setting up interactions...');
      this.setupInteractions();

      // Инициализация PixiJS (асинхронно) — потом создаём mouse follower
      console.log('[MainApp] Initializing GameEngine...');
      this.gameEngine.init('canvasContainer').then(() => {
        console.log('[MainApp] GameEngine initialized!');

        // Создаём MouseFollowerManager ПОСЛЕ инициализации PixiJS
        console.log('[MainApp] Creating MouseFollowerManager...');
        this.mouseFollower = new MouseFollowerManager(this.gameEngine.app!.stage, this.networkManager);

        // Создаём BattleRenderer ПОСЛЕ инициализации PixiJS
        console.log('[MainApp] Creating BattleRenderer...');
        this.battleRenderer = new BattleRenderer(this.gameEngine.app!.stage);

        // Подключаем InputManager к MouseFollowerManager
        this.inputManager.onMouseMove = (x, y) => {
          this.mouseFollower.updateLocalPosition(x, y);
        };

        console.log('[MainApp] Mouse follower and battle renderer initialized!');
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

    // BattleManager callbacks
    this.battleManager.setOnStateChange((state) => {
      console.log('[MainApp] Battle state changed:', state);
      
      if (state.type === 'running') {
        this.battleRenderer.show();
      } else if (state.type === 'ended') {
        const winnerText = state.winner === 'A' ? 'Player 1' : state.winner === 'B' ? 'Player 2' : 'Draw';
        alert(`Battle ended! Winner: ${winnerText}`);
        this.battleRenderer.hide();
      }
    });

    this.battleManager.setOnGridUpdate((grid) => {
      this.battleRenderer.updateGrid(grid);
    });

    // Network listeners для битвы
    this.networkManager.onVirusBattleStarted = (data) => {
      console.log('[MainApp] Virus battle started:', data);
      this.battleManager.onBattleStarted(data);
    };

    this.networkManager.onVirusTick = (tick, data) => {
      this.battleManager.onBattleTick({ battleGrid: data.battleGrid, tick });
    };

    this.networkManager.onVirusBattleEnded = (data) => {
      console.log('[MainApp] Virus battle ended:', data);
      this.battleManager.onBattleEnded({
        winner: data.winner === 'Player A' ? 'A' : data.winner === 'Player B' ? 'B' : 'draw',
        virusACount: data.virusACount,
        virusBCount: data.virusBCount
      });
    };

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
          // Устанавливаем network listeners для mouse follower
          this.mouseFollower.setupNetworkListeners();
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
          // Устанавливаем network listeners для mouse follower
          this.mouseFollower.setupNetworkListeners();
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