import { NetworkManager } from '../core/NetworkManager';

/**
 * Draggable Chat Window
 * Makes the HTML chat container draggable using PixiJS
 * Syncs position across all clients
 */

export class DraggableChatManager {
  private chatContainer: HTMLElement | null = null;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private objectId: string = 'chat-window';

  // Position storage
  private currentX: number = 50; // Default position (percentage)
  private currentY: number = 70; // Default position (percentage from top)

  constructor(
    private networkManager: NetworkManager
  ) {
    // Subscribe to server messages for chat position sync
    this.networkManager.onMessage('chatPositionUpdated', (data: { x: number; y: number }) => {
      this.onChatPositionUpdated(data.x, data.y);
    });

    console.log('[DraggableChatManager] Created');
  }

  /**
   * Initialize draggable chat (call after room joined)
   */
  init() {
    this.chatContainer = document.getElementById('chat-container');
    
    if (!this.chatContainer) {
      console.error('[DraggableChatManager] Chat container not found!');
      return;
    }

    // Load saved position or use default
    this.loadPosition();

    // Apply initial position
    this.updateChatPosition();

    // Make chat container draggable
    this.chatContainer.style.cursor = 'move';
    this.chatContainer.style.position = 'absolute';
    this.chatContainer.style.transition = 'none'; // Remove transition for smooth drag

    // Add drag event listeners
    this.chatContainer.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());

    // Touch support
    this.chatContainer.addEventListener('touchstart', (e) => this.onTouchStart(e));
    document.addEventListener('touchmove', (e) => this.onTouchMove(e));
    document.addEventListener('touchend', () => this.onMouseUp());

    console.log('[DraggableChatManager] Initialized at', this.currentX, '%', this.currentY, '%');
  }

  /**
   * Mouse down - start drag
   */
  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.chatContainer!.style.cursor = 'grabbing';
    
    // Calculate offset from element's top-left
    const rect = this.chatContainer!.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;

    // Send drag start to server
    this.networkManager.sendToRoom('startDragChat', {
      objectId: this.objectId
    });
  }

  /**
   * Mouse move - drag
   */
  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.chatContainer) return;

    e.preventDefault();

    // Calculate new position as percentage of screen
    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;
    
    const newX = ((e.clientX - this.dragOffsetX) / parentWidth) * 100;
    const newY = ((e.clientY - this.dragOffsetY) / parentHeight) * 100;

    // Clamp to screen bounds (0-100%)
    this.currentX = Math.max(0, Math.min(100, newX));
    this.currentY = Math.max(0, Math.min(100, newY));

    this.updateChatPosition();
  }

  /**
   * Mouse up - stop drag
   */
  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.chatContainer!.style.cursor = 'move';
      
      // Send final position to server
      this.networkManager.sendToRoom('updateChatPosition', {
        objectId: this.objectId,
        x: this.currentX,
        y: this.currentY
      });

      // Save position
      this.savePosition();
    }
  }

  /**
   * Touch start
   */
  private onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch || !this.chatContainer) return;

    this.isDragging = true;
    this.chatContainer.style.cursor = 'grabbing';
    
    const rect = this.chatContainer.getBoundingClientRect();
    this.dragOffsetX = touch.clientX - rect.left;
    this.dragOffsetY = touch.clientY - rect.top;

    this.networkManager.sendToRoom('startDragChat', {
      objectId: this.objectId
    });
  }

  /**
   * Touch move
   */
  private onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch || !this.isDragging || !this.chatContainer) return;

    e.preventDefault();

    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;
    
    const newX = ((touch.clientX - this.dragOffsetX) / parentWidth) * 100;
    const newY = ((touch.clientY - this.dragOffsetY) / parentHeight) * 100;

    this.currentX = Math.max(0, Math.min(100, newX));
    this.currentY = Math.max(0, Math.min(100, newY));

    this.updateChatPosition();
  }

  /**
   * Update chat container position
   */
  private updateChatPosition() {
    if (!this.chatContainer) return;
    
    this.chatContainer.style.left = `${this.currentX}%`;
    this.chatContainer.style.top = `${this.currentY}%`;
    this.chatContainer.style.transform = 'translate(0, 0)'; // Override default transform
  }

  /**
   * Called when chat position is updated from server
   */
  private onChatPositionUpdated(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;
    this.updateChatPosition();
    this.savePosition();
  }

  /**
   * Save position to localStorage
   */
  private savePosition() {
    localStorage.setItem('chatPosition', JSON.stringify({
      x: this.currentX,
      y: this.currentY
    }));
  }

  /**
   * Load position from localStorage
   */
  private loadPosition() {
    const saved = localStorage.getItem('chatPosition');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        this.currentX = pos.x;
        this.currentY = pos.y;
      } catch (e) {
        console.error('[DraggableChatManager] Failed to load position');
      }
    }
  }

  /**
   * Reset position to default
   */
  resetPosition() {
    this.currentX = 50;
    this.currentY = 70;
    this.updateChatPosition();
    this.savePosition();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.chatContainer) {
      this.chatContainer.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.chatContainer.style.cursor = 'default';
    }
    console.log('[DraggableChatManager] Destroyed');
  }
}
