/**
 * GameStateManager - управляет состоянием игры
 * Отделяет бизнес-логику от визуализации и сетевого кода
 */

import { PlayerSchema, DraggableObjectSchema } from './types/schema';

export enum GameState {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  VIRUS_BATTLE = 'VIRUS_BATTLE',
  DISCONNECTED = 'DISCONNECTED'
}

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

export class GameStateManager {
  private _state: GameState = GameState.LOBBY;
  private _players: Map<string, PlayerSchema> = new Map();
  private _objects: Map<string, DraggableObjectSchema> = new Map();
  private _currentPlayerId: string | null = null;
  private _isPlayerReady: boolean = false;
  private _totalPoints: number = 12;
  private _paramValues: { [key: string]: number } = {};
  private _serverBattleGrid: number[] = [];
  private _battleRunning: boolean = false;
  
  constructor() {
    // Инициализируем параметры вируса
    const paramNames = [
      'aggression', 'mutation', 'speed', 'defense', 
      'reproduction', 'stealth', 'virulence', 'resilience', 
      'mobility', 'intellect', 'contagiousness', 'lethality'
    ];
    
    paramNames.forEach(param => {
      this._paramValues[param] = 0;
    });
  }

  // Геттеры
  get state(): GameState {
    return this._state;
  }

  get players(): Map<string, PlayerSchema> {
    return this._players;
  }

  get objects(): Map<string, DraggableObjectSchema> {
    return this._objects;
  }

  get currentPlayerId(): string | null {
    return this._currentPlayerId;
  }

  get isPlayerReady(): boolean {
    return this._isPlayerReady;
  }

  get totalPoints(): number {
    return this._totalPoints;
  }

  get paramValues(): { [key: string]: number } {
    return this._paramValues;
  }

  get serverBattleGrid(): number[] {
    return this._serverBattleGrid;
  }

  get battleRunning(): boolean {
    return this._battleRunning;
  }

  // Сеттеры
  setState(newState: GameState): void {
    this._state = newState;
  }

  setCurrentPlayerId(playerId: string): void {
    this._currentPlayerId = playerId;
  }

  setPlayerReady(isReady: boolean): void {
    this._isPlayerReady = isReady;
  }

  addPlayer(playerId: string, player: PlayerSchema): void {
    this._players.set(playerId, player);
  }

  removePlayer(playerId: string): void {
    this._players.delete(playerId);
  }

  updatePlayer(playerId: string, player: PlayerSchema): void {
    if (this._players.has(playerId)) {
      this._players.set(playerId, player);
    }
  }

  addObject(objectId: string, obj: DraggableObjectSchema): void {
    this._objects.set(objectId, obj);
  }

  removeObject(objectId: string): void {
    this._objects.delete(objectId);
  }

  updateObject(objectId: string, obj: DraggableObjectSchema): void {
    if (this._objects.has(objectId)) {
      this._objects.set(objectId, obj);
    }
  }

  increaseParameter(param: string): boolean {
    if (this._paramValues[param] < 12 && this._totalPoints > 0) {
      this._paramValues[param]++;
      this._totalPoints--;
      return true;
    }
    return false;
  }

  decreaseParameter(param: string): boolean {
    if (this._paramValues[param] > 0) {
      this._paramValues[param]--;
      this._totalPoints++;
      return true;
    }
    return false;
  }

  setBattleGrid(battleGrid: number[]): void {
    this._serverBattleGrid = [...battleGrid];
  }

  setBattleRunning(running: boolean): void {
    this._battleRunning = running;
  }

  resetParams(): void {
    const paramNames = Object.keys(this._paramValues);
    paramNames.forEach(param => {
      this._paramValues[param] = 0;
    });
    this._totalPoints = 12;
  }

  randomizeParams(): void {
    this.resetParams();
    
    let pointsToDistribute = 12;
    const paramNames = Object.keys(this._paramValues);
    
    while (pointsToDistribute > 0) {
      const randomParam = paramNames[Math.floor(Math.random() * paramNames.length)];
      if (this._paramValues[randomParam] < 12) {
        this._paramValues[randomParam]++;
        pointsToDistribute--;
      }
    }
  }
}