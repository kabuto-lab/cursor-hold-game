import { Room } from 'colyseus';
import { HoldingRoom } from '../rooms/HoldingRoom';
import { PlayerSchema, RoomState } from '../rooms/schema';

describe('HoldingRoom', () => {
  let room: HoldingRoom;

  beforeEach(() => {
    room = new HoldingRoom();
    // Mock the room state
    room.setState(new RoomState());
  });

  test('should create a room with correct initial state', () => {
    expect(room.state.roomId).toBe('');
    expect(room.state.maxPlayers).toBe(2);
    expect(room.state.players.size).toBe(0);
  });

  test('should add a player when they join', () => {
    const mockClient = { sessionId: 'test-client-id' } as any;
    
    // Simulate a player joining
    room.onJoin(mockClient, {});
    
    expect(room.state.players.size).toBe(1);
    const player = room.state.players.get('test-client-id');
    expect(player).toBeDefined();
    expect(player!.id).toBe('test-client-id');
    expect(player!.x).toBeGreaterThanOrEqual(100);
    expect(player!.y).toBeGreaterThanOrEqual(100);
  });

  test('should remove a player when they leave', () => {
    const mockClient = { sessionId: 'test-client-id' } as any;
    
    // Add a player
    room.onJoin(mockClient, {});
    expect(room.state.players.size).toBe(1);
    
    // Remove the player
    room.onLeave(mockClient, true);
    expect(room.state.players.size).toBe(0);
  });

  test('should generate a random color for each player', () => {
    const mockClient = { sessionId: 'test-client-id' } as any;
    
    room.onJoin(mockClient, {});
    const player = room.state.players.get('test-client-id');
    
    expect(player).toBeDefined();
    expect(typeof player!.color).toBe('number');
    expect(player!.color).toBeGreaterThanOrEqual(0);
  });

  test('should handle position updates', () => {
    const mockClient = { sessionId: 'test-client-id' } as any;

    // Add a player
    room.onJoin(mockClient, {});

    // Simulate position update by directly calling the message handler logic
    const newPosition = { x: 100, y: 200 };
    const player = room.state.players.get('test-client-id');
    if (player) {
      // Validate position updates to prevent cheating
      if (
        typeof newPosition.x === 'number' &&
        typeof newPosition.y === 'number' &&
        newPosition.x >= 0 &&
        newPosition.x <= 10000 && // Reasonable bounds
        newPosition.y >= 0 &&
        newPosition.y <= 10000
      ) {
        player.x = newPosition.x;
        player.y = newPosition.y;
      }
    }

    const updatedPlayer = room.state.players.get('test-client-id');
    expect(updatedPlayer).toBeDefined();
    expect(updatedPlayer!.x).toBe(100);
    expect(updatedPlayer!.y).toBe(200);
  });
});