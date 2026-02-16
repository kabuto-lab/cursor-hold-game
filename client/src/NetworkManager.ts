/**
 * NetworkManager - управляет сетевым взаимодействием
 * Изолирует сетевые операции от остальной логики игры
 */

import { Client, Room } from 'colyseus.js';
import { PlayerSchema, DraggableObjectSchema } from './types/schema';

export class NetworkManager {
  private client: Client;
  private room: Room | null = null;
  
  // Callbacks для обновления состояния
  onPlayerJoined?: (playerId: string, player: PlayerSchema) => void;
  onPlayerLeft?: (_playerId: string) => void;
  onPlayerUpdated?: (playerId: string, player: PlayerSchema) => void;
  onObjectAdded?: (objectId: string, obj: DraggableObjectSchema) => void;
  onObjectRemoved?: (_objectId: string) => void;
  onObjectUpdated?: (objectId: string, obj: DraggableObjectSchema) => void;
  onVirusParamsUpdated?: (playerId: string, params: { [key: string]: number }) => void;
  onVirusBattleStarted?: (_message: string) => void;
  onVirusBattleEnded?: (_message: string) => void;
  onVirusTick?: (_tick: number, _message: string) => void;
  onCursorUpdate?: (playerId: string, x: number, y: number) => void;
  onError?: (error: unknown) => void;
  onDisconnected?: () => void;

  constructor() {
    // Используем тот же URL, что и в оригинальном коде
    const serverUrl = window.location.protocol === 'https:'
      ? 'wss://cursor-hold-game-server.onrender.com'
      : `ws://${window.location.hostname}:2567`;

    this.client = new Client(serverUrl);
  }

  async connectToRoom(roomId: string): Promise<void> {
    try {
      this.room = await this.client.joinById(roomId);
      this.setupEventHandlers();
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to join room:', error);
      if (this.onError) {
        this.onError(error);
      }
      return Promise.reject(error);
    }
  }

  async createRoom(): Promise<string> {
    try {
      this.room = await this.client.create('holding_room', {});
      this.setupEventHandlers();
      return Promise.resolve(this.room.id);
    } catch (error) {
      console.error('Failed to create room:', error);
      if (this.onError) {
        this.onError(error);
      }
      return Promise.reject(error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.room) return;

    // Обработчики состояния комнаты
    this.room.onStateChange.once(() => {
      // Инициализация начального состояния
      this.room!.state.players.forEach((player: PlayerSchema, playerId: string) => {
        if (playerId === this.room?.sessionId) {
          // Устанавливаем текущего игрока
        }
        if (this.onPlayerJoined) {
          this.onPlayerJoined(playerId, player);
        }
      });

      this.room!.state.objects.forEach((obj: DraggableObjectSchema, objectId: string) => {
        if (this.onObjectAdded) {
          this.onObjectAdded(objectId, obj);
        }
      });
    });

    // Обработчики добавления/удаления игроков
    this.room.state.players.onAdd = (player: PlayerSchema, playerId: string) => {
      if (this.onPlayerJoined) {
        this.onPlayerJoined(playerId, player);
      }
    };

    this.room.state.players.onRemove = (_player: PlayerSchema, playerId: string) => {
      if (this.onPlayerLeft) {
        this.onPlayerLeft(playerId);
      }
    };

    // Обработчики обновления игроков
    this.room.state.players.onChange = (player: PlayerSchema, playerId: string) => {
      if (this.onPlayerUpdated) {
        this.onPlayerUpdated(playerId, player);
      }
    };

    // Обработчики объектов
    this.room.state.objects.onAdd = (obj: DraggableObjectSchema, objectId: string) => {
      if (this.onObjectAdded) {
        this.onObjectAdded(objectId, obj);
      }
    };

    this.room.state.objects.onRemove = (_obj: DraggableObjectSchema, objectId: string) => {
      if (this.onObjectRemoved) {
        this.onObjectRemoved(objectId);
      }
    };

    // Обработчики сообщений
    this.room.onMessage('updatePosition', (data: { playerId: string; x: number; y: number }) => {
      if (this.onPlayerUpdated) {
        // Обновляем позицию игрока в схеме
        const player = this.room?.state.players.get(data.playerId);
        if (player) {
          const updatedPlayer = { ...player, x: data.x, y: data.y };
          this.onPlayerUpdated(data.playerId, updatedPlayer);
        }
      }
    });

    this.room.onMessage('holdHands', (_data: { player1Id: string; player2Id: string }) => {
      // Обработка "держания за руки"
    });

    this.room.onMessage('releaseHands', (_data: { player1Id: string; player2Id: string }) => {
      // Обработка отпускания рук
    });

    this.room.onMessage('playerNameUpdated', (data: { playerId: string; name: string }) => {
      // Обновление имени игрока
      const player = this.room?.state.players.get(data.playerId);
      if (player) {
        const updatedPlayer = { ...player, name: data.name };
        if (this.onPlayerUpdated) {
          this.onPlayerUpdated(data.playerId, updatedPlayer);
        }
      }
    });

    // Обработчики вирусной битвы
    this.room.onMessage('virusParamsUpdated', (data: { playerId: string; params: { [key: string]: number } }) => {
      if (this.onVirusParamsUpdated) {
        this.onVirusParamsUpdated(data.playerId, data.params);
      }
    });

    this.room.onMessage('virusBattleStarted', (data: { message: string }) => {
      if (this.onVirusBattleStarted) {
        this.onVirusBattleStarted(data.message);
      }
    });

    this.room.onMessage('virusBattleEnded', (data: { message: string }) => {
      if (this.onVirusBattleEnded) {
        this.onVirusBattleEnded(data.message);
      }
    });

    this.room.onMessage('virusTick', (data: { tick: number; message: string }) => {
      if (this.onVirusTick) {
        this.onVirusTick(data.tick, data.message);
      }
    });

    // Обработчики обновления курсора
    this.room.onMessage('cursorUpdate', (data: { playerId: string; x: number; y: number }) => {
      if (this.onCursorUpdate) {
        this.onCursorUpdate(data.playerId, data.x, data.y);
      }
    });

    // Обработчики отключения
    this.room.onLeave(() => {
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    });

    this.room.onError((error) => {
      if (this.onError) {
        this.onError(error);
      }
    });
  }

  sendPosition(x: number, y: number): void {
    if (this.room) {
      this.room.send('updatePosition', { x, y });
    }
  }

  sendToggleHoldHands(targetPlayerId: string): void {
    if (this.room) {
      this.room.send('toggleHoldHands', { targetPlayerId });
    }
  }

  sendParameterUpdate(params: { [key: string]: number }): void {
    if (this.room) {
      this.room.send('updateVirusParams', { params });
    }
  }

  sendToggleReady(isReady: boolean): void {
    if (this.room) {
      this.room.send('toggleReady', { isReady });
    }
  }

  sendCursorUpdate(x: number, y: number): void {
    if (this.room) {
      this.room.send('updateCursor', { x, y });
    }
  }

  leaveRoom(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }

  getRoomId(): string | null {
    return this.room ? this.room.id : null;
  }

  getSessionId(): string | null {
    return this.room ? this.room.sessionId : null;
  }

  isConnected(): boolean {
    return this.room !== null;
  }
}