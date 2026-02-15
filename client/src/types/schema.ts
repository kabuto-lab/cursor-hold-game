// Client-side type definitions that mirror the server schema
export interface PlayerSchema {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isHoldingHands: boolean;
  holdingHandsWith: string;
  isReady: boolean;
}

export interface DraggableObjectSchema {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  isBeingDragged: boolean;
  draggedBy: string;
}

export interface RoomState {
  players: Map<string, PlayerSchema>;
  objects: Map<string, DraggableObjectSchema>;
  roomId: string;
  maxPlayers: number;
}