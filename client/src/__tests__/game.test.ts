import { Game } from '../game';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    // Mock the DOM elements that the game expects
    document.body.innerHTML = `
      <div id="landingScreen"></div>
      <div id="gameScreen" class="hidden">
        <div id="hud">
          <div id="playerInfo">
            <span class="connection-status connected" id="connectionStatus"></span>
            <span id="playerName">Player 1</span> | 
            <span id="otherPlayerName">Player 2</span>
          </div>
          <div id="roomInfo">Room: <span id="currentRoomId"></span></div>
          <button id="leaveRoomBtn">LEAVE ROOM</button>
        </div>
        <div id="canvasContainer"></div>
      </div>
    `;

    game = new Game();
  });

  test('should initialize without errors', () => {
    // This test verifies that the game can be instantiated without errors
    expect(game).toBeDefined();
  });

  test('should generate a room ID', () => {
    const roomId = game['generateRoomId']();
    expect(roomId).toMatch(/^[A-Z0-9]{6}$/); // 6 character uppercase alphanumeric
  });

  test('should toggle hold hands state', () => {
    // Mock the room property
    game['room'] = {
      send: jest.fn()
    } as any;

    // Initially not holding hands
    expect(game['isHoldingHands']()).toBe(false);

    // Toggle to hold hands
    game['toggleHoldHands']();
    
    // Still not holding hands since there's no other player
    expect(game['isHoldingHands']()).toBe(false);
  });
});