// Client-side type definitions that mirror the server schema
export interface PlayerSchema {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isHoldingHands: boolean;
  holdingHandsWith: string;
}

export interface RoomState {
  players: Map<string, PlayerSchema>;
  roomId: string;
  maxPlayers: number;
}