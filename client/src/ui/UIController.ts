// UIController.ts - manages screens: lobby → room → chat
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

  constructor() {
    // Get all required UI elements
    const landingScreen = document.getElementById('landingScreen') as HTMLElement | null;
    const gameScreen = document.getElementById('gameScreen') as HTMLElement | null;
    const createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement | null;
    const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement | null;
    const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement | null;
    const leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement | null;
    const currentRoomId = document.getElementById('currentRoomId') as HTMLElement | null;
    const playerCount = document.getElementById('playerCount') as HTMLElement | null;
    const chatContainer = document.getElementById('chat-container') as HTMLElement | null;
    const chatMessages = document.getElementById('chat-messages') as HTMLElement | null;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
    const chatSendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;

    if (!landingScreen || !gameScreen || !createRoomBtn || !roomIdInput || !joinRoomBtn || 
        !leaveRoomBtn || !currentRoomId || !playerCount || !chatContainer || 
        !chatMessages || !chatInput || !chatSendBtn) {
      throw new Error('Missing required UI elements');
    }

    this.uiElements = {
      landingScreen: landingScreen!,
      gameScreen: gameScreen!,
      createRoomBtn: createRoomBtn!,
      roomIdInput: roomIdInput!,
      joinRoomBtn: joinRoomBtn!,
      leaveRoomBtn: leaveRoomBtn!,
      currentRoomId: currentRoomId!,
      playerCount: playerCount!,
      chatContainer: chatContainer!,
      chatMessages: chatMessages!,
      chatInput: chatInput!,
      chatSendBtn: chatSendBtn!
    };

    this.setupEventListeners();
    this.showLandingScreen();
  }

  private setupEventListeners(): void {
    // Chat functionality
    this.uiElements.chatSendBtn.addEventListener('click', () => {
      this.sendChatMessage();
    });

    this.uiElements.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage();
      }
    });
  }

  private sendChatMessage(): void {
    const message = this.uiElements.chatInput.value.trim();
    if (message) {
      // Add message to chat display
      const messageElement = document.createElement('div');
      messageElement.textContent = `You: ${message}`;
      this.uiElements.chatMessages.appendChild(messageElement);
      
      // Scroll to bottom
      this.uiElements.chatMessages.scrollTop = this.uiElements.chatMessages.scrollHeight;
      
      // Clear input
      this.uiElements.chatInput.value = '';
    }
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

  addChatMessage(message: string): void {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    this.uiElements.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    this.uiElements.chatMessages.scrollTop = this.uiElements.chatMessages.scrollHeight;
  }

  destroy(): void {
    // Clean up event listeners if needed
  }
}