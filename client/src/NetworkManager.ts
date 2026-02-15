/**
 * NetworkManager - управляет сетевым взаимодействием
 * Изолирует сетевые операции от остальной логики игры
 */

import { Client, Room } from 'colyseus.js';
import { PlayerSchema, DraggableObjectSchema } from './types/schema';
import { GameStateManager } from './GameStateManager';

export class NetworkManager {
  private client: Client;
  private room: Room | null = null;
  private gameStateManager: GameStateManager;
  
  // Callbacks для обновления состояния
  onPlayerJoined?: (playerId: string, player: PlayerSchema) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerUpdated?: (playerId: string, player: PlayerSchema) => void;
  onObjectAdded?: (objectId: string, obj: DraggableObjectSchema) => void;
  onObjectRemoved?: (objectId: string) => void;
  onObjectUpdated?: (objectId: string, obj: DraggableObjectSchema) => void;
  onVirusParamsUpdated?: (playerId: string, params: { [key: string]: number }) => void;
  onVirusBattleStarted?: (message: string) => void;
  onVirusBattleEnded?: (message: string) => void;
  onVirusTick?: (tick: number, message: string) => void;
  onCursorUpdate?: (playerId: string, x: number, y: number) => void;
  onError?: (error: any) => void;
  onDisconnected?: () => void;

  constructor(gameStateManager: GameStateManager) {
    this.gameStateManager = gameStateManager;
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
      this.room?.state.players.forEach((player, playerId) => {
        this.gameStateManager.addPlayer(playerId, player);
        if (playerId === this.room?.sessionId) {
          this.gameStateManager.setCurrentPlayerId(playerId);
        }
      });

      this.room?.state.objects.forEach((obj, objectId) => {
        this.gameStateManager.addObject(objectId, obj);
      });
    });

    // Обработчики добавления/удаления игроков
    this.room.state.players.onAdd = (player, playerId) => {
      this.gameStateManager.addPlayer(playerId, player);
      if (this.onPlayerJoined) {
        this.onPlayerJoined(playerId, player);
      }
    };

    this.room.state.players.onRemove = (player, playerId) => {
      this.gameStateManager.removePlayer(playerId);
      if (this.onPlayerLeft) {
        this.onPlayerLeft(playerId);
      }
    };

    // Обработчики обновления игроков
    this.room.state.players.onChange = (player, playerId) => {
      this.gameStateManager.updatePlayer(playerId, player);
      if (this.onPlayerUpdated) {
        this.onPlayerUpdated(playerId, player);
      }
    };

    // Обработчики объектов
    this.room.state.objects.onAdd = (obj, objectId) => {
      this.gameStateManager.addObject(objectId, obj);
      if (this.onObjectAdded) {
        this.onObjectAdded(objectId, obj);
      }
    };

    this.room.state.objects.onRemove = (obj, objectId) => {
      this.gameStateManager.removeObject(objectId);
      if (this.onObjectRemoved) {
        this.onObjectRemoved(objectId);
      }
    };

    // Обработчики сообщений
    this.room.onMessage('updatePosition', (data: { playerId: string; x: number; y: number }) => {
      if (this.onPlayerUpdated) {
        // Обновляем позицию игрока в схеме
        const player = this.gameStateManager.players.get(data.playerId);
        if (player) {
          const updatedPlayer = { ...player, x: data.x, y: data.y };
          this.gameStateManager.updatePlayer(data.playerId, updatedPlayer);
          this.onPlayerUpdated(data.playerId, updatedPlayer);
        }
      }
    });

    this.room.onMessage('holdHands', (data: { player1Id: string; player2Id: string }) => {
      // Обработка "держания за руки"
    });

    this.room.onMessage('releaseHands', (data: { player1Id: string; player2Id: string }) => {
      // Обработка отпускания рук
    });

    this.room.onMessage('playerNameUpdated', (data: { playerId: string; name: string }) => {
      // Обновление имени игрока
      const player = this.gameStateManager.players.get(data.playerId);
      if (player) {
        const updatedPlayer = { ...player, name: data.name };
        this.gameStateManager.updatePlayer(data.playerId, updatedPlayer);
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
      this.gameStateManager.setBattleRunning(true);
      if (this.onVirusBattleStarted) {
        this.onVirusBattleStarted(data.message);
      }
    });

    this.room.onMessage('virusBattleEnded', (data: { message: string }) => {
      this.gameStateManager.setBattleRunning(false);
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