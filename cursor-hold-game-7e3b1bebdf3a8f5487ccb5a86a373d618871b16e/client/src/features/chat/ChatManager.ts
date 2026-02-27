/**
 * ChatManager.ts
 * Управление чатом
 */

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface ChatCallbacks {
  onMessageReceived?: (message: ChatMessage) => void;
  onMessageSent?: (message: string) => void;
}

export class ChatManager {
  private messages: ChatMessage[] = [];
  private callbacks: ChatCallbacks = {};

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    
    if (this.callbacks.onMessageReceived) {
      this.callbacks.onMessageReceived(message);
    }
  }

  getRecentMessages(limit: number = 50): ChatMessage[] {
    return this.messages.slice(-limit);
  }

  clearMessages(): void {
    this.messages = [];
  }

  sendMessage(message: string, playerId: string, playerName: string): void {
    const chatMessage: ChatMessage = {
      playerId,
      playerName,
      message,
      timestamp: Date.now()
    };
    
    this.addMessage(chatMessage);
    
    if (this.callbacks.onMessageSent) {
      this.callbacks.onMessageSent(message);
    }
  }

  setCallbacks(callbacks: ChatCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}