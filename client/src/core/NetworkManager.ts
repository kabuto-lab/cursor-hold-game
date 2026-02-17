import { Client } from 'colyseus.js';
import { Room } from 'colyseus.js';

/**
 * Менеджер сетевого подключения
 * Управляет подключением к Colyseus серверу
 */
export class NetworkManager {
  private client: Client;
  private currentRoom: Room | null = null;
  private readonly serverUrl: string;

  // Callback для изменения количества игроков
  public onRoomStateChange?: (count: number, max: number) => void;

  // Callbacks для вирусной битвы
  public onVirusBattleStarted?: (data: { 
    battleGrid: number[]; 
    width: number; 
    height: number;
    message: string;
    timestamp: number;
  }) => void;

  public onVirusTick?: (tick: number, data: {
    battleGrid: number[];
    width: number;
    height: number;
  }) => void;

  public onVirusBattleEnded?: (data: {
    message: string;
    winner: string;
    virusACount: number;
    virusBCount: number;
    timestamp: number;
  }) => void;

  constructor(serverUrl?: string) {
    // Локальный сервер для разработки, прод-сервер для production
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.serverUrl = serverUrl || (isLocalhost ? 'ws://localhost:2567' : 'wss://cursor-hold-game-server.onrender.com');
    this.client = new Client(this.serverUrl);

    console.log('[NetworkManager] Server URL:', this.serverUrl);
  }

  /**
   * Подключиться к серверу
   */
  async connect(): Promise<void> {
    try {
      // Проверяем соединение
      await this.client.joinOrCreate('holding_room'); // Используем правильное имя комнаты
      console.log('Connected to server:', this.serverUrl);
    } catch (error) {
      console.error('Failed to connect to server:', error);
      throw error;
    }
  }

  /**
   * Создать новую комнату
   * Возвращает реальный ID комнаты от Colyseus
   */
  async createRoom(): Promise<string> {
    console.log('[NetworkManager] createRoom() called');
    try {
      console.log('[NetworkManager] Calling client.joinOrCreate("holding_room")...');
      // Создаём новую комнату через joinOrCreate
      this.currentRoom = await this.client.joinOrCreate('holding_room');
      console.log('[NetworkManager] Room object received:', this.currentRoom);

      // Получаем roomId из state комнаты
      const roomId = this.currentRoom.state?.roomId || this.currentRoom.id;
      console.log('[NetworkManager] Room created:', roomId);

      // Подписываемся на сообщения комнаты после создания
      this.setupRoomMessageHandlers();

      return roomId;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[NetworkManager] ERROR in createRoom:', errorMsg);
      alert('Failed to create room: ' + errorMsg + '\\n\\nMake sure the server is running on port 2567.');
      throw error;
    }
  }

  /**
   * Присоединиться к существующей комнате по ID
   */
  async joinRoom(roomId: string): Promise<Room> {
    console.log('[NetworkManager] joinRoom() called with roomId:', roomId);
    try {
      // Присоединяемся к комнате по ID через joinById
      this.currentRoom = await this.client.joinById(roomId);
      console.log('[NetworkManager] Joined room:', this.currentRoom.id);

      // Подписываемся на сообщения комнаты после присоединения
      this.setupRoomMessageHandlers();

      return this.currentRoom;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[NetworkManager] ERROR in joinRoom:', errorMsg);
      alert('Failed to join room: ' + errorMsg + '\\n\\nCheck the room ID and make sure the server is running.');
      throw error;
    }
  }

  /**
   * Получить список доступных комнат (для будущего UI)
   */
  async getAvailableRooms(): Promise<any[]> {
    try {
      const rooms = await this.client.getAvailableRooms('holding_room');
      return rooms;
    } catch (error) {
      console.error('Failed to get available rooms:', error);
      return [];
    }
  }

  /**
   * Покинуть текущую комнату
   */
  leaveCurrentRoom(): void {
    if (this.currentRoom) {
      this.currentRoom.leave();
      this.currentRoom = null;
    }
  }

  /**
   * Получить текущую комнату
   */
  getCurrentRoom(): Room | null {
    return this.currentRoom;
  }

  /**
   * Отправить сообщение в комнату
   */
  sendToRoom(messageType: string, data: any): void {
    if (this.currentRoom) {
      this.currentRoom.send(messageType, data);
    } else {
      console.warn('No active room to send message to');
    }
  }

  /**
   * Подписаться на сообщения из комнаты
   */
  onMessage(messageType: string, callback: (data: any) => void): void {
    if (this.currentRoom) {
      this.currentRoom.onMessage(messageType, (data) => {
        callback(data);
      });
    } else {
      console.warn('No active room to listen to messages from');
    }
  }

  /**
   * Подписаться на изменения состояния комнаты
   */
  onStateChange(callback: (state: any) => void): void {
    if (this.currentRoom) {
      this.currentRoom.onStateChange((state) => {
        callback(state);
      });
    } else {
      console.warn('No active room to listen to state changes from');
    }
  }

  /**
   * Получить текущее состояние комнаты
   */
  getState() {
    if (this.currentRoom) {
      return this.currentRoom.state;
    }
    return null;
  }

  /**
   * Получить sessionId текущей комнаты
   */
  getSessionId(): string | null {
    return this.currentRoom?.sessionId || null;
  }

  /**
   * Настроить обработчики сообщений комнаты
   */
  private setupRoomMessageHandlers(): void {
    if (!this.currentRoom) return;

    console.log('[NetworkManager] setupRoomMessageHandlers called, sessionId:', this.currentRoom.sessionId);

    // Подписываемся на изменение количества игроков
    this.currentRoom.state.players.onAdd = () => {
      this.updatePlayerCount();
    };

    this.currentRoom.state.players.onRemove = () => {
      this.updatePlayerCount();
    };

    // Первоначальное обновление счётчика
    this.updatePlayerCount();

    // Подписываемся на сообщения вирусной битвы
    this.currentRoom.onMessage('virusBattleStarted', (data) => {
      if (this.onVirusBattleStarted) {
        this.onVirusBattleStarted(data);
      }
    });

    this.currentRoom.onMessage('virusTick', (data) => {
      if (this.onVirusTick) {
        this.onVirusTick(data.tick, data);
      }
    });

    this.currentRoom.onMessage('virusBattleEnded', (data) => {
      if (this.onVirusBattleEnded) {
        this.onVirusBattleEnded(data);
      }
    });
  }

  /**
   * Обновить счётчик игроков
   */
  private updatePlayerCount(): void {
    if (this.currentRoom && this.onRoomStateChange) {
      const count = this.currentRoom.state.players.size;
      const max = this.currentRoom.state.maxPlayers || 2;
      this.onRoomStateChange(count, max);
    }
  }

  /**
   * Получить текущее количество игроков
   */
  getPlayerCount(): number {
    return this.currentRoom?.state.players.size || 0;
  }

  /**
   * Отправить обновление позиции курсора
   */
  sendCursorUpdate(x: number, y: number): void {
    if (this.currentRoom) {
      this.currentRoom.send('updateCursor', { x, y });
    }
  }

  /**
   * Отправить обновление параметров вируса
   */
  sendParameterUpdate(params: { [key: string]: number }): void {
    if (this.currentRoom) {
      this.currentRoom.send('updateVirusParams', { params });
      console.log('[NetworkManager] Sent virus params update:', params);
    }
  }

  /**
   * Отправить статус готовности
   */
  sendToggleReady(isReady: boolean): void {
    if (this.currentRoom) {
      this.currentRoom.send('toggleReady', { isReady });
      console.log('[NetworkManager] Sent toggle ready:', isReady);
    }
  }
}