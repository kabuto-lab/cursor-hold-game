import { Room, Client } from 'colyseus';
import { RoomState, PlayerSchema, DraggableObjectSchema } from './schema';

export class HoldingRoom extends Room<RoomState> {
  private holdTimeout: NodeJS.Timeout | null = null;

  onCreate(options: any) {
    this.setState(new RoomState());
    this.state.roomId = options.roomId || this.roomId;
    this.state.maxPlayers = 2;

    // Add a default draggable circle object
    const circleObject = new DraggableObjectSchema();
    circleObject.id = 'circle1';
    circleObject.x = 400;
    circleObject.y = 300;
    circleObject.radius = 30;
    circleObject.color = 0xff69b4; // Hot pink color
    this.state.objects.set(circleObject.id, circleObject);

    // Handle incoming messages using the modern messages object
    this.onMessage('updatePosition', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        // Validate position updates to prevent cheating
        if (
          typeof data.x === 'number' &&
          typeof data.y === 'number' &&
          data.x >= 0 &&
          data.x <= 10000 && // Reasonable bounds
          data.y >= 0 &&
          data.y <= 10000
        ) {
          player.x = data.x;
          player.y = data.y;
        }
      }
    });

    this.onMessage('setPlayerName', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof data.name === 'string' && data.name.length <= 20) {
        player.name = data.name;
        // Broadcast name update to all clients
        this.broadcast('playerNameUpdated', {
          playerId: client.sessionId,
          name: data.name
        });
      }
    });

    this.onMessage('requestHoldHands', (client, data) => {
      const requestingPlayer = this.state.players.get(client.sessionId);
      const targetPlayer = this.state.players.get(data.targetPlayerId);

      if (!requestingPlayer || !targetPlayer) return;

      // Check if both players are in the same room
      if (this.state.players.has(client.sessionId) && this.state.players.has(data.targetPlayerId)) {
        // Start holding hands
        requestingPlayer.isHoldingHands = true;
        requestingPlayer.holdingHandsWith = data.targetPlayerId;
        targetPlayer.isHoldingHands = true;
        targetPlayer.holdingHandsWith = client.sessionId;

        // Broadcast to all clients that these players are now holding hands
        this.broadcast('holdHands', {
          player1Id: client.sessionId,
          player2Id: data.targetPlayerId
        });
      }
    });

    this.onMessage('releaseHands', (client) => {
      const releasingPlayer = this.state.players.get(client.sessionId);
      if (!releasingPlayer || !releasingPlayer.isHoldingHands) return;

      const otherPlayerId = releasingPlayer.holdingHandsWith;
      const otherPlayer = this.state.players.get(otherPlayerId);

      // Release hold for both players
      releasingPlayer.isHoldingHands = false;
      releasingPlayer.holdingHandsWith = '';

      if (otherPlayer) {
        otherPlayer.isHoldingHands = false;
        otherPlayer.holdingHandsWith = '';
      }

      // Broadcast to all clients that the hold has been released
      this.broadcast('releaseHands', {
        player1Id: client.sessionId,
        player2Id: otherPlayerId
      });
    });

    // Handle draggable object messages
    this.onMessage('startDraggingObject', (client, data) => {
      const obj = this.state.objects.get(data.objectId);
      if (obj) {
        obj.isBeingDragged = true;
        obj.draggedBy = client.sessionId;
        
        // Broadcast to all clients that an object is being dragged
        this.broadcast('objectDragStarted', {
          objectId: data.objectId,
          playerId: client.sessionId
        });
      }
    });

    this.onMessage('updateObjectPosition', (client, data) => {
      const obj = this.state.objects.get(data.objectId);
      if (obj && obj.isBeingDragged && obj.draggedBy === client.sessionId) {
        // Validate position updates to prevent cheating
        if (
          typeof data.x === 'number' &&
          typeof data.y === 'number' &&
          data.x >= 0 &&
          data.x <= 10000 && // Reasonable bounds
          data.y >= 0 &&
          data.y <= 10000
        ) {
          obj.x = data.x;
          obj.y = data.y;
          
          // Broadcast the position update to all clients
          this.broadcast('objectPositionUpdated', {
            objectId: data.objectId,
            x: data.x,
            y: data.y
          });
        }
      }
    });

    this.onMessage('stopDraggingObject', (client, data) => {
      const obj = this.state.objects.get(data.objectId);
      if (obj && obj.draggedBy === client.sessionId) {
        obj.isBeingDragged = false;
        obj.draggedBy = '';
        
        // Broadcast to all clients that dragging has stopped
        this.broadcast('objectDragStopped', {
          objectId: data.objectId,
          playerId: client.sessionId
        });
      }
    });
  }

  onActivate() {
    // Set up automatic room cleanup when empty
    this.setSimulationInterval((deltaTime) => {
      if (this.clients.length === 0) {
        if (this.holdTimeout) clearTimeout(this.holdTimeout);
        this.holdTimeout = setTimeout(() => {
          if (this.clients.length === 0) {
            this.disconnect();
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        if (this.holdTimeout) {
          clearTimeout(this.holdTimeout);
          this.holdTimeout = null;
        }
      }
    });
  }

  onJoin(client: Client, options: any) {
    // Check if room is full
    if (this.clients.length > this.state.maxPlayers) {
      client.leave(4000); // Custom close code for "room full"
      return;
    }

    // Create a new player
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = `Player${client.sessionId.substring(0, 4)}`;
    player.x = Math.random() * 400 + 100; // Random starting position
    player.y = Math.random() * 300 + 100;
    player.color = this.generateRandomColor(); // Assign a random color
    
    // Add player to state
    this.state.players.set(client.sessionId, player);
    
    console.log(`${client.sessionId} joined room ${this.roomId}`);
  }

  onLeave(client: Client, consented: boolean) {
    // Remove player from state
    this.state.players.delete(client.sessionId);
    
    // If player was holding hands, release the hold
    this.releaseHoldsForPlayer(client.sessionId);
    
    console.log(`${client.sessionId} left room ${this.roomId}`);
  }

  onDispose() {
    console.log(`Disposing room ${this.roomId}`);
    if (this.holdTimeout) clearTimeout(this.holdTimeout);
  }

  private generateRandomColor(): number {
    // Generate a random bright color (avoiding too dark colors)
    const r = Math.floor(Math.random() * 128) + 127; // 127-255
    const g = Math.floor(Math.random() * 128) + 127;
    const b = Math.floor(Math.random() * 128) + 127;
    return (r << 16) + (g << 8) + b;
  }

  private releaseHoldsForPlayer(playerId: string) {
    const player = this.state.players.get(playerId);
    if (player && player.isHoldingHands) {
      const otherPlayerId = player.holdingHandsWith;
      const otherPlayer = this.state.players.get(otherPlayerId);
      
      // Release hold for both players
      player.isHoldingHands = false;
      player.holdingHandsWith = '';
      
      if (otherPlayer) {
        otherPlayer.isHoldingHands = false;
        otherPlayer.holdingHandsWith = '';
        
        // Broadcast to all clients that the hold has been released
        this.broadcast('releaseHands', {
          player1Id: playerId,
          player2Id: otherPlayerId
        });
      }
    }
  }
}