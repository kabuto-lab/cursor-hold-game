/**
 * Контроллер пользовательского интерфейса
 * Управляет переключением между lobby ↔ room ↔ sandbox и боковыми панелями
 */
export class UIController {
  private lobbyContainer: HTMLElement;
  private roomContainer: HTMLElement;
  private sandboxContainer: HTMLElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private sandboxBtn: HTMLButtonElement;
  private backToLobbyBtn: HTMLButtonElement;
  private roomIdInput: HTMLInputElement;
  private currentView: 'lobby' | 'room' | 'sandbox' = 'lobby'; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Callbacks for sandbox
  onEnterSandbox?: () => void;
  onLeaveSandbox?: () => void;

  // Элементы для боковых панелей
  private leftMenuBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;
  private leftSidebar: HTMLElement;
  private rightSidebar: HTMLElement;
  private closeLeftSidebarBtn: HTMLButtonElement;
  private closeSidebarBtn: HTMLButtonElement;

  constructor() {
    console.log('[UIController] Constructor started');
    console.log('[UIController] document.readyState:', document.readyState);

    // Основные элементы
    this.lobbyContainer = document.getElementById('landingScreen')!;
    this.roomContainer = document.getElementById('gameScreen')!;
    this.sandboxContainer = document.getElementById('sandboxScreen')!;
    this.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.sandboxBtn = document.getElementById('sandboxBtn') as HTMLButtonElement;
    this.backToLobbyBtn = document.getElementById('backToLobbyBtn') as HTMLButtonElement;
    this.roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;

    console.log('[UIController] Elements found:', {
      lobby: !!this.lobbyContainer,
      room: !!this.roomContainer,
      sandbox: !!this.sandboxContainer,
      createBtn: !!this.createRoomBtn,
      joinBtn: !!this.joinRoomBtn,
      sandboxBtn: !!this.sandboxBtn,
      backToLobbyBtn: !!this.backToLobbyBtn,
      roomIdInput: !!this.roomIdInput
    });

    // Элементы боковых панелей
    this.leftMenuBtn = document.getElementById('leftMenuBtn') as HTMLButtonElement;
    this.menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;
    this.leftSidebar = document.getElementById('leftSidebar')!;
    this.rightSidebar = document.getElementById('sidebar')!;
    this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn') as HTMLButtonElement;
    this.closeSidebarBtn = document.getElementById('closeSidebarBtn') as HTMLButtonElement;

    console.log('[UIController] Constructor started');
    console.log('[UIController] Initial state before setView:');
    console.log('  - landingScreen display:', this.lobbyContainer.style.display);
    console.log('  - gameScreen display:', this.roomContainer.style.display);
    console.log('  - sandboxScreen display:', this.sandboxContainer.style.display);
    console.log('  - landingScreen hidden class:', this.lobbyContainer.classList.contains('hidden'));
    console.log('  - gameScreen hidden class:', this.roomContainer.classList.contains('hidden'));
    console.log('  - sandboxScreen hidden class:', this.sandboxContainer.classList.contains('hidden'));

    this.setupEventListeners();

    // Устанавливаем lobby view явно
    console.log('[UIController] Calling setView(lobby)...');
    this.setView('lobby');
    console.log('[UIController] Constructor finished');
  }

  /**
   * Установить обработчики событий
   */
  private setupEventListeners(): void {
    // Обработчики для lobby/room
    this.createRoomBtn?.addEventListener('click', () => {
      this.onCreateRoomClick();
    });

    this.joinRoomBtn?.addEventListener('click', () => {
      this.onJoinRoomClick();
    });

    // Обработчик для Sandbox кнопки
    this.sandboxBtn?.addEventListener('click', () => {
      this.onSandboxClick();
    });

    // Обработчик для возврата из sandbox
    this.backToLobbyBtn?.addEventListener('click', () => {
      this.onBackToLobbyClick();
    });

    // Обработка Enter в поле ввода ID комнаты
    this.roomIdInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.onJoinRoomClick();
      }
    });

    // Обработчики для боковых панелей
    this.leftMenuBtn?.addEventListener('click', () => {
      this.toggleLeftSidebar();
    });

    this.menuBtn?.addEventListener('click', () => {
      this.toggleRightSidebar();
    });

    this.closeLeftSidebarBtn?.addEventListener('click', () => {
      this.closeLeftSidebar();
    });

    this.closeSidebarBtn?.addEventListener('click', () => {
      this.closeRightSidebar();
    });
  }

  /**
   * Обработчик клика на "Create Room"
   */
  private onCreateRoomClick(): void {
    console.log('========================================');
    console.log('[UIController] ⚠️ CREATE ROOM BUTTON CLICKED!');
    console.log('Stack trace:');
    console.log(new Error().stack);
    console.log('========================================');
    
    console.log('[UIController] Create Room button clicked!');
    console.log('[UIController] onCreateRoom callback exists:', !!this.onCreateRoom);
    
    // Вызываем callback для создания комнаты (без параметров)
    if (this.onCreateRoom) {
      console.log('[UIController] Calling onCreateRoom callback...');
      this.onCreateRoom();
    } else {
      console.error('[UIController] onCreateRoom callback is NOT set!');
    }
  }

  /**
   * Обработчик клика на "Join Room"
   */
  private onJoinRoomClick(): void {
    const roomId = this.roomIdInput?.value.trim();
    if (!roomId) {
      alert('Please enter a room ID');
      return;
    }

    // Вызываем callback для присоединения к комнате
    if (this.onJoinRoom) {
      this.onJoinRoom(roomId);
    }
  }

  /**
   * Обработчик клика на "Sandbox"
   */
  private onSandboxClick(): void {
    console.log('[UIController] Sandbox button clicked!');
    
    // Вызываем callback для входа в sandbox
    if (this.onEnterSandbox) {
      this.onEnterSandbox();
    }
    
    // Переключаем вид на sandbox
    this.setView('sandbox');
  }

  /**
   * Обработчик клика на "Back to Lobby"
   */
  private onBackToLobbyClick(): void {
    console.log('[UIController] Back to Lobby button clicked!');
    
    // Вызываем callback для выхода из sandbox
    if (this.onLeaveSandbox) {
      this.onLeaveSandbox();
    }
    
    // Переключаем вид на lobby
    this.setView('lobby');
  }

  /**
   * Установить текущее представление
   */
  setView(view: 'lobby' | 'room' | 'sandbox'): void {
    console.log('[UIController] setView called with:', view);
    console.trace('[UIController] setView stack trace');
    this.currentView = view;

    if (view === 'lobby') {
      console.log('[UIController] Showing landing screen, hiding game screen and sandbox');
      this.lobbyContainer.style.display = 'flex';
      this.roomContainer.style.display = 'none';
      this.sandboxContainer.style.display = 'none';
      this.lobbyContainer.classList.remove('hidden');
      this.roomContainer.classList.add('hidden');
      this.sandboxContainer.classList.add('hidden');

      // Проверка после установки
      console.log('[UIController] After setView(lobby):');
      console.log('  - landingScreen.style.display:', this.lobbyContainer.style.display);
      console.log('  - gameScreen.style.display:', this.roomContainer.style.display);
      console.log('  - sandboxScreen.style.display:', this.sandboxContainer.style.display);
    } else if (view === 'room') {
      console.log('[UIController] Showing game screen, hiding landing screen and sandbox');
      this.lobbyContainer.style.display = 'none';
      this.roomContainer.style.display = 'flex';
      this.sandboxContainer.style.display = 'none';
      this.lobbyContainer.classList.add('hidden');
      this.roomContainer.classList.remove('hidden');
      this.sandboxContainer.classList.add('hidden');

      // Проверка после установки
      console.log('[UIController] After setView(room):');
      console.log('  - landingScreen.style.display:', this.lobbyContainer.style.display);
      console.log('  - gameScreen.style.display:', this.roomContainer.style.display);
      console.log('  - sandboxScreen.style.display:', this.sandboxContainer.style.display);
    } else if (view === 'sandbox') {
      console.log('[UIController] Showing sandbox screen, hiding landing and game screens');
      this.lobbyContainer.style.display = 'none';
      this.roomContainer.style.display = 'none';
      this.sandboxContainer.style.display = 'flex';
      this.lobbyContainer.classList.add('hidden');
      this.roomContainer.classList.add('hidden');
      this.sandboxContainer.classList.remove('hidden');

      // Проверка после установки
      console.log('[UIController] After setView(sandbox):');
      console.log('  - landingScreen.style.display:', this.lobbyContainer.style.display);
      console.log('  - gameScreen.style.display:', this.roomContainer.style.display);
      console.log('  - sandboxScreen.style.display:', this.sandboxContainer.style.display);
    }
  }

  /**
   * Показать ID созданной комнаты
   */
  showCreatedRoomId(roomId: string): void {
    // Обновляем отображение ID комнаты в верхней панели
    const topRoomIdElement = document.getElementById('topRoomId');
    if (topRoomIdElement) {
      topRoomIdElement.textContent = `ID: ${roomId}`;

      // Добавляем возможность копирования на весь панель
      const topRoomIdPanel = document.getElementById('topRoomIdPanel');
      if (topRoomIdPanel) {
        topRoomIdPanel.onclick = () => {
          navigator.clipboard.writeText(roomId).then(() => {
            // Показываем сообщение о копировании
            this.showCopiedMessage();
          });
        };
      }
    }
  }

  /**
   * Обновить ID комнаты из текущей комнаты
   */
  updateRoomIdFromRoom(room: any): void {
    const roomId = room?.customRoomId || room?.state?.roomId || 'Unknown';
    this.showCreatedRoomId(roomId);
  }

  /**
   * Установить имя игрока
   */
  setPlayerName(name: string): void {
    // Определяем, какой игрок (Player 1 или Player 2)
    if (name === 'Player 1') {
      const player1Element = document.getElementById('player1Name');
      if (player1Element) {
        player1Element.textContent = name;
        console.log('[UIController] Set Player 1 name:', name);
      }
    } else if (name === 'Player 2') {
      const player2Element = document.getElementById('player2Name');
      if (player2Element) {
        player2Element.textContent = name;
        console.log('[UIController] Set Player 2 name:', name);
      }
    }
  }

  /**
   * Обновить имя конкретного игрока
   */
  updatePlayerNameDisplay(playerNum: 1 | 2, name: string): void {
    const elementId = playerNum === 1 ? 'player1Name' : 'player2Name';
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = name;
    }
  }

  /**
   * Обновить отображение имени игрока (из сетевого события)
   */
  updatePlayerNameFromNetwork(playerId: string, name: string): void {
    // Можно использовать в будущем для синхронизации имён от сервера
    console.log('[UIController] Update player name from network:', playerId, name);
  }

  /**
   * Обновить счётчик игроков
   */
  updatePlayerCount(count: number, maxPlayers: number = 2): void {
    // Обновляем в верхней панели
    const playerCountTopElement = document.getElementById('playerCountTop');
    if (playerCountTopElement) {
      playerCountTopElement.textContent = `${count}`;
    }

    // Обновляем в левом сайдбаре (если есть)
    const playerCountElement = document.getElementById('playerCount');
    if (playerCountElement) {
      playerCountElement.textContent = `${count}/${maxPlayers}`;
    }
  }

  /**
   * Показать сообщение о копировании
   */
  private showCopiedMessage(): void {
    // Создаем элемент сообщения
    const message = document.createElement('div');
    message.className = 'copied-message';
    message.textContent = 'Copied to clipboard!';
    
    document.body.appendChild(message);
    
    // Удаляем сообщение через 2 секунды
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  }

  /**
   * Переключить левую боковую панель
   */
  toggleLeftSidebar(): void {
    this.leftSidebar.classList.toggle('active');
  }

  /**
   * Открыть левую боковую панель
   */
  openLeftSidebar(): void {
    this.leftSidebar.classList.add('active');
  }

  /**
   * Закрыть левую боковую панель
   */
  closeLeftSidebar(): void {
    this.leftSidebar.classList.remove('active');
  }

  /**
   * Переключить правую боковую панель
   */
  toggleRightSidebar(): void {
    this.rightSidebar.classList.toggle('active');
  }

  /**
   * Открыть правую боковую панель
   */
  openRightSidebar(): void {
    this.rightSidebar.classList.add('active');
  }

  /**
   * Закрыть правую боковую панель
   */
  closeRightSidebar(): void {
    this.rightSidebar.classList.remove('active');
  }

  /**
   * Получить текущее представление
   * Используется для предотвращения ошибки неиспользуемой переменной
   */
  getCurrentView(): 'lobby' | 'room' | 'sandbox' {
    return this.currentView;
  }

  // Callbacks для взаимодействия с NetworkManager
  onCreateRoom?: () => void;
  onJoinRoom?: (roomId: string) => void;
}