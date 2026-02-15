/**
 * BattleState.ts
 * Определение состояний битвы
 */

export type BattleState =
  | { type: 'idle' }
  | { type: 'preparing'; params: { [key: string]: number } }
  | { type: 'running'; startTime: number; tick: number }
  | { type: 'ended'; winner: 'A' | 'B' | 'draw' };

export const createIdleState = (): BattleState => ({ type: 'idle' });
export const createPreparingState = (params: { [key: string]: number }): BattleState => ({ 
  type: 'preparing', 
  params 
});
export const createRunningState = (startTime: number): BattleState => ({ 
  type: 'running', 
  startTime,
  tick: 0
});
export const createEndedState = (winner: 'A' | 'B' | 'draw'): BattleState => ({ 
  type: 'ended', 
  winner 
});