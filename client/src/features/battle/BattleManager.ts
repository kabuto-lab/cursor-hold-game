/**
 * BattleManager — управляет состоянием битвы вирусов
 * 
 * Механика:
 * - 0 = пустая клетка
 * - 1 = вирус A (красный)
 * - 2 = вирус B (синий)
 * - Распространение 2 раза в секунду (каждые 500ms)
 * - Захват соседних клеток в зависимости от параметров
 */

export type BattleStateType = 'idle' | 'preparing' | 'running' | 'ended';

export type BattleState =
  | { type: 'idle' }
  | { type: 'preparing'; startTime: number }
  | { type: 'running'; startTime: number; tick: number }
  | { type: 'ended'; winner: 'A' | 'B' | 'draw'; virusACount: number; virusBCount: number };

export interface BattleGridData {
  grid: number[];
  width: number;
  height: number;
}

export interface VirusParams {
  aggression: number;      // ⚔️ Сила атаки
  mutation: number;        // 🧬 Шанс мутации
  speed: number;           // ⚡ Скорость распространения
  defense: number;         // 🛡️ Защита от захвата
  reproduction: number;    // 🦠 Размножение
  stealth: number;         // 👻 Скрытность
  virulence: number;       // ☣️ Разрушение
  resilience: number;      // 💪 Выживание
  mobility: number;        // 🚶 Передвижение
  intellect: number;       // 🧠 Стратегия
  contagiousness: number;  // 🫁 Заражение
  lethality: number;       // 💀 Смертельность
}

export class BattleManager {
  private state: BattleState = { type: 'idle' };
  private gridData: BattleGridData | null = null;
  private onStateChangeCallback?: (state: BattleState) => void;
  private onGridUpdateCallback?: (grid: number[]) => void;
  
  // Параметры вирусов
  private paramsA: VirusParams | null = null;
  private paramsB: VirusParams | null = null;
  
  // Таймер распространения
  private spreadInterval: number | null = null;
  private readonly SPREAD_INTERVAL_MS = 500; // 2 раза в секунду

  constructor() {
    console.log('[BattleManager] Created');
  }

  /**
   * Получить текущее состояние
   */
  getState(): BattleState {
    return this.state;
  }

  /**
   * Получить данные сетки
   */
  getGridData(): BattleGridData | null {
    return this.gridData;
  }

  /**
   * Установить параметры вируса A
   */
  setParamsA(params: VirusParams): void {
    this.paramsA = params;
    console.log('[BattleManager] Params A set:', params);
  }

  /**
   * Установить параметры вируса B
   */
  setParamsB(params: VirusParams): void {
    this.paramsB = params;
    console.log('[BattleManager] Params B set:', params);
  }

  /**
   * Установить callback при изменении состояния
   */
  setOnStateChange(callback: (state: BattleState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Установить callback при обновлении сетки
   */
  setOnGridUpdate(callback: (grid: number[]) => void): void {
    this.onGridUpdateCallback = callback;
  }

  /**
   * Запустить битву
   */
  startBattle(grid: number[], width: number, height: number): void {
    console.log('[BattleManager] Starting battle');

    this.gridData = {
      grid: [...grid],
      width,
      height
    };

    this.state = {
      type: 'running',
      startTime: Date.now(),
      tick: 0
    };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }

    if (this.onGridUpdateCallback && this.gridData) {
      this.onGridUpdateCallback(this.gridData.grid);
    }

    // Запускаем цикл распространения
    this.startSpreadCycle();
  }

  /**
   * Запустить цикл распространения (2 раза в секунду)
   */
  private startSpreadCycle(): void {
    if (this.spreadInterval) {
      clearInterval(this.spreadInterval);
    }

    this.spreadInterval = window.setInterval(() => {
      this.spreadTick();
    }, this.SPREAD_INTERVAL_MS);

    console.log('[BattleManager] Spread cycle started (500ms interval)');
  }

  /**
   * Тик распространения
   */
  private spreadTick(): void {
    if (!this.gridData || this.state.type !== 'running') return;

    const newGrid = [...this.gridData.grid];
    const { width, height } = this.gridData;

    // Проходим по всем клеткам
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cell = this.gridData.grid[idx];

        // Пропускаем пустые клетки
        if (cell === 0) continue;

        // Распространяем вирус
        this.spreadVirus(newGrid, x, y, cell, width, height);
      }
    }

    // Обновляем сетку
    this.gridData.grid = newGrid;

    // Увеличиваем счётчик тика
    if (this.state.type === 'running') {
      this.state = {
        ...this.state,
        tick: this.state.tick + 1
      };
    }

    // Уведомляем об обновлении
    if (this.onGridUpdateCallback) {
      this.onGridUpdateCallback(this.gridData.grid);
    }

    // Проверяем победу
    this.checkWinCondition();
  }

  /**
   * Распространить вирус из клетки
   */
  private spreadVirus(
    grid: number[],
    x: number,
    y: number,
    virusType: number,
    width: number,
    height: number
  ): void {
    // Параметры активного вируса
    const params = virusType === 1 ? this.paramsA : this.paramsB;
    if (!params) return;

    // Соседние клетки (8 направлений)
    const neighbors = [
      { dx: -1, dy: 0 },  // лево
      { dx: 1, dy: 0 },   // право
      { dx: 0, dy: -1 },  // верх
      { dx: 0, dy: 1 },   // низ
      { dx: -1, dy: -1 }, // верх-лево
      { dx: 1, dy: -1 },  // верх-право
      { dx: -1, dy: 1 },  // низ-лево
      { dx: 1, dy: 1 },   // низ-право
    ];

    // Шанс распространения (зависит от speed + reproduction)
    const spreadChance = (params.speed + params.reproduction) / 20; // 0.0 - 1.0

    // Количество попыток распространения (зависит от contagiousness)
    const spreadAttempts = 1 + Math.floor(params.contagiousness / 5);

    for (let attempt = 0; attempt < spreadAttempts; attempt++) {
      // Выбираем случайного соседа
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      // Проверяем границы
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nIdx = ny * width + nx;
      const neighborCell = grid[nIdx];

      // Пустая клетка - захватываем
      if (neighborCell === 0) {
        if (Math.random() < spreadChance) {
          grid[nIdx] = virusType;
        }
      }
      // Клетка врага - атакуем
      else if (neighborCell !== virusType) {
        this.attackCell(grid, nIdx, virusType, neighborCell, params);
      }
    }
  }

  /**
   * Атака клетки врага
   */
  private attackCell(
    grid: number[],
    idx: number,
    attackerType: number,
    defenderType: number,
    attackerParams: VirusParams
  ): void {
    // Параметры защитника
    const defenderParams = defenderType === 1 ? this.paramsA : this.paramsB;
    if (!defenderParams) return;

    // Сила атаки (aggression + virulence + lethality)
    const attackPower = attackerParams.aggression + attackerParams.virulence + attackerParams.lethality;

    // Сила защиты (defense + resilience)
    const defensePower = defenderParams.defense + defenderParams.resilience;

    // Шанс захвата
    const captureChance = 0.3 + (attackPower - defensePower) / 30; // Базовый 30% + модификаторы

    if (Math.random() < captureChance) {
      // Захват клетки
      grid[idx] = attackerType;
    }
  }

  /**
   * Проверить условие победы
   */
  private checkWinCondition(): void {
    if (!this.gridData) return;

    let countA = 0;
    let countB = 0;

    for (const cell of this.gridData.grid) {
      if (cell === 1) countA++;
      else if (cell === 2) countB++;
    }

    const total = countA + countB;
    if (total === 0) return;

    const percentA = (countA / total) * 100;
    const percentB = (countB / total) * 100;

    // Победа если 95% территории
    if (percentA >= 95) {
      this.endBattle('A', countA, countB);
    } else if (percentB >= 95) {
      this.endBattle('B', countA, countB);
    }
    // Или если один вирус полностью уничтожен
    else if (countA === 0 && countB > 0) {
      this.endBattle('B', countA, countB);
    } else if (countB === 0 && countA > 0) {
      this.endBattle('A', countA, countB);
    }
  }

  /**
   * Завершить битву
   */
  private endBattle(winner: 'A' | 'B', countA: number, countB: number): void {
    console.log('[BattleManager] Battle ended! Winner:', winner);

    if (this.spreadInterval) {
      clearInterval(this.spreadInterval);
      this.spreadInterval = null;
    }

    this.state = {
      type: 'ended',
      winner,
      virusACount: countA,
      virusBCount: countB
    };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  /**
   * Остановить битву
   */
  stopBattle(): void {
    if (this.spreadInterval) {
      clearInterval(this.spreadInterval);
      this.spreadInterval = null;
    }

    this.state = { type: 'idle' };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  /**
   * Сбросить состояние
   */
  reset(): void {
    this.stopBattle();
    this.gridData = null;
    this.paramsA = null;
    this.paramsB = null;
  }

  /**
   * Проверить, идёт ли битва
   */
  isRunning(): boolean {
    return this.state.type === 'running';
  }

  /**
   * Проверить, завершена ли битва
   */
  isEnded(): boolean {
    return this.state.type === 'ended';
  }

  // === Методы для обратной совместимости (сетевые события) ===

  /**
   * Обработать начало битвы (от сервера)
   */
  onBattleStarted(data: { battleGrid: number[]; width: number; height: number }): void {
    console.log('[BattleManager] Battle started (network event)');
    this.startBattle(data.battleGrid, data.width, data.height);
  }

  /**
   * Обработать тик битвы (от сервера)
   */
  onBattleTick(data: { battleGrid: number[]; tick: number }): void {
    if (this.state.type !== 'running') return;

    this.gridData = {
      grid: data.battleGrid,
      width: this.gridData?.width || 64,
      height: this.gridData?.height || 36
    };

    this.state = {
      ...this.state,
      tick: data.tick
    };

    if (this.onGridUpdateCallback && this.gridData) {
      this.onGridUpdateCallback(this.gridData.grid);
    }
  }

  /**
   * Обработать окончание битвы (от сервера)
   */
  onBattleEnded(data: {
    winner: 'A' | 'B' | 'draw';
    virusACount: number;
    virusBCount: number
  }): void {
    console.log('[BattleManager] Battle ended (network event):', data.winner);
    this.endBattle(data.winner as 'A' | 'B', data.virusACount, data.virusBCount);
  }
}
