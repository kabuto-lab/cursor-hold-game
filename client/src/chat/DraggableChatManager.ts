import { NetworkManager } from '../core/NetworkManager';

/**
 * Draggable Chat Window
 * Makes the HTML chat container draggable
 * Syncs position across all clients
 */

export class DraggableChatManager {
  private chatContainer: HTMLElement | null = null;
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private objectId: string = 'chat-window';

  // Position storage (in pixels for smoother drag)
  private currentX: number = 0; // pixels from left
  private currentY: number = 0; // pixels from top

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

    // Set up chat container for dragging
    this.chatContainer.style.position = 'fixed';
    this.chatContainer.style.left = '50%';
    this.chatContainer.style.top = 'auto';
    this.chatContainer.style.bottom = '20px';
    this.chatContainer.style.transform = 'translateX(-50%)';
    this.chatContainer.style.cursor = 'grab';
    this.chatContainer.style.zIndex = '1000';
    this.chatContainer.style.userSelect = 'none';
    this.chatContainer.style.touchAction = 'none';

    // Store initial position
    const rect = this.chatContainer.getBoundingClientRect();
    this.currentX = rect.left;
    this.currentY = rect.top;

    // Add drag handle (the whole container)
    this.chatContainer.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.chatContainer.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });

    // Global move/up listeners
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', () => this.onMouseUp());

    console.log('[DraggableChatManager] Initialized');
  }

  /**
   * Mouse down - start drag
   */
  private onMouseDown(e: MouseEvent) {
    // Only drag with left button
    if (e.button !== 0) return;
    
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

    // Calculate new position in pixels
    const newX = e.clientX - this.dragOffsetX;
    const newY = e.clientY - this.dragOffsetY;

    // Clamp to screen bounds
    const maxX = window.innerWidth - this.chatContainer.offsetWidth;
    const maxY = window.innerHeight - this.chatContainer.offsetHeight;

    this.currentX = Math.max(0, Math.min(maxX, newX));
    this.currentY = Math.max(0, Math.min(maxY, newY));

    // Apply position directly (no transform during drag)
    this.chatContainer.style.left = `${this.currentX}px`;
    this.chatContainer.style.top = `${this.currentY}px`;
    this.chatContainer.style.bottom = 'auto';
    this.chatContainer.style.transform = 'none';
  }

  /**
   * Mouse up - stop drag
   */
  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.chatContainer!.style.cursor = 'grab';
      
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
    e.preventDefault();
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
    if (!this.isDragging || !this.chatContainer) return;

    e.preventDefault();

    const touch = e.touches[0];
    const newX = touch.clientX - this.dragOffsetX;
    const newY = touch.clientY - this.dragOffsetY;

    // Clamp to screen bounds
    const maxX = window.innerWidth - this.chatContainer.offsetWidth;
    const maxY = window.innerHeight - this.chatContainer.offsetHeight;

    this.currentX = Math.max(0, Math.min(maxX, newX));
    this.currentY = Math.max(0, Math.min(maxY, newY));

    this.chatContainer.style.left = `${this.currentX}px`;
    this.chatContainer.style.top = `${this.currentY}px`;
    this.chatContainer.style.bottom = 'auto';
    this.chatContainer.style.transform = 'none';
  }

  /**
   * Called when chat position is updated from server
   */
  private onChatPositionUpdated(x: number, y: number) {
    if (this.isDragging) return; // Don't update while dragging locally

    this.currentX = x;
    this.currentY = y;
    
    if (this.chatContainer) {
      this.chatContainer.style.left = `${this.currentX}px`;
      this.chatContainer.style.top = `${this.currentY}px`;
      this.chatContainer.style.bottom = 'auto';
      this.chatContainer.style.transform = 'none';
    }
    
    this.savePosition();
  }

  /**
   * Save position to localStorage
   */
  private savePosition() {
    localStorage.setItem('chatPosition', JSON.stringify({
      x: this.currentX,
      y: this.currentY,
      timestamp: Date.now()
    }));
  }

  /**
   * Load position from localStorage (unused - kept for future use)
   */
  private _loadPosition(): { x: number; y: number } | null {
    const saved = localStorage.getItem('chatPosition');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        // Check if position is still valid (screen might have changed)
        if (pos.x < window.innerWidth && pos.y < window.innerHeight) {
          return { x: pos.x, y: pos.y };
        }
      } catch (e) {
        console.error('[DraggableChatManager] Failed to load position');
      }
    }
    return null;
  }

  /**
   * Reset position to default (center bottom)
   */
  resetPosition() {
    if (this.chatContainer) {
      const rect = this.chatContainer.getBoundingClientRect();
      this.currentX = (window.innerWidth - rect.width) / 2;
      this.currentY = window.innerHeight - rect.height - 20;
      
      this.chatContainer.style.left = `${this.currentX}px`;
      this.chatContainer.style.top = `${this.currentY}px`;
      this.chatContainer.style.bottom = 'auto';
      this.chatContainer.style.transform = 'none';
      
      this.savePosition();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.chatContainer) {
      this.chatContainer.style.cursor = 'default';
      this.chatContainer.style.userSelect = 'auto';
    }
    console.log('[DraggableChatManager] Destroyed');
  }
}
