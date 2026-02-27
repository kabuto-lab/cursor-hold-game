// BattleManager.ts - state machine
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

export type BattleState =
  | { type: 'idle' }
  | { type: 'preparing'; params: VirusParams; startTime: number }
  | { type: 'running'; startTime: number }
  | { type: 'ended'; winner: 'A' | 'B' };

export class BattleManager {
  private state: BattleState = { type: 'idle' };

  getState(): BattleState {
    return this.state;
  }

  setState(newState: BattleState): void {
    this.state = newState;
  }

  isIdle(): boolean {
    return this.state.type === 'idle';
  }

  isPreparing(): boolean {
    return this.state.type === 'preparing';
  }

  isRunning(): boolean {
    return this.state.type === 'running';
  }

  isEnded(): boolean {
    return this.state.type === 'ended';
  }
}