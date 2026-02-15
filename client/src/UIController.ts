/**
 * UIController - управляет пользовательским интерфейсом
 * Изолирует DOM-операции от остальной логики игры
 */

import { GameStateManager } from './GameStateManager';

export class UIController {
  // DOM элементы
  private appContainer: HTMLElement;
  private landingScreen: HTMLElement;
  private gameScreen: HTMLElement;
  private roomIdInput: HTMLInputElement;
  private createRoomBtn: HTMLButtonElement;
  private joinRoomBtn: HTMLButtonElement;
  private leaveRoomBtn: HTMLButtonElement;
  private playerNameInput: HTMLInputElement;
  private playerNameDisplay: HTMLElement;
  private playerCountDisplay: HTMLElement;
  private currentRoomIdDisplay: HTMLElement;
  private chatInput: HTMLInputElement;
  private chatSendBtn: HTMLButtonElement;
  private chatMessages: HTMLElement;
  private sidebar: HTMLElement;
  private menuBtn: HTMLButtonElement;
  private closeSidebarBtn: HTMLButtonElement;
  private readyBtn: HTMLButtonElement;
  private pointsRemainingDisplay: HTMLElement;
  private paramCells: NodeListOf<Element>;
  private leftSidebar: HTMLElement;
  private leftMenuBtn: HTMLButtonElement;
  private closeLeftSidebarBtn: HTMLButtonElement;
  private connectionStatus: HTMLElement;

  constructor(private gameStateManager: GameStateManager) {
    // Инициализируем DOM элементы
    this.appContainer = document.getElementById('app')!;
    this.landingScreen = document.getElementById('landingScreen')!;
    this.gameScreen = document.getElementById('gameScreen')!;
    this.roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;
    this.createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    this.joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    this.leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement;
    this.playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
    this.playerNameDisplay = document.getElementById('playerName')!;
    this.playerCountDisplay = document.getElementById('playerCount')!;
    this.currentRoomIdDisplay = document.getElementById('currentRoomId')!;
    this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
    this.chatSendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;
    this.chatMessages = document.getElementById('chat-messages')!;
    this.sidebar = document.getElementById('sidebar')!;
    this.menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;
    this.closeSidebarBtn = document.getElementById('closeSidebarBtn') as HTMLButtonElement;
    this.readyBtn = document.getElementById('readyBtn') as HTMLButtonElement;
    this.pointsRemainingDisplay = document.getElementById('points-remaining')!;
    this.paramCells = document.querySelectorAll('.param-cell');
    this.leftSidebar = document.getElementById('leftSidebar')!;
    this.leftMenuBtn = document.getElementById('leftMenuBtn') as HTMLButtonElement;
    this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn') as HTMLButtonElement;
    this.connectionStatus = document.getElementById('connectionStatus')!;

    this.setupEventListeners();
    this.updateParamDisplays();
  }

  private setupEventListeners(): void {
    // Обработчики кнопок
    this.createRoomBtn.addEventListener('click', () => {
      if (this.onCreateRoom) this.onCreateRoom();
    });

    this.joinRoomBtn.addEventListener('click', () => {
      const roomId = this.roomIdInput.value.trim();
      if (roomId && this.onJoinRoom) this.onJoinRoom(roomId);
    });

    this.leaveRoomBtn.addEventListener('click', () => {
      if (this.onLeaveRoom) this.onLeaveRoom();
    });

    // Обработчики параметров вируса
    this.paramCells.forEach(cell => {
      const param = cell.getAttribute('data-param');
      if (param) {
        cell.addEventListener('click', () => {
          if (this.onIncreaseParameter) this.onIncreaseParameter(param);
        });

        // Обработчики для эмодзи и названия (уменьшение параметра)
        const emojiEl = cell.querySelector('.param-emoji');
        const nameEl = cell.querySelector('.param-name');
        
        if (emojiEl) {
          emojiEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onDecreaseParameter) this.onDecreaseParameter(param);
          });
        }
        
        if (nameEl) {
          nameEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onDecreaseParameter) this.onDecreaseParameter(param);
          });
        }
      }
    });

    // Обработчик кнопки готовности
    this.readyBtn.addEventListener('click', () => {
      if (this.onToggleReady) this.onToggleReady(!this.gameStateManager.isPlayerReady);
    });

    // Обработчики чата
    this.chatSendBtn.addEventListener('click', () => {
      const message = this.chatInput.value.trim();
      if (message && this.onSendMessage) this.onSendMessage(message);
    });

    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = this.chatInput.value.trim();
        if (message && this.onSendMessage) this.onSendMessage(message);
      }
    });

    // Обработчики сайдбаров
    this.menuBtn.addEventListener('click', () => {
      this.sidebar.classList.add('active');
    });

    this.closeSidebarBtn.addEventListener('click', () => {
      this.sidebar.classList.remove('active');
    });

    this.leftMenuBtn.addEventListener('click', () => {
      this.leftSidebar.classList.add('active');
    });

    this.closeLeftSidebarBtn.addEventListener('click', () => {
      this.leftSidebar.classList.remove('active');
    });
  }

  // Callbacks для обновления состояния
  onCreateRoom?: () => void;
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: () => void;
  onSendMessage?: (message: string) => void;
  onIncreaseParameter?: (param: string) => void;
  onDecreaseParameter?: (param: string) => void;
  onToggleReady?: (isReady: boolean) => void;

  updatePlayerCount(count: number, max: number): void {
    this.playerCountDisplay.textContent = `${count}/${max}`;
  }

  updateCurrentRoomId(roomId: string): void {
    this.currentRoomIdDisplay.textContent = roomId;
  }

  updatePlayerName(playerId: string, name: string): void {
    if (playerId === this.gameStateManager.currentPlayerId) {
      this.playerNameDisplay.textContent = name;
    }
  }

  updateReadyButton(isReady: boolean): void {
    this.readyBtn.textContent = isReady ? 'UNREADY' : 'READY';
    this.readyBtn.style.backgroundColor = isReady ? '#00ff00' : '#ff00ff'; // Green if ready, magenta if not
  }

  updatePointsDisplay(remaining: number): void {
    this.pointsRemainingDisplay.textContent = remaining.toString();
  }

  updateParamDisplay(param: string, value: number): void {
    const paramValueEl = document.getElementById(`param-${param}`);
    if (paramValueEl) {
      paramValueEl.textContent = value.toString();
    }
  }

  private updateParamDisplays(): void {
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];

    paramNames.forEach(param => {
      this.updateParamDisplay(param, this.gameStateManager.getParamValue(param));
    });
  }

  showGameScreen(): void {
    this.landingScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
  }

  showLandingScreen(): void {
    this.gameScreen.classList.add('hidden');
    this.landingScreen.classList.remove('hidden');
  }

  addChatMessage(senderName: string, message: string, timestamp: number): void {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `<strong>[${timeString}] ${senderName}:</strong> ${message}`;
    
    this.chatMessages.appendChild(messageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.connectionStatus.className = `connection-status ${status}`;
  }

  showError(message: string): void {
    // Create an error message element
    let errorEl = document.getElementById('errorMessage');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'errorMessage';
      errorEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ff0000;
        color: white;
        padding: 15px 25px;
        border: 2px solid #ffff00;
        border-radius: 0;
        font-family: 'Courier New', monospace;
        font-size: 1rem;
        z-index: 1000;
        text-align: center;
      `;
      document.body.appendChild(errorEl);
    }

    errorEl.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorEl && errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }

  clearChat(): void {
    this.chatMessages.innerHTML = '';
  }

  clearInputs(): void {
    this.roomIdInput.value = '';
    this.chatInput.value = '';
  }

  focusChatInput(): void {
    this.chatInput.focus();
  }

  disableParameterAdjustments(): void {
    this.paramCells.forEach(cell => {
      cell.classList.add('disabled');
      (cell as HTMLElement).style.pointerEvents = 'none';
      (cell as HTMLElement).style.opacity = '0.5';
    });
  }

  enableParameterAdjustments(): void {
    this.paramCells.forEach(cell => {
      cell.classList.remove('disabled');
      (cell as HTMLElement).style.pointerEvents = 'auto';
      (cell as HTMLElement).style.opacity = '1';
    });
  }

  destroy(): void {
    // Удаляем обработчики событий
    this.createRoomBtn.removeEventListener('click', () => {});
    this.joinRoomBtn.removeEventListener('click', () => {});
    this.leaveRoomBtn.removeEventListener('click', () => {});
    this.chatSendBtn.removeEventListener('click', () => {});
    this.chatInput.removeEventListener('keypress', () => {});
    this.menuBtn.removeEventListener('click', () => {});
    this.closeSidebarBtn.removeEventListener('click', () => {});
    this.leftMenuBtn.removeEventListener('click', () => {});
    this.closeLeftSidebarBtn.removeEventListener('click', () => {});
    this.readyBtn.removeEventListener('click', () => {});

    // Удаляем все параметры
    this.paramCells.forEach(cell => {
      const param = cell.getAttribute('data-param');
      if (param) {
        cell.removeEventListener('click', () => {});
        
        const emojiEl = cell.querySelector('.param-emoji');
        const nameEl = cell.querySelector('.param-name');
        
        if (emojiEl) {
          emojiEl.removeEventListener('click', () => {});
        }
        
        if (nameEl) {
          nameEl.removeEventListener('click', () => {});
        }
      }
    });
  }
}