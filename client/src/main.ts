import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { InputManager } from './core/InputManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';
import { MouseFollowerManager } from './features/mouse-follower/MouseFollowerManager';
import { BattleManager } from './features/battle/BattleManager';
import { BattleRenderer } from './features/battle/BattleRenderer';
import { VirusTubeManager } from './features/battle/VirusTubeManager';
import * as PIXI from 'pixi.js';

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
  private battleRenderer: BattleRenderer | null = null;  // Инициализируется позже

  // Sandbox mode
  private sandboxApp: PIXI.Application | null = null;
  private isInSandbox: boolean = false;

  // Метод для обновления прогресса битвы
  private updateBattleProgress!: (grid: number[]) => void;

  constructor() {
    console.log('[DIAGNOSTIC] main.ts started');
    console.log('[DIAGNOSTIC] URL:', window.location.href);
    console.log('[DIAGNOSTIC] referrer:', document.referrer);
    console.log('[MainApp] Constructor started...');
    console.log('[MainApp] === INITIAL STATE: Should be in LOBBY ===');

    try {
      console.log('[MainApp] Creating GameEngine...');
      this.gameEngine = new GameEngine();
      console.log('[MainApp] Creating NetworkManager... (NO room connection yet)');
      this.networkManager = new NetworkManager();
      console.log('[MainApp] Creating InputManager...');
      this.inputManager = new InputManager();
      console.log('[MainApp] Creating UIController... (will set view to lobby)');
      this.uiController = new UIController();
      
      // Проверка: убеждаемся, что мы в лобби после создания UIController
      const landingScreen = document.getElementById('landingScreen');
      const gameScreen = document.getElementById('gameScreen');
      console.log('[MainApp] After UIController creation:');
      console.log('  - landingScreen.style.display:', landingScreen?.style.display);
      console.log('  - gameScreen.style.display:', gameScreen?.style.display);
      console.log('  - landingScreen has hidden class:', landingScreen?.classList.contains('hidden'));
      console.log('  - gameScreen has hidden class:', gameScreen?.classList.contains('hidden'));
      
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

        // BattleRenderer создаётся позже, при старте битвы
        // console.log('[MainApp] Creating BattleRenderer...');
        // this.battleRenderer = new BattleRenderer(this.gameEngine.app!.stage);

        // Подключаем InputManager к MouseFollowerManager
        this.inputManager.onMouseMove = (x, y) => {
          this.mouseFollower.updateLocalPosition(x, y);
        };

        console.log('[MainApp] Mouse follower initialized!');
        this.gameEngine.start();
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
          if (this.gameEngine.app) {
            this.gameEngine.app.renderer.resize(window.innerWidth, window.innerHeight);
          }
          // Update battle renderer if battle is active
          if (this.battleRenderer) {
            this.battleRenderer.onResize();
          }
        });
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

    // Настраиваем Sandbox callbacks
    this.uiController.onEnterSandbox = () => {
      console.log('[MainApp] Entering sandbox mode...');
      this.enterSandboxMode();
    };

    this.uiController.onLeaveSandbox = () => {
      console.log('[MainApp] Leaving sandbox mode...');
      this.leaveSandboxMode();
    };

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

        // Получаем параметры игрока
        const playerParams = this.virusTubeManager.getParamsAsVirusParams();

        // Определяем, какой игрок (Player 1 или Player 2)
        const isPlayer1 = this.uiController.getCurrentView() === 'room';

        // Устанавливаем параметры в BattleManager
        if (isPlayer1) {
          this.battleManager.setParamsA(playerParams);
        } else {
          this.battleManager.setParamsB(playerParams);
        }

        this.networkManager.sendToggleReady(true);
      });
    }

    // Кнопка LEAVE ROOM
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
      leaveRoomBtn.addEventListener('click', () => {
        console.log('[MainApp] Leave Room button clicked');
        
        // Покидаем комнату
        this.networkManager.leaveCurrentRoom();
        
        // Возвращаемся в лобби
        this.uiController.setView('lobby');
        
        // Очищаем mouse follower
        this.mouseFollower.destroy();
        
        // Очищаем чат
        this.chatManager.destroy();
        
        console.log('[MainApp] Left room and returned to lobby');
      });
    }

    // BattleManager callbacks
    this.battleManager.setOnStateChange((state) => {
      console.log('[MainApp] Battle state changed:', state);

      if (state.type === 'running') {
        console.log('[MainApp] Showing battle renderer, battleRenderer exists:', !!this.battleRenderer);
        if (this.battleRenderer) {
          console.log('[MainApp] Calling battleRenderer.show()');
          this.battleRenderer.show();
        } else {
          console.error('[MainApp] battleRenderer is NULL when state=running!');
        }
      } else if (state.type === 'ended') {
        // Определяем победителя по цвету вируса
        const winnerText = state.winner === 'A'
          ? 'RED (Player 1)'
          : state.winner === 'B'
            ? 'BLUE (Player 2)'
            : 'Draw';
        const percent = state.winner !== 'draw'
          ? ((state.winner === 'A' ? state.virusACount : state.virusBCount) /
             (state.virusACount + state.virusBCount) * 100).toFixed(1)
          : '0';
        alert(`Battle ended!\nWinner: ${winnerText}\nTerritory: ${percent}%`);
        if (this.battleRenderer) {
          this.battleRenderer.hide();
        }
      }
    });

    this.battleManager.setOnGridUpdate((grid) => {
      console.log('[MainApp] Grid update received, calling battleRenderer.updateGrid()');
      if (this.battleRenderer) {
        this.battleRenderer.updateGrid(grid);
      }

      // Обновляем прогресс битвы в верхней панели
      this.updateBattleProgress(grid);
    });

    // Обратный отсчёт
    this.battleManager.setOnCountdown((count) => {
      const overlay = document.getElementById('countdownOverlay');
      const countdownText = document.getElementById('countdownText');

      if (!overlay || !countdownText) return;

      if (count > 0) {
        // Показываем цифру
        overlay.style.display = 'flex';
        countdownText.textContent = count.toString();
        
        // Автоматически закрываем все боковые панели
        this.uiController.closeLeftSidebar();
        this.uiController.closeRightSidebar();
      } else if (count === 0) {
        // Показываем "БИТВА!" и запускаем битву автоматически
        countdownText.textContent = 'БИТВА!';
        countdownText.style.color = '#ff00ff';

        // Отправляем серверу сигнал начать битву
        this.networkManager.sendToRoom('startBattleNow', {});

        // Запускаем битву локально
        const gridData = this.battleManager.getGridData();
        if (gridData) {
          this.battleManager.startBattle(gridData.grid, gridData.width, gridData.height);
        }

        // Скрываем overlay через 1.5 секунды
        setTimeout(() => {
          overlay.style.display = 'none';
          countdownText.style.color = '#00ffff';
        }, 1500);
      }
    });

    // Network listeners для битвы
    this.networkManager.onVirusBattleStarted = (data) => {
      console.log('[MainApp] Virus battle started:', data);

      // Создаём BattleRenderer с правильными размерами
      if (!this.battleRenderer && this.gameEngine.app) {
        this.battleRenderer = new BattleRenderer(this.gameEngine.app.stage);
      }

      // Инициализируем сетку
      if (this.battleRenderer) {
        this.battleRenderer.initGrid(data.width, data.height);

        // Устанавливаем параметры вирусов для визуализации защиты
        const paramsA = this.virusTubeManager.getParamsAsVirusParams();
        const paramsB = { defense: 0 };  // Will be updated from network

        this.battleRenderer.setVirusParams(
          { defense: paramsA.defense },
          { defense: paramsB.defense }
        );

        // Подписываем BattleRenderer на ticker для анимации
        this.gameEngine.addTickerUpdate((delta) => {
          this.battleRenderer!.update(delta);
        });
        console.log('[MainApp] BattleRenderer subscribed to ticker');
      }

      // Запускаем обратный отсчёт
      this.battleManager.startCountdownAndBattle(data.vGrid, data.width, data.height);
    };

    this.networkManager.onVirusTick = (tick, data) => {
      this.battleManager.onBattleTick({ vGrid: data.vGrid, tick });
      
      // Update infestation visualization
      if (this.battleRenderer) {
        const infestations = this.battleManager.getInfestations();
        this.battleRenderer.setInfestationData(infestations);
      }
    };

    this.networkManager.onVirusBattleEnded = (data) => {
      console.log('[MainApp] Virus battle ended:', data);
      this.battleManager.onBattleEnded({
        winner: data.winner === 'Player A' ? 'A' : data.winner === 'Player B' ? 'B' : 'draw',
        virusACount: data.virusACount,
        virusBCount: data.virusBCount
      });
    };

    this.networkManager.onStartCountdown = (data) => {
      console.log('[MainApp] Start countdown:', data);

      // Создаём BattleRenderer если ещё не создан
      if (!this.battleRenderer && this.gameEngine.app) {
        this.battleRenderer = new BattleRenderer(this.gameEngine.app.stage);
      }

      // Инициализируем сетку
      if (this.battleRenderer) {
        this.battleRenderer.initGrid(data.width, data.height);

        // Подписываем BattleRenderer на ticker для анимации
        this.gameEngine.addTickerUpdate((delta) => {
          this.battleRenderer!.update(delta);
        });
        console.log('[MainApp] BattleRenderer subscribed to ticker in onStartCountdown');
      }

      // Запускаем обратный отсчёт
      this.battleManager.startCountdownAndBattle(data.vGrid, data.width, data.height);
    };

    // Инициализация метода обновления прогресса
    this.updateBattleProgress = (grid: number[]) => {
      let countA = 0;
      let countB = 0;

      for (const cell of grid) {
        if (cell === 1) countA++;
        else if (cell === 2) countB++;
      }

      const total = countA + countB;
      const percentA = total > 0 ? (countA / total) * 100 : 0;
      const percentB = total > 0 ? (countB / total) * 100 : 0;

      const progressEl = document.getElementById('battleProgress');
      if (progressEl) {
        // Обновляем градиент: красный слева, синий справа
        const redEnd = percentA;
        const blueStart = 100 - percentB;
        
        progressEl.style.background = `linear-gradient(90deg, 
          rgba(255, 0, 0, 0.4) 0%, 
          rgba(255, 0, 0, 0.4) ${redEnd}%, 
          rgba(0, 0, 0, 0.5) ${redEnd}%, 
          rgba(0, 0, 0, 0.5) ${blueStart}%, 
          rgba(0, 0, 255, 0.4) ${blueStart}%, 
          rgba(0, 0, 255, 0.4) 100%)`;
      }
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

  /**
   * Enter sandbox mode - empty canvas for testing
   */
  private async enterSandboxMode(): Promise<void> {
    console.log('[MainApp] Entering sandbox mode...');
    this.isInSandbox = true;

    // Create sandbox PixiJS application
    const container = document.getElementById('sandboxCanvasContainer');
    if (!container) {
      console.error('[MainApp] Sandbox container not found!');
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create new application
    this.sandboxApp = new PIXI.Application();
    await this.sandboxApp.init({
      backgroundColor: 0x1a1a1a,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
    });

    container.appendChild(this.sandboxApp.canvas);
    console.log('[MainApp] Sandbox canvas created');

    // Start the sandbox app ticker
    this.sandboxApp.ticker.start();

    // Create 64x40 battle grid
    this.createBattleGrid(64, 40);
    
    // Setup sandbox menu buttons
    this.setupSandboxMenuButtons();
  }
  
  /**
   * Setup sandbox menu button handlers
   */
  private setupSandboxMenuButtons(): void {
    console.log('[MainApp] Setting up sandbox menu buttons...');
    
    // Right menu button - virus params sidebar
    const sandboxMenuBtn = document.getElementById('sandboxMenuBtn');
    const rightSidebar = document.getElementById('sidebar');
    
    console.log('[MainApp] sandboxMenuBtn:', sandboxMenuBtn);
    console.log('[MainApp] rightSidebar:', rightSidebar);

    if (sandboxMenuBtn && rightSidebar) {
      sandboxMenuBtn.addEventListener('click', () => {
        console.log('[MainApp] Sandbox right menu clicked');
        console.log('[MainApp] rightSidebar classList before:', rightSidebar.classList);
        rightSidebar.classList.toggle('active');
        console.log('[MainApp] rightSidebar classList after:', rightSidebar.classList);
      });
      console.log('[MainApp] Menu button handler attached');
    } else {
      console.error('[MainApp] Missing elements:', { sandboxMenuBtn, rightSidebar });
    }

    // Back to lobby button
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');
    if (backToLobbyBtn) {
      backToLobbyBtn.addEventListener('click', () => {
        console.log('[MainApp] Back to lobby clicked');
        this.leaveSandboxMode();
        this.uiController.setView('lobby');
      });
    }
  }

  /**
   * Create battle grid in sandbox
   */
  private createBattleGrid(width: number, height: number): void {
    if (!this.sandboxApp) return;

    // Calculate cell size to fill the screen
    const cellSize = Math.floor(window.innerWidth / width); // Fit to screen width
    
    const gridGraphics = new PIXI.Graphics();

    // Position grid at EXACT top-left corner (0, 0)
    const offsetX = 0;
    const offsetY = 0;

    const actualGridWidth = width * cellSize;
    const actualGridHeight = height * cellSize;

    console.log(`[MainApp] Creating ${width}x${height} battle grid`);
    console.log(`Cell size: ${cellSize}px`);
    console.log(`Grid size: ${actualGridWidth}x${actualGridHeight}px`);
    console.log(`Screen size: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`Grid starts at: (${offsetX}, ${offsetY})`);

    // Begin the stroke style once for better performance
    gridGraphics.setStrokeStyle({ width: 1, color: 0xff0000, alpha: 1 });
    
    // Draw all cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;

        // Draw rect and stroke it
        gridGraphics.rect(cellX, cellY, cellSize, cellSize);
      }
    }
    
    // Apply the stroke to all paths at once
    gridGraphics.stroke();

    this.sandboxApp.stage.addChild(gridGraphics);
    
    // Add attempt counter text at top center
    const attemptText = new PIXI.Text('ATTEMPT #3 - Grid: 64x40 | Cell: ' + cellSize + 'px | Total: ' + actualGridWidth + 'x' + actualGridHeight + 'px', {
      fontFamily: 'Courier New',
      fontSize: 16,
      fill: 0x00ff00,
      stroke: { color: 0x000000, width: 2 },
    });
    attemptText.anchor.set(0.5, 0);
    attemptText.x = window.innerWidth / 2;
    attemptText.y = 10;
    attemptText.zIndex = 1000;
    this.sandboxApp.stage.addChild(attemptText);
    
    this.sandboxApp.stage.sortableChildren = true;
    gridGraphics.zIndex = 100;
    
    console.log('[MainApp] Battle grid created with stroke applied');
  }

  /**
   * Leave sandbox mode - cleanup and return to lobby
   */
  private leaveSandboxMode(): void {
    console.log('[MainApp] Leaving sandbox mode...');
    this.isInSandbox = false;

    // Destroy sandbox application
    if (this.sandboxApp) {
      this.sandboxApp.ticker.stop();
      this.sandboxApp.destroy(true);
      this.sandboxApp = null;
    }

    // Clear sandbox container
    const container = document.getElementById('sandboxCanvasContainer');
    if (container) {
      container.innerHTML = '';
    }

    console.log('[MainApp] Sandbox cleaned up');
  }
}

// Запуск приложения при загрузке страницы
console.log('[MainApp] Registering load event listener...');

// Обновляем бейдж с версией
function updateVersionBadge() {
  const badge = document.getElementById('versionBadge');
  if (badge) {
    // In dev mode, just show dev version
    badge.textContent = 'v11-dev';
    console.log('[MainApp] Version:', 'v11-dev');
  }
}

window.addEventListener('load', () => {
  console.log('[MainApp] LOAD EVENT FIRED');
  console.log('Creating new MainApp()...');

  // Обновляем версию сразу
  updateVersionBadge();

  new MainApp();
  console.log('MainApp() created!');
});

console.log('[MainApp] Load event listener registered');