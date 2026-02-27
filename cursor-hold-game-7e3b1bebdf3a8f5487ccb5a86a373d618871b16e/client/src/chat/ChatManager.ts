import { Room } from 'colyseus.js';

/**
 * Менеджер чата
 * Управляет отправкой и получением сообщений в комнате
 */
export class ChatManager {
  private room: Room | null = null;
  private chatContainer: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendMessageBtn: HTMLButtonElement;

  constructor() {
    this.chatContainer = document.getElementById('chat-messages')!;
    this.messageInput = document.getElementById('chat-input') as HTMLInputElement;
    this.sendMessageBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;

    this.setupEventListeners();
  }

  /**
   * Установить обработчики событий
   */
  private setupEventListeners(): void {
    this.sendMessageBtn?.addEventListener('click', () => {
      this.sendMessage();
    });

    this.messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  /**
   * Подключить к комнате
   */
  attachToRoom(room: Room): void {
    this.room = room;

    // Подписываемся на события комнаты для получения сообщений
    this.room.onMessage('chatMessage', (data) => {
      this.receiveMessage(data.playerName, data.message, data.timestamp);
    });
  }

  /**
   * Отправить сообщение
   */
  sendMessage(): void {
    const message = this.messageInput?.value.trim();
    if (!message || !this.room) {
      return;
    }

    // Отправляем сообщение в комнату
    this.room.send('chatMessage', {
      message: message,
      timestamp: Date.now()
    });

    // Очищаем поле ввода
    this.messageInput.value = '';
  }

  /**
   * Получить сообщение
   */
  private receiveMessage(sender: string, message: string, timestamp: number): void {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const timeString = new Date(timestamp).toLocaleTimeString();
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message} <span class="timestamp">(${timeString})</span>`;
    
    this.chatContainer.appendChild(messageElement);
    
    // Прокручиваем вниз
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  /**
   * Очистить чат
   */
  clear(): void {
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
    }
  }
}