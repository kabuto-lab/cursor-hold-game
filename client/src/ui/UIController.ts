/**
 * UIController.ts
 * Main UI controller for room management and chat
 */

import { ChatManager } from '../features/chat/ChatManager';

export interface UIEvents {
  onCreateRoom?: () => void;
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: () => void;
}

export class UIController {
  private uiElements: {
    landingScreen: HTMLElement;
    gameScreen: HTMLElement;
    createRoomBtn: HTMLButtonElement;
    roomIdInput: HTMLInputElement;
    joinRoomBtn: HTMLButtonElement;
    leaveRoomBtn: HTMLButtonElement;
    currentRoomId: HTMLElement;
    playerCount: HTMLElement;
    chatContainer: HTMLElement;
    chatMessages: HTMLElement;
    chatInput: HTMLInputElement;
    chatSendBtn: HTMLButtonElement;
  };

  private chatManager: ChatManager;
  private events: UIEvents = {};

  constructor(events: UIEvents = {}) {
    this.events = events;
    this.chatManager = new ChatManager('chat-messages', 'chat-input', 'chat-send-btn');
    this.uiElements = this.initializeUIElements();
    this.setupEventListeners();
    this.showLandingScreen();
  }

  private initializeUIElements(): {
    landingScreen: HTMLElement;
    gameScreen: HTMLElement;
    createRoomBtn: HTMLButtonElement;
    roomIdInput: HTMLInputElement;
    joinRoomBtn: HTMLButtonElement;
    leaveRoomBtn: HTMLButtonElement;
    currentRoomId: HTMLElement;
    playerCount: HTMLElement;
    chatContainer: HTMLElement;
    chatMessages: HTMLElement;
    chatInput: HTMLInputElement;
    chatSendBtn: HTMLButtonElement;
  } {
    // Get all required UI elements
    const landingScreen = document.getElementById('landingScreen');
    const gameScreen = document.getElementById('gameScreen');
    const createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;
    const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    const leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement;
    const currentRoomId = document.getElementById('currentRoomId');
    const playerCount = document.getElementById('playerCount');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    // Check if all required elements exist
    if (!landingScreen || !gameScreen || !createRoomBtn || !roomIdInput || !joinRoomBtn || 
        !leaveRoomBtn || !currentRoomId || !playerCount || !chatContainer || 
        !chatMessages || !chatInput || !chatSendBtn) {
      throw new Error('Missing required UI elements');
    }

    return {
      landingScreen,
      gameScreen,
      createRoomBtn,
      roomIdInput,
      joinRoomBtn,
      leaveRoomBtn,
      currentRoomId,
      playerCount,
      chatContainer,
      chatMessages,
      chatInput,
      chatSendBtn
    };
  }

  private setupEventListeners(): void {
    // Room creation
    this.uiElements.createRoomBtn.addEventListener('click', () => {
      if (this.events.onCreateRoom) {
        this.events.onCreateRoom();
      }
    });

    // Room joining
    this.uiElements.joinRoomBtn.addEventListener('click', () => {
      const roomId = this.uiElements.roomIdInput.value.trim();
      if (roomId && this.events.onJoinRoom) {
        this.events.onJoinRoom(roomId);
      }
    });

    // Allow Enter key to join room
    this.uiElements.roomIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const roomId = this.uiElements.roomIdInput.value.trim();
        if (roomId && this.events.onJoinRoom) {
          this.events.onJoinRoom(roomId);
        }
      }
    });

    // Leave room
    this.uiElements.leaveRoomBtn.addEventListener('click', () => {
      if (this.events.onLeaveRoom) {
        this.events.onLeaveRoom();
      }
    });

    // Chat functionality is handled by ChatManager
  }

  showLandingScreen(): void {
    this.uiElements.landingScreen.classList.remove('hidden');
    this.uiElements.gameScreen.classList.add('hidden');
  }

  showGameScreen(): void {
    this.uiElements.landingScreen.classList.add('hidden');
    this.uiElements.gameScreen.classList.remove('hidden');
  }

  updateRoomInfo(roomId: string): void {
    this.uiElements.currentRoomId.textContent = roomId;
    
    // Add click to copy functionality
    this.uiElements.currentRoomId.onclick = () => {
      navigator.clipboard.writeText(roomId).then(() => {
        // Show temporary "COPIED!" message
        const originalText = this.uiElements.currentRoomId.textContent;
        this.uiElements.currentRoomId.textContent = 'COPIED!';
        
        setTimeout(() => {
          this.uiElements.currentRoomId.textContent = originalText;
        }, 2000);
      });
    };
  }

  updatePlayerCount(count: number, maxPlayers: number = 2): void {
    this.uiElements.playerCount.textContent = `${count}/${maxPlayers}`;
  }

  setRoomIdInput(roomId: string): void {
    this.uiElements.roomIdInput.value = roomId;
  }

  clearRoomInfo(): void {
    this.uiElements.currentRoomId.textContent = '';
    this.uiElements.playerCount.textContent = '0/2';
  }

  enableRoomActions(enabled: boolean): void {
    this.uiElements.createRoomBtn.disabled = !enabled;
    this.uiElements.joinRoomBtn.disabled = !enabled;
    this.uiElements.roomIdInput.disabled = !enabled;
  }

  enableLeaveRoom(enabled: boolean): void {
    this.uiElements.leaveRoomBtn.disabled = !enabled;
  }

  destroy(): void {
    // Clean up event listeners
    this.uiElements.createRoomBtn.replaceWith(this.uiElements.createRoomBtn.cloneNode(true));
    this.uiElements.joinRoomBtn.replaceWith(this.uiElements.joinRoomBtn.cloneNode(true));
    this.uiElements.leaveRoomBtn.replaceWith(this.uiElements.leaveRoomBtn.cloneNode(true));
    this.uiElements.roomIdInput.replaceWith(this.uiElements.roomIdInput.cloneNode(true));
    
    // Re-reference the cloned elements to maintain functionality
    this.uiElements.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.uiElements.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.uiElements.leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement;
    this.uiElements.roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;
    
    // Destroy chat manager
    this.chatManager.destroy();
  }
}