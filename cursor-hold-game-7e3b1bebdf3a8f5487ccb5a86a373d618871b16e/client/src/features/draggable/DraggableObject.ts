import * as PIXI from 'pixi.js';
import { NetworkManager } from '../../core/NetworkManager';

/**
 * Draggable Object in the center of the screen
 * Both players can grab and drag it
 * Synchronized over network via server
 */

export class DraggableObject {
  private graphics: PIXI.Graphics | null = null;
  private isDragging: boolean = false;
  private canDrag: boolean = false;
  private objectId: string = 'center-object';
  
  // Position
  private x: number = 0;
  private y: number = 0;
  private radius: number = 50;

  // Visual state - SEPARATE local and remote hover
  private localHover: boolean = false;           // Моя мышь над объектом
  private remoteHover: boolean = false;          // Мышь другого игрока над объектом
  private remoteHoverPlayer: string | null = null; // Кто именно навёл
  
  private dragColor: number = 0xffff00; // Yellow when dragging
  private idleColor: number = 0x00ffff; // Cyan when idle
  private hoverColor: number = 0xff00ff; // Magenta when I hover
  private remoteHoverColor: number = 0xff69b4; // Hot pink when remote player hovers

  constructor(
    private stage: PIXI.Container,
    private networkManager: NetworkManager
  ) {
    console.log('[DraggableObject] Created');
  }

  /**
   * Setup network listeners (call after room is joined)
   */
  setupNetworkListeners() {
    // Subscribe to server messages
    this.networkManager.onMessage('objectDragStarted', (data: { objectId: string; playerId: string }) => {
      if (data.objectId === this.objectId) {
        this.onDragStarted(data.playerId);
      }
    });

    this.networkManager.onMessage('objectPositionUpdated', (data: { objectId: string; x: number; y: number }) => {
      if (data.objectId === this.objectId) {
        this.onPositionUpdated(data.x, data.y);
      }
    });

    this.networkManager.onMessage('objectDragStopped', (data: { objectId: string; playerId: string }) => {
      if (data.objectId === this.objectId) {
        this.onDragStopped();
      }
    });

    // Subscribe to hover state changes
    this.networkManager.onMessage('objectHoverChanged', (data: {
      objectId: string;
      isHovered: boolean;
      hoveredBy?: string;
    }) => {
      if (data.objectId === this.objectId) {
        this.onHoverChanged(data.isHovered, data.hoveredBy);
      }
    });

    console.log('[DraggableObject] Network listeners setup complete');
  }

  /**
   * Initialize the draggable object (call after PixiJS init)
   */
  init(screenWidth: number, screenHeight: number) {
    // Start in center of screen
    this.x = screenWidth / 2;
    this.y = screenHeight / 2;

    // Create the graphics
    this.graphics = new PIXI.Graphics();
    this.drawObject();
    
    this.graphics.position.set(this.x, this.y);
    this.graphics.eventMode = 'static';
    this.graphics.cursor = 'grab';
    this.graphics.zIndex = 500;

    // Add interactivity
    this.graphics.on('pointerdown', (e) => this.onPointerDown(e));
    this.graphics.on('pointerup', () => this.onPointerUp());
    this.graphics.on('pointerupoutside', () => this.onPointerUp());
    this.graphics.on('pointermove', () => this.onPointerMove());
    this.graphics.on('pointerleave', () => this.onPointerLeave());

    this.stage.addChild(this.graphics);
    console.log('[DraggableObject] Initialized at center:', this.x, this.y);
  }

  /**
   * Draw the object (glowing orb)
   */
  private drawObject() {
    if (!this.graphics) return;

    this.graphics.clear();

    // Outer glow
    this.graphics.beginFill(this.getColor(), 0.3);
    this.graphics.drawCircle(0, 0, this.radius + 10);
    this.graphics.endFill();

    // Main circle
    this.graphics.beginFill(this.getColor(), 0.8);
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();

    // Border
    this.graphics.lineStyle(4, this.getColor(), 1);
    this.graphics.drawCircle(0, 0, this.radius);

    // Inner highlight
    this.graphics.beginFill(0xffffff, 0.5);
    this.graphics.drawCircle(-15, -15, this.radius / 3);
    this.graphics.endFill();

    // Label
    if (this.isDragging) {
      const text = new PIXI.Text('DRAGGING', {
        fontFamily: 'Courier New',
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      text.anchor.set(0.5);
      text.y = this.radius + 25;
      this.graphics.addChild(text);
    }
  }

  /**
   * Get current color based on state
   */
  private getColor(): number {
    if (this.isDragging) return this.dragColor;
    if (this.localHover) return this.hoverColor;        // Magenta — я навёл
    if (this.remoteHover) return this.remoteHoverColor; // Hot pink — другой навёл
    return this.idleColor;                              // Cyan — никто не навёл
  }

  /**
   * Pointer down - start dragging
   */
  private onPointerDown(_e: PIXI.FederatedPointerEvent) {
    // Only allow one player to drag at a time
    if (!this.canDrag) return;

    this.isDragging = true;
    this.graphics!.cursor = 'grabbing';
    
    // Start drag on server
    this.networkManager.sendToRoom('startDragObject', {
      objectId: this.objectId,
      startX: this.x,
      startY: this.y
    });

    // Bind mouse move to drag
    const onDragMove = (moveEvent: PIXI.FederatedPointerEvent) => {
      if (this.isDragging && this.graphics && this.graphics.parent) {
        const newPos = this.graphics.parent.toLocal(moveEvent.global);
        this.updatePosition(newPos.x, newPos.y);
      }
    };

    const stopDrag = () => {
      this.isDragging = false;
      if (this.graphics) {
        this.graphics.cursor = 'grab';
        this.graphics.eventMode = 'static';
      }
      
      // Stop drag on server
      this.networkManager.sendToRoom('stopDragObject', {
        objectId: this.objectId,
        endX: this.x,
        endY: this.y
      });
    };

    this.graphics!.on('pointermove', onDragMove);
    this.graphics!.once('pointerup', stopDrag);
    this.graphics!.once('pointerupoutside', stopDrag);
  }

  /**
   * Pointer up
   */
  private onPointerUp() {
    // Handled in onPointerDown
  }

  /**
   * Pointer move - hover effect (LOCAL only)
   */
  private onPointerMove() {
    if (!this.isDragging && !this.localHover) {
      this.localHover = true;
      this.drawObject();

      // Send hover state to server
      this.networkManager.sendToRoom('updateObjectHover', {
        objectId: this.objectId,
        isHovered: true
      });
    }
  }

  /**
   * Pointer leave - remove hover (LOCAL only)
   */
  private onPointerLeave() {
    if (this.localHover) {
      this.localHover = false;
      this.drawObject();

      // Send hover state to server
      this.networkManager.sendToRoom('updateObjectHover', {
        objectId: this.objectId,
        isHovered: false
      });
    }
  }

  /**
   * Update position (local + network)
   */
  private updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    
    if (this.graphics) {
      this.graphics.position.set(this.x, this.y);
      // Redraw to update color if dragging
      if (this.isDragging) {
        this.drawObject();
      }
    }

    // Send position update to server
    if (this.isDragging) {
      this.networkManager.sendToRoom('updateObjectPosition', {
        objectId: this.objectId,
        x: this.x,
        y: this.y
      });
    }
  }

  /**
   * Called when drag starts (from server)
   */
  private onDragStarted(playerId: string) {
    console.log('[DraggableObject] Drag started by:', playerId);
    // Disable dragging for other player
    this.canDrag = false;
  }

  /**
   * Called when position is updated (from server)
   */
  private onPositionUpdated(x: number, y: number) {
    this.x = x;
    this.y = y;
    
    if (this.graphics) {
      this.graphics.position.set(this.x, this.y);
    }
  }

  /**
   * Called when drag stops (from server)
   */
  private onDragStopped() {
    console.log('[DraggableObject] Drag stopped');
    this.isDragging = false;
    this.canDrag = true; // Allow dragging again
    
    if (this.graphics) {
      this.graphics.cursor = 'grab';
      this.drawObject();
    }
  }

  /**
   * Called when hover state changes (from server - REMOTE player)
   */
  private onHoverChanged(isHovered: boolean, hoveredBy?: string) {
    // Игнорируем свои собственные события
    const mySessionId = this.networkManager.getSessionId();
    if (hoveredBy === mySessionId) return;
    
    // Обновляем remote hover
    this.remoteHover = isHovered;
    this.remoteHoverPlayer = isHovered ? (hoveredBy || null) : null;
    
    console.log('[DraggableObject] Remote hover changed:', isHovered, 'by:', hoveredBy);
    
    if (this.graphics) {
      this.drawObject();
    }
  }

  /**
   * Enable/disable dragging
   */
  setDraggable(draggable: boolean) {
    this.canDrag = draggable;
    if (this.graphics) {
      this.graphics.eventMode = draggable ? 'static' : 'none';
      this.graphics.cursor = draggable ? 'grab' : 'default';
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.graphics) {
      this.stage.removeChild(this.graphics);
      this.graphics.destroy();
    }
    console.log('[DraggableObject] Destroyed');
  }
}
