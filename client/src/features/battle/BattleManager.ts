/**
 * BattleManager.ts
 * Управление состоянием битвы вирусов
 */

import { BattleState, createIdleState } from './BattleState';

export interface BattleCallbacks {
  onStateChanged?: (newState: BattleState) => void;
  onBattleStarted?: () => void;
  onBattleEnded?: (winner: 'A' | 'B' | 'draw') => void;
  onTick?: (tick: number) => void;
}

export class BattleManager {
  private state: BattleState = createIdleState();
  private callbacks: BattleCallbacks = {};
  private tickInterval: number | null = null;

  setState(newState: BattleState): void {
    const prevState = this.state;
    this.state = newState;

    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged(newState);
    }

    // Trigger specific callbacks based on state transitions
    if (prevState.type !== 'running' && newState.type === 'running') {
      if (this.callbacks.onBattleStarted) {
        this.callbacks.onBattleStarted();
      }
      this.startTicking();
    } else if (prevState.type === 'running' && newState.type !== 'running') {
      if (this.callbacks.onBattleEnded && newState.type === 'ended') {
        this.callbacks.onBattleEnded(newState.winner);
      }
      this.stopTicking();
    }
  }

  getState(): BattleState {
    return this.state;
  }

  startBattle(): void {
    const startTime = Date.now();
    this.setState({ type: 'running', startTime, tick: 0 });
  }

  endBattle(winner: 'A' | 'B' | 'draw'): void {
    this.setState({ type: 'ended', winner });
  }

  private startTicking(): void {
    if (this.tickInterval) return;

    this.tickInterval = window.setInterval(() => {
      if (this.state.type === 'running') {
        const newTick = this.state.tick + 1;
        this.setState({ 
          type: 'running', 
          startTime: this.state.startTime, 
          tick: newTick 
        });
        
        if (this.callbacks.onTick) {
          this.callbacks.onTick(newTick);
        }
      }
    }, 1000); // 1 second per tick
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  setCallbacks(callbacks: BattleCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  destroy(): void {
    this.stopTicking();
  }
}