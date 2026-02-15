/**
 * GameStateManager.ts
 * Управление состоянием игры
 */

import { PlayerSchema, DraggableObjectSchema } from './types/schema';

export interface VirusParams {
  aggression: number;
  mutation: number;
  speed: number;
  defense: number;
  reproduction: number;
  stealth: number;
  virulence: number;
  resilience: number;
  mobility: number;
  intellect: number;
  contagiousness: number;
  lethality: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  VIRUS_BATTLE = 'VIRUS_BATTLE',
  DISCONNECTED = 'DISCONNECTED'
}

export class GameStateManager {
  private state: GameState = GameState.LOBBY;
  private players: Map<string, PlayerSchema> = new Map();
  private objects: Map<string, DraggableObjectSchema> = new Map();
  private currentPlayerId: string | null = null;
  private isPlayerReady: boolean = false;
  private totalPoints: number = 12;
  private paramValues: { [key: string]: number } = {};
  private serverBattleGrid: number[] = [];
  private battleRunning: boolean = false;

  constructor() {
    // Инициализируем параметры вируса
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];
    
    paramNames.forEach(param => {
      this.paramValues[param] = 0;
    });
  }

  // Геттеры
  get currentState(): GameState {
    return this.state;
  }

  get allPlayers(): Map<string, PlayerSchema> {
    return this.players;
  }

  get allObjects(): Map<string, DraggableObjectSchema> {
    return this.objects;
  }

  get currentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  get isReady(): boolean {
    return this.isPlayerReady;
  }

  get pointsRemaining(): number {
    return this.totalPoints;
  }

  get paramValues(): { [key: string]: number } {
    return this.paramValues;
  }

  get battleGrid(): number[] {
    return this.serverBattleGrid;
  }

  get battleActive(): boolean {
    return this.battleRunning;
  }

  // Сеттеры
  setState(newState: GameState): void {
    this.state = newState;
  }

  setCurrentPlayerId(playerId: string): void {
    this.currentPlayerId = playerId;
  }

  setPlayerReady(isReady: boolean): void {
    this.isPlayerReady = isReady;
  }

  addPlayer(playerId: string, player: PlayerSchema): void {
    this.players.set(playerId, player);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  updatePlayer(playerId: string, player: PlayerSchema): void {
    if (this.players.has(playerId)) {
      this.players.set(playerId, player);
    }
  }

  addObject(objectId: string, obj: DraggableObjectSchema): void {
    this.objects.set(objectId, obj);
  }

  removeObject(objectId: string): void {
    this.objects.delete(objectId);
  }

  updateObject(objectId: string, obj: DraggableObjectSchema): void {
    if (this.objects.has(objectId)) {
      this.objects.set(objectId, obj);
    }
  }

  increaseParameter(param: string): boolean {
    if (this.paramValues[param] < 12 && this.totalPoints > 0) {
      this.paramValues[param]++;
      this.totalPoints--;
      return true;
    }
    return false;
  }

  decreaseParameter(param: string): boolean {
    if (this.paramValues[param] > 0) {
      this.paramValues[param]--;
      this.totalPoints++;
      return true;
    }
    return false;
  }

  setBattleGrid(battleGrid: number[]): void {
    this.serverBattleGrid = [...battleGrid];
  }

  setBattleActive(active: boolean): void {
    this.battleRunning = active;
  }

  resetParams(): void {
    const paramNames = Object.keys(this.paramValues);
    paramNames.forEach(param => {
      this.paramValues[param] = 0;
    });
    this.totalPoints = 12;
  }

  randomizeParams(): void {
    this.resetParams();
    
    let pointsToDistribute = 12;
    const paramNames = Object.keys(this.paramValues);
    
    while (pointsToDistribute > 0) {
      const randomParam = paramNames[Math.floor(Math.random() * paramNames.length)];
      if (this.paramValues[randomParam] < 12) {
        this.paramValues[randomParam]++;
        pointsToDistribute--;
      }
    }
  }

  getParamValue(param: string): number {
    return this.paramValues[param] || 0;
  }
}