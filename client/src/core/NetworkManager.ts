/**
 * NetworkManager.ts
 * Управление сетевым взаимодействием через Colyseus
 */

import { Client, Room } from 'colyseus.js';
import { PlayerSchema } from '../types/schema';

export interface NetworkCallbacks {
  onPlayerJoined?: (playerId: string, player: PlayerSchema) => void;
  onPlayerLeft?: (_playerId: string) => void;
  onPlayerUpdated?: (playerId: string, player: PlayerSchema) => void;
  onChatMessage?: (_message: string) => void;
  onError?: (error: unknown) => void;
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
      // Initialize players from state
      this.room!.state.players.forEach((player: PlayerSchema, playerId: string) => {
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(playerId, player);
        }
      });
    });

    // Player events
    this.room.state.players.onAdd((player: PlayerSchema, playerId: string) => {
      if (this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined(playerId, player);
      }
    });

    this.room.state.players.onRemove((_player: PlayerSchema, playerId: string) => {
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft(playerId);
      }
    });

    this.room.state.players.onChange((player: PlayerSchema, playerId: string) => {
      if (this.callbacks.onPlayerUpdated) {
        this.callbacks.onPlayerUpdated(playerId, player);
      }
    });

    // Chat messages
    this.room.onMessage('chatMessage', (data: { message: string }) => {
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

  getPlayerCount(): number {
    return this.room ? this.room.state.players.size : 0;
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