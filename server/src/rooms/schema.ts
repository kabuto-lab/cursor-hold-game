import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  @type('string') id!: string;
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') color: number = 0xffffff; // Default white color
  @type('boolean') isHoldingHands: boolean = false;
  @type('string') holdingHandsWith: string = ''; // ID of player this player is holding hands with
}

export class RoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type('string') roomId: string = '';
  @type('number') maxPlayers: number = 2;
}