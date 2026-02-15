/**
 * NetworkManager.ts
 * Управление сетевым взаимодействием через Colyseus
 */

import { Client, Room } from 'colyseus.js';
import { PlayerSchema, DraggableObjectSchema } from '../types/schema';

export interface NetworkCallbacks {
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
  onChatMessage?: (message: string) => void;
  onError?: (error: any) => void;
  onDisconnected?: () => void;
}

export interface NetworkCallbacks {
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
}

export class NetworkManager {
  private client: Client;
  private room: Room | null = null;
  private callbacks: NetworkCallbacks = {};

  constructor() {
    // Use the same server URL as in the original code
    const serverUrl = window.location.protocol === 'https:' 
      ? 'wss://cursor-hold-game-server.onrender.com' 
      : `ws://${window.location.hostname}:2567`;
    
    this.client = new Client(serverUrl);
  }

  async connectToRoom(roomId: string): Promise<void> {
    try {
      this.room = await this.client.joinById(roomId);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to join room:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  async createRoom(): Promise<string> {
    try {
      this.room = await this.client.create('holding_room', {});
      this.setupEventHandlers();
      return this.room.id;
    } catch (error) {
      console.error('Failed to create room:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.room) return;

    // State change handler
    this.room.onStateChange.once(() => {
      // Initialize players and objects from state
      this.room.state.players.forEach((player, playerId) => {
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(playerId, player);
        }
      });

      this.room.state.objects.forEach((obj, objectId) => {
        if (this.callbacks.onObjectAdded) {
          this.callbacks.onObjectAdded(objectId, obj);
        }
      });
    });

    // Player events
    this.room.state.players.onAdd((player, playerId) => {
      if (this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined(playerId, player);
      }
    });

    this.room.state.players.onRemove((player, playerId) => {
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft(playerId);
      }
    });

    this.room.state.players.onChange((player, playerId) => {
      if (this.callbacks.onPlayerUpdated) {
        this.callbacks.onPlayerUpdated(playerId, player);
      }
    });

    // Object events
    this.room.state.objects.onAdd((obj, objectId) => {
      if (this.callbacks.onObjectAdded) {
        this.callbacks.onObjectAdded(objectId, obj);
      }
    });

    this.room.state.objects.onRemove((obj, objectId) => {
      if (this.callbacks.onObjectRemoved) {
        this.callbacks.onObjectRemoved(objectId);
      }
    });

    // Message handlers
    this.room.onMessage('updatePosition', (data: { playerId: string; x: number; y: number }) => {
      if (this.callbacks.onPlayerUpdated) {
        const player = this.room.state.players.get(data.playerId);
        if (player) {
          const updatedPlayer = { ...player, x: data.x, y: data.y };
          this.callbacks.onPlayerUpdated(data.playerId, updatedPlayer);
        }
      }
    });

    this.room.onMessage('playerNameUpdated', (data: { playerId: string; name: string }) => {
      if (this.callbacks.onPlayerUpdated) {
        const player = this.room.state.players.get(data.playerId);
        if (player) {
          const updatedPlayer = { ...player, name: data.name };
          this.callbacks.onPlayerUpdated(data.playerId, updatedPlayer);
        }
      }
    });

    // Virus battle messages
    this.room.onMessage('virusParamsUpdated', (data: { playerId: string; params: { [key: string]: number } }) => {
      if (this.callbacks.onVirusParamsUpdated) {
        this.callbacks.onVirusParamsUpdated(data.playerId, data.params);
      }
    });

    this.room.onMessage('virusBattleStarted', (data: { message: string }) => {
      if (this.callbacks.onVirusBattleStarted) {
        this.callbacks.onVirusBattleStarted(data.message);
      }
    });

    this.room.onMessage('virusBattleEnded', (data: { message: string }) => {
      if (this.callbacks.onVirusBattleEnded) {
        this.callbacks.onVirusBattleEnded(data.message);
      }
    });

    this.room.onMessage('virusTick', (data: { tick: number; message: string }) => {
      if (this.callbacks.onVirusTick) {
        this.callbacks.onVirusTick(data.tick, data.message);
      }
    });

    // Cursor update
    this.room.onMessage('cursorUpdate', (data: { playerId: string; x: number; y: number }) => {
      if (this.callbacks.onCursorUpdate) {
        this.callbacks.onCursorUpdate(data.playerId, data.x, data.y);
      }
    });

    // Chat messages
    this.room.onMessage('chatMessage', (data: { playerId: string; playerName: string; message: string; timestamp: number }) => {
      if (this.callbacks.onChatMessage) {
        this.callbacks.onChatMessage(data.message);
      }
    });

    // Connection events
    this.room.onLeave(() => {
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected();
      }
    });

    this.room.onError((error) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
  }

  sendPosition(x: number, y: number): void {
    if (this.room) {
      this.room.send('updatePosition', { x, y });
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

  sendChatMessage(message: string): void {
    if (this.room) {
      this.room.send('chatMessage', { message });
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

  setCallbacks(callbacks: NetworkCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}