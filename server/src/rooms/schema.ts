import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string') id!: string;
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') color: number = 0xffffff; // Default white color
  @type('boolean') isHoldingHands: boolean = false;
  @type('string') holdingHandsWith: string = ''; // ID of player this player is holding hands with
  @type('boolean') isRoomCreator: boolean = false; // Whether this player created the room
  @type('boolean') isReady: boolean = false; // Whether the player is ready to start the virus battle
  @type({ map: 'number' }) virusParams: Map<string, number> = new Map<string, number>(); // Virus parameters for the player
  @type('number') cursorX: number = 0; // Cursor X position for the player
  @type('number') cursorY: number = 0; // Cursor Y position for the player
}

export class DraggableObjectSchema extends Schema {
  @type('string') id!: string;
  @type('number') x: number = 400; // Center of screen
  @type('number') y: number = 300;
  @type('number') radius: number = 30;
  @type('number') color: number = 0xff69b4; // Hot pink color
  @type('boolean') isBeingDragged: boolean = false;
  @type('string') draggedBy: string = ''; // ID of player dragging the object
  @type('boolean') isFollower: boolean = false; // Whether this object is a follower
  @type('string') owner: string = ''; // ID of the player who owns this follower
  @type('number') targetX: number = 0; // Target position for followers
  @type('number') targetY: number = 0; // Target position for followers
  @type('boolean') isHovered: boolean = false; // Whether the object is currently hovered
  @type('string') hoveredBy: string = ''; // ID of player who is hovering the object
}

export class RoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: DraggableObjectSchema }) objects = new MapSchema<DraggableObjectSchema>();
  @type('string') roomId: string = '';
  @type('number') maxPlayers: number = 2;
  @type({ array: 'number' }) battleGrid: number[] = []; // Array representing the battle grid state (0=empty, 1=virusA, 2=virusB)
  @type('boolean') battleActive: boolean = false; // Whether the battle is currently active
}