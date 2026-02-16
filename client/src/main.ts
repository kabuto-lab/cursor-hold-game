import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';

// === DEBUG: main.ts загружен ===
alert('main.ts LOADED! Creating MainApp...');
console.log('=== MAIN.TS LOADED ===');

class MainApp {
  private gameEngine!: GameEngine;
  private networkManager!: NetworkManager;
  private uiController!: UIController;
  private chatManager!: ChatManager;

  constructor() {
    alert('MainApp constructor started');
    console.log('[MainApp] Constructor started...');
    
    try {
      console.log('[MainApp] Creating GameEngine...');
      this.gameEngine = new GameEngine('canvasContainer');
      console.log('[MainApp] Creating NetworkManager...');
      this.networkManager = new NetworkManager();
      console.log('[MainApp] Creating UIController...');
      this.uiController = new UIController();
      console.log('[MainApp] Creating ChatManager...');
      this.chatManager = new ChatManager();
      
      console.log('[MainApp] Setting up interactions...');
      this.setupInteractions();
      
      console.log('[MainApp] Starting game engine...');
      this.gameEngine.start();
      
      alert('MainApp constructor FINISHED!');
      console.log('[MainApp] Constructor finished!');
    } catch (error) {
      alert('MainApp constructor ERROR: ' + error);
      console.error('[MainApp] Constructor ERROR:', error);
    }
  }

  private setupInteractions(): void {
    console.log('[MainApp] Setting up interactions...');
    
    this.uiController.onCreateRoom = async () => {
      alert('onCreateRoom called!');
      console.log('[MainApp] onCreateRoom called!');
      try {
        console.log('[MainApp] Calling networkManager.createRoom()...');
        const roomId = await this.networkManager.createRoom();
        alert('Room created: ' + roomId);
        console.log('[MainApp] Room created with ID:', roomId);
        
        this.uiController.setView('room');
        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
          this.uiController.updateRoomIdFromRoom(room);
        }
        this.uiController.setPlayerName('Player 1');
      } catch (error) {
        alert('Create room ERROR: ' + error);
        console.error('[MainApp] ERROR in onCreateRoom:', error);
      }
    };

    this.uiController.onJoinRoom = async (roomId) => {
      alert('onJoinRoom called with: ' + roomId);
      console.log('[MainApp] onJoinRoom called with roomId:', roomId);
      try {
        await this.networkManager.joinRoom(roomId);
        alert('Joined room!');
        console.log('[MainApp] Joined room successfully');
        this.uiController.setView('room');
        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
          this.uiController.updateRoomIdFromRoom(room);
        }
        this.uiController.setPlayerName('Player 2');
      } catch (error) {
        alert('Join room ERROR: ' + error);
        console.error('[MainApp] ERROR in onJoinRoom:', error);
      }
    };
  }
}

// Запуск приложения при загрузке страницы
alert('Registering load event listener...');
console.log('window.addEventListener("load") registering callback...');

window.addEventListener('load', () => {
  alert('LOAD EVENT FIRED! Creating MainApp...');
  console.log('=== LOAD EVENT FIRED ===');
  console.log('Creating new MainApp()...');
  new MainApp();
  console.log('MainApp() created!');
});

console.log('window.addEventListener("load") callback registered');
alert('Load event listener registered. Wait for load event...');