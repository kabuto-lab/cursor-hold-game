import { GameEngine } from './core/GameEngine';
import { NetworkManager } from './core/NetworkManager';
import { UIController } from './ui/UIController';
import { ChatManager } from './chat/ChatManager';

console.log('[MainApp] main.ts loaded');

class MainApp {
  private gameEngine!: GameEngine;
  private networkManager!: NetworkManager;
  private uiController!: UIController;
  private chatManager!: ChatManager;

  constructor() {
    console.log('[MainApp] Constructor started...');
    
    try {
      console.log('[MainApp] Creating GameEngine...');
      this.gameEngine = new GameEngine();
      console.log('[MainApp] Creating NetworkManager...');
      this.networkManager = new NetworkManager();
      console.log('[MainApp] Creating UIController...');
      this.uiController = new UIController();
      console.log('[MainApp] Creating ChatManager...');
      this.chatManager = new ChatManager();
      
      console.log('[MainApp] Setting up interactions...');
      this.setupInteractions();
      
      // Инициализация PixiJS (асинхронно)
      console.log('[MainApp] Initializing GameEngine...');
      this.gameEngine.init('canvasContainer').then(() => {
        console.log('[MainApp] GameEngine initialized!');
        this.gameEngine.start();
      }).catch((error) => {
        console.error('[MainApp] GameEngine init ERROR:', error);
      });
      
      console.log('[MainApp] Constructor finished!');
    } catch (error) {
      console.error('[MainApp] Constructor ERROR:', error);
    }
  }

  private setupInteractions(): void {
    console.log('[MainApp] Setting up interactions...');
    
    this.uiController.onCreateRoom = async () => {
      console.log('[MainApp] onCreateRoom called!');
      try {
        console.log('[MainApp] Calling networkManager.createRoom()...');
        const roomId = await this.networkManager.createRoom();
        console.log('[MainApp] Room created with ID:', roomId);

        this.uiController.setView('room');
        
        // Показываем ID комнаты сразу
        this.uiController.showCreatedRoomId(roomId);
        
        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
        }
        this.uiController.setPlayerName('Player 1');
      } catch (error) {
        console.error('[MainApp] ERROR in onCreateRoom:', error);
        alert('Create room ERROR: ' + error);
      }
    };

    this.uiController.onJoinRoom = async (roomId) => {
      console.log('[MainApp] onJoinRoom called with roomId:', roomId);
      try {
        await this.networkManager.joinRoom(roomId);
        console.log('[MainApp] Joined room successfully');
        
        this.uiController.setView('room');
        
        // Показываем ID комнаты сразу
        this.uiController.showCreatedRoomId(roomId);
        
        const room = this.networkManager.getCurrentRoom();
        if (room) {
          this.chatManager.attachToRoom(room);
        }
        this.uiController.setPlayerName('Player 2');
      } catch (error) {
        console.error('[MainApp] ERROR in onJoinRoom:', error);
        alert('Join room ERROR: ' + error);
      }
    };
  }
}

// Запуск приложения при загрузке страницы
console.log('[MainApp] Registering load event listener...');

window.addEventListener('load', () => {
  console.log('[MainApp] LOAD EVENT FIRED');
  console.log('Creating new MainApp()...');
  new MainApp();
  console.log('MainApp() created!');
});

console.log('[MainApp] Load event listener registered');