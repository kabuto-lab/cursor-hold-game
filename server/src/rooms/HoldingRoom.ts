import { Room, Client } from 'colyseus';
import { RoomState, PlayerSchema, DraggableObjectSchema } from './schema';

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

    // Handle chat messages
    this.onMessage('chatMessage', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof data.message === 'string' && data.message.trim().length > 0) {
        // Limit message length
        const message = data.message.trim().substring(0, 200);
        
        // Broadcast the chat message to all players in the room
        this.broadcast('chatMessage', {
          playerId: client.sessionId,
          playerName: player.name,
          message: message,
          timestamp: Date.now()
        });
      }
    });

    // Handle ball creation
    this.onMessage('createBall', (client, data) => {
      // Validate the data
      if (
        typeof data.id === 'string' &&
        typeof data.x === 'number' &&
        typeof data.y === 'number' &&
        typeof data.radius === 'number' &&
        typeof data.color === 'number'
      ) {
        // Create a new ball object
        const ball = new DraggableObjectSchema();
        ball.id = data.id;
        ball.x = data.x;
        ball.y = data.y;
        ball.radius = data.radius;
        ball.color = data.color;
        ball.isBeingDragged = false;
        ball.draggedBy = '';
        ball.isFollower = false;

        // Add the ball to the room state
        this.state.objects.set(ball.id, ball);

        // Broadcast to all clients that a new ball has been created
        this.broadcast('ballCreated', {
          id: ball.id,
          x: ball.x,
          y: ball.y,
          radius: ball.radius,
          color: ball.color
        });
      }
    });

    // Handle follower creation
    this.onMessage('createFollower', (client, data) => {
      // Validate the data
      if (
        typeof data.id === 'string' &&
        typeof data.x === 'number' &&
        typeof data.y === 'number' &&
        typeof data.radius === 'number' &&
        typeof data.color === 'number' &&
        typeof data.owner === 'string'
      ) {
        // Create a new follower object
        const follower = new DraggableObjectSchema();
        follower.id = data.id;
        follower.x = data.x;
        follower.y = data.y;
        follower.radius = data.radius;
        follower.color = data.color;
        follower.isBeingDragged = false;
        follower.draggedBy = '';
        follower.isFollower = true;
        follower.owner = data.owner;
        follower.targetX = data.x; // Initially same as position
        follower.targetY = data.y;

        // Add the follower to the room state
        this.state.objects.set(follower.id, follower);

        // Broadcast to all clients that a new follower has been created
        this.broadcast('followerCreated', {
          id: follower.id,
          x: follower.x,
          y: follower.y,
          radius: follower.radius,
          color: follower.color,
          owner: follower.owner
        });
      }
    });

    // Handle follower target updates
    this.onMessage('updateFollowerTarget', (client, data) => {
      const follower = this.state.objects.get(data.id);
      if (follower && follower.isFollower && follower.owner === client.sessionId) {
        // Validate the data
        if (
          typeof data.id === 'string' &&
          typeof data.x === 'number' &&
          typeof data.y === 'number'
        ) {
          // Update the follower's target position
          follower.targetX = data.x;
          follower.targetY = data.y;

          // Broadcast to all clients that a follower's target has been updated
          this.broadcast('followerTargetUpdated', {
            id: data.id,
            x: data.x,
            y: data.y
          });
        }
      }
    });

    // Handle player circle creation
    this.onMessage('createPlayerCircle', (client, data) => {
      // Validate the data
      if (
        typeof data.id === 'string' &&
        typeof data.x === 'number' &&
        typeof data.y === 'number' &&
        typeof data.radius === 'number' &&
        typeof data.color === 'number' &&
        typeof data.owner === 'string'
      ) {
        // Check if player already has a circle
        let playerHasCircle = false;
        for (const [id, obj] of this.state.objects) {
          if (obj.isFollower && obj.owner === client.sessionId) {
            playerHasCircle = true;
            break;
          }
        }

        if (!playerHasCircle) {
          // Create a new player circle object
          const circle = new DraggableObjectSchema();
          circle.id = data.id;
          circle.x = data.x;
          circle.y = data.y;
          circle.radius = data.radius;
          circle.color = data.color;
          circle.isBeingDragged = false;
          circle.draggedBy = '';
          circle.isFollower = true; // Use follower property to identify player circles
          circle.owner = data.owner;
          circle.targetX = data.x; // Initially same as position
          circle.targetY = data.y;

          // Add the circle to the room state
          this.state.objects.set(circle.id, circle);

          // Broadcast to all clients that a new player circle has been created
          this.broadcast('playerCircleCreated', {
            id: circle.id,
            x: circle.x,
            y: circle.y,
            radius: circle.radius,
            color: circle.color,
            owner: circle.owner
          });
        }
      }
    });

    // Handle virus parameter updates
    this.onMessage('updateVirusParams', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.params) {
        // Validate and update virus parameters
        // In a real implementation, you would validate the parameters here
        
        // Broadcast the updated parameters to all players in the room
        this.broadcast('virusParamsUpdated', {
          playerId: client.sessionId,
          params: data.params
        });
      }
    });

    // Handle ready status toggling
    this.onMessage('toggleReady', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof data.isReady === 'boolean') {
        // Update player's ready status
        player.isReady = data.isReady;

        // Broadcast the ready status to all players in the room
        this.broadcast('playerReadyStatus', {
          playerId: client.sessionId,
          isReady: data.isReady
        });

        // Check if all players are ready to start the virus battle
        const allPlayersReady = Array.from(this.state.players.values()).every(p => p.isReady);
        if (allPlayersReady && this.state.players.size === 2) {
          // Start the virus battle simulation
          this.startVirusBattle();
        }
      }
    });

    // Handle virus parameter updates
    this.onMessage('updateVirusParams', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.params) {
        // Validate and update virus parameters
        // In a real implementation, you would validate the parameters here
        player.virusParams = data.params;

        // Broadcast the updated parameters to all players in the room
        this.broadcast('virusParamsUpdated', {
          playerId: client.sessionId,
          params: data.params
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

  private startVirusBattle(): void {
    console.log('Starting virus battle!');
    
    // Initialize the virus battle state
    // For now, we'll just broadcast a message to indicate the battle has started
    
    // In the future, this would:
    // 1. Set up the battle grid state
    // 2. Initialize virus positions (red at top, blue at bottom)
    // 3. Start the tick-based simulation
    // 4. Handle the spread mechanics based on player parameters
    
    this.broadcast('virusBattleStarted', {
      message: 'Virus battle has started!',
      timestamp: Date.now()
    });
    
    // Start the battle simulation loop
    this.startBattleSimulation();
  }

  private startBattleSimulation(): void {
    // This would implement the tick-based virus spread simulation
    // For now, we'll just simulate a basic tick
    
    let tickCount = 0;
    const battleInterval = setInterval(() => {
      // Update virus positions based on parameters
      this.updateVirusSpread();
      
      // Check win conditions
      if (this.checkWinConditions()) {
        clearInterval(battleInterval);
        this.endVirusBattle();
      }
      
      tickCount++;
      
      // Stop after 100 ticks for demo purposes
      if (tickCount > 100) {
        clearInterval(battleInterval);
        this.endVirusBattle();
      }
    }, 1000); // 1 second per tick for now
  }

  private updateVirusSpread(): void {
    // This would implement the actual virus spread logic based on parameters
    // For now, we'll just broadcast a tick update
    
    this.broadcast('virusTick', {
      tick: Date.now(),
      message: 'Virus spreading...'
    });
  }

  private checkWinConditions(): boolean {
    // This would check if one virus has taken over the grid or met other win conditions
    // For now, we'll return false to continue the simulation
    return false;
  }

  private endVirusBattle(): void {
    console.log('Virus battle ended!');
    
    // Broadcast the end of the battle
    this.broadcast('virusBattleEnded', {
      message: 'Virus battle has ended!',
      timestamp: Date.now()
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
    player.isRoomCreator = this.state.players.size === 0; // First player is the room creator

    // Initialize virus parameters to default values
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];
    
    paramNames.forEach(param => {
      player.virusParams.set(param, 0);
    });

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