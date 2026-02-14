import { Room, Client } from 'colyseus';
import { RoomState, PlayerSchema } from './schema';

export class HoldingRoom extends Room<RoomState> {
  private holdTimeout: NodeJS.Timeout | null = null;

  onCreate(options: any) {
    this.setState(new RoomState());
    this.state.roomId = options.roomId || this.roomId;
    this.state.maxPlayers = 2;

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