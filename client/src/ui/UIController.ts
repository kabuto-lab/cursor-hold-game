/**
 * Контроллер пользовательского интерфейса
 * Управляет переключением между lobby ↔ room и боковыми панелями
 */
export class UIController {
  private lobbyContainer: HTMLElement;
  private roomContainer: HTMLElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private roomIdInput: HTMLInputElement;
  private currentView: 'lobby' | 'room' = 'lobby'; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Элементы для боковых панелей
  private leftMenuBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;
  private leftSidebar: HTMLElement;
  private rightSidebar: HTMLElement;
  private closeLeftSidebarBtn: HTMLButtonElement;
  private closeSidebarBtn: HTMLButtonElement;

  constructor() {
    // Основные элементы
    this.lobbyContainer = document.getElementById('landingScreen')!;
    this.roomContainer = document.getElementById('gameScreen')!;
    this.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;

    // Элементы боковых панелей
    this.leftMenuBtn = document.getElementById('leftMenuBtn') as HTMLButtonElement;
    this.menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;
    this.leftSidebar = document.getElementById('leftSidebar')!;
    this.rightSidebar = document.getElementById('sidebar')!;
    this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn') as HTMLButtonElement;
    this.closeSidebarBtn = document.getElementById('closeSidebarBtn') as HTMLButtonElement;

    this.setupEventListeners();
    this.setView('lobby');
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
    console.log('[UIController] Create Room button clicked!');
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
   * Установить текущее представление
   */
  setView(view: 'lobby' | 'room'): void {
    console.log('[UIController] setView called with:', view);
    this.currentView = view;

    if (view === 'lobby') {
      console.log('[UIController] Showing landing screen, hiding game screen');
      this.lobbyContainer.style.display = 'flex';
      this.roomContainer.style.display = 'none';
    } else {
      console.log('[UIController] Showing game screen, hiding landing screen');
      this.lobbyContainer.style.display = 'none';
      this.roomContainer.style.display = 'flex';
      console.log('[UIController] gameScreen display:', this.roomContainer.style.display);
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
      }
    } else if (name === 'Player 2') {
      const player2Element = document.getElementById('player2Name');
      if (player2Element) {
        player2Element.textContent = name;
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
  getCurrentView(): 'lobby' | 'room' {
    return this.currentView;
  }

  // Callbacks для взаимодействия с NetworkManager
  onCreateRoom?: () => void;
  onJoinRoom?: (roomId: string) => void;
}