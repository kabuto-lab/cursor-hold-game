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

  constructor(serverUrl?: string) {
    // HARDCODE: для теста используем прод-сервер
    this.serverUrl = serverUrl || 'wss://cursor-hold-game-server.onrender.com';
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
    console.log('[NetworkManager] Current client:', this.client);
    try {
      console.log('[NetworkManager] Calling client.joinOrCreate("holding_room")...');
      // Создаём новую комнату через joinOrCreate
      this.currentRoom = await this.client.joinOrCreate('holding_room');
      console.log('[NetworkManager] Room object received:', this.currentRoom);

      // Получаем roomId из state комнаты
      const roomId = this.currentRoom.state?.roomId || this.currentRoom.id;
      console.log('[NetworkManager] Room created:', roomId);

      return roomId;
    } catch (error) {
      console.error('[NetworkManager] ERROR in createRoom:', error);
      throw error;
    }
  }

  /**
   * Присоединиться к существующей комнате по ID
   */
  async joinRoom(roomId: string): Promise<Room> {
    try {
      // Присоединяемся к комнате по реальному ID
      this.currentRoom = await this.client.joinById(roomId);
      console.log('[NetworkManager] Joined room:', roomId);
      
      return this.currentRoom;
    } catch (error) {
      console.error('Failed to join room:', error);
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
}