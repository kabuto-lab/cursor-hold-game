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

  constructor(serverUrl: string = 'ws://localhost:2567') {
    this.serverUrl = serverUrl;
    this.client = new Client(this.serverUrl);
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
   * Создать новую комнату с указанным ID
   */
  async createRoom(roomId?: string): Promise<string> {
    try {
      // Если ID не предоставлен, генерируем новый
      const finalRoomId = roomId || this.generateRoomId();
      
      // Создаем комнату с указанным ID
      this.currentRoom = await this.client.create('holding_room', { roomId: finalRoomId });
      
      return finalRoomId;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Присоединиться к существующей комнате по ID
   */
  async joinRoom(roomId: string): Promise<Room> {
    try {
      this.currentRoom = await this.client.joinById(roomId);
      return this.currentRoom;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Присоединиться к комнате по имени (если нужен поиск по имени)
   */
  async joinOrCreateRoom(roomName: string = 'holding_room'): Promise<Room> {
    try {
      this.currentRoom = await this.client.joinOrCreate(roomName);
      return this.currentRoom;
    } catch (error) {
      console.error('Failed to join or create room:', error);
      throw error;
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
   * Генерация уникального ID комнаты
   */
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}