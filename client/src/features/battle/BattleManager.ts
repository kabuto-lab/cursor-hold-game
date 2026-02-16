/**
 * BattleManager.ts
 * Manages battle state machine: idle | preparing | running | ended
 */

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
  | { type: 'ended'; winner: 'A' | 'B' | 'draw' };

export interface BattleEvents {
  onStateChanged?: (newState: BattleState) => void;
  onBattleStarted?: () => void;
  onBattleEnded?: (winner: 'A' | 'B' | 'draw') => void;
}

export class BattleManager {
  private state: BattleState = { type: 'idle' };
  private events: BattleEvents = {};

  constructor(events: BattleEvents = {}) {
    this.events = events;
  }

  setEvents(events: BattleEvents): void {
    this.events = events;
  }

  getState(): BattleState {
    return this.state;
  }

  setState(newState: BattleState): void {
    const prevState = this.state;
    this.state = newState;

    if (this.events.onStateChanged) {
      this.events.onStateChanged(newState);
    }

    // Trigger specific events based on state transitions
    if (prevState.type !== newState.type) {
      if (newState.type === 'running' && prevState.type === 'preparing' && this.events.onBattleStarted) {
        this.events.onBattleStarted();
      }
      
      if (newState.type === 'ended' && this.events.onBattleEnded) {
        this.events.onBattleEnded(newState.winner);
      }
    }
  }

  startPreparation(params: VirusParams): void {
    this.setState({
      type: 'preparing',
      params,
      startTime: Date.now()
    });
  }

  startBattle(): void {
    if (this.state.type === 'preparing') {
      this.setState({
        type: 'running',
        startTime: Date.now()
      });
    }
  }

  endBattle(winner: 'A' | 'B' | 'draw'): void {
    this.setState({
      type: 'ended',
      winner
    });
  }

  reset(): void {
    this.setState({ type: 'idle' });
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

  getParams(): VirusParams | null {
    if (this.state.type === 'preparing') {
      return this.state.params;
    }
    return null;
  }

  destroy(): void {
    this.state = { type: 'idle' };
    this.events = {};
  }
}