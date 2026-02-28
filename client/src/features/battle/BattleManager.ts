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
  
  // Обратный отсчёт
  private countdownCallback?: (count: number) => void;

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
   * Установить callback для обратного отсчёта
   */
  setOnCountdown(callback: (count: number) => void): void {
    this.countdownCallback = callback;
  }

  /**
   * Запустить обратный отсчёт и начать битву
   */
  startCountdownAndBattle(vGrid: number[], width: number, height: number): void {
    console.log('[BattleManager] Starting countdown...');

    let count = 3;

    // Показываем первую цифру
    if (this.countdownCallback) {
      this.countdownCallback(count);
    }

    const countdownInterval = setInterval(() => {
      count--;

      if (count > 0) {
        // Показываем следующую цифру
        if (this.countdownCallback) {
          this.countdownCallback(count);
        }
      } else if (count === 0) {
        // Показываем "СТАРТ!"
        if (this.countdownCallback) {
          this.countdownCallback(0); // 0 = СТАРТ
        }
      } else {
        // Начинаем битву
        clearInterval(countdownInterval);
        this.startBattle(vGrid, width, height);
      }
    }, 1000); // Каждую секунду
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
   * Запустить битву (после обратного отсчёта)
   */
  startBattle(vGrid: number[], width: number, height: number): void {
    console.log('[BattleManager] Battle starting now!');

    this.gridData = {
      grid: [...vGrid],
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

    // === БАЗОВЫЙ ШАНС РАСПРОСТРАНЕНИЯ ===
    // Speed + Reproduction определяют базовую скорость
    const baseSpreadChance = (params.speed + params.reproduction) / 20; // 0.0 - 1.0

    // === ВЛИЯНИЕ AGGRESSION ===
    // Aggression увеличивает шанс распространения на вражеские территории
    // Каждый пункт агрессии даёт +2.5% к шансу (макс +30% при 12 aggression)
    const aggressionBonus = params.aggression * 0.025;

    // === ВЛИЯНИЕ VIRULENCE ===
    // Virulence увеличивает количество попыток распространения
    // Высокая вирулентность = вирус более "заразный" и проникающий
    const virulenceBonus = Math.floor(params.virulence / 4); // 0-3 дополнительные попытки

    // === ВЛИЯНИЕ CONTAGIOUSNESS ===
    // Contagiousness определяет количество направлений распространения
    const spreadAttempts = 1 + Math.floor(params.contagiousness / 5); // 1-3 попытки

    // Общее количество попыток распространения
    const totalAttempts = spreadAttempts + virulenceBonus;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      // Выбираем случайного соседа
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      // Проверяем границы
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nIdx = ny * width + nx;
      const neighborCell = grid[nIdx];

      // === ПУСТАЯ КЛЕТКА - БАЗОВОЕ РАСПРОСТРАНЕНИЕ ===
      if (neighborCell === 0) {
        // Aggression не влияет на пустые клетки, только base chance
        if (Math.random() < baseSpreadChance) {
          grid[nIdx] = virusType;
        }
      }
      // === КЛЕТКА ВРАГА - АТАКА С AGGRESSION БОНУСОМ ===
      else if (neighborCell !== virusType) {
        // Aggression даёт бонус к шансу захвата вражеской клетки
        const attackChance = baseSpreadChance + aggressionBonus;
        if (Math.random() < attackChance) {
          // Дополнительно проверяем шанс полной атаки (уничтожение врага)
          this.attackCell(grid, nIdx, virusType, neighborCell, params);
        }
      }
    }
  }

  /**
   * Атака клетки врага
   * Aggression + Virulence + Lethality vs Defense + Resilience
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

    // === СИЛА АТАКИ ===
    // Aggression: прямая атака (+1 к силе за пункт)
    // Virulence: разрушение тканей (+0.5 к силе за пункт, игнорирует часть защиты)
    // Lethality: смертельность (+0.75 к силе за пункт, бонус против высокозащищённых)
    const aggressionPower = attackerParams.aggression * 1.0;
    const virulencePower = attackerParams.virulence * 0.5;
    const lethalityPower = attackerParams.lethality * 0.75;
    
    const baseAttackPower = aggressionPower + virulencePower + lethalityPower;

    // === СИЛА ЗАЩИТЫ ===
    // Defense: прямая защита (+1 к защите за пункт)
    // Resilience: выживание (+0.5 к защите за пункт)
    const defensePower = defenderParams.defense * 1.0 + defenderParams.resilience * 0.5;

    // === РАСЧЁТ ШАНСА ЗАХВАТА ===
    // Базовый шанс 40%
    // Модификатор от разницы атаки и защиты: ±2% за каждый пункт разницы
    const attackDiff = baseAttackPower - defensePower;
    const captureChance = 0.4 + (attackDiff * 0.02); // 40% база + 2% за разницу

    // === БОНУС ОТ VIRULENCE ПРОТИВ ЗАЩИТЫ ===
    // Virulence игнорирует часть защиты (до 30% при 12 virulence)
    const armorPenetration = attackerParams.virulence / 40; // 0-30%
    const effectiveDefensePower = defensePower * (1 - armorPenetration);
    const adjustedCaptureChance = 0.4 + ((baseAttackPower - effectiveDefensePower) * 0.02);

    // === БОНУС ОТ LETHALITY ПРОТИВ ВЫСОКОЙ ЗАЩИТЫ ===
    // Lethality даёт бонус против целей с defense > 6
    if (defenderParams.defense > 6) {
      const highDefenseBonus = (defenderParams.defense - 6) * attackerParams.lethality * 0.01;
      if (Math.random() < adjustedCaptureChance + highDefenseBonus) {
        // Захват клетки
        grid[idx] = attackerType;
        return;
      }
    }

    // Стандартная проверка захвата
    if (Math.random() < adjustedCaptureChance) {
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

    // Победа при 96% территории (was 99%)
    if (percentA >= 96) {
      this.endBattle('A', countA, countB);
    } else if (percentB >= 96) {
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
  onBattleStarted(data: { vGrid: number[]; width: number; height: number }): void {
    console.log('[BattleManager] Battle started (network event)');
    this.startBattle(data.vGrid, data.width, data.height);
  }

  /**
   * Обработать тик битвы (от сервера)
   */
  onBattleTick(data: { vGrid: number[]; tick: number }): void {
    if (this.state.type !== 'running') return;

    this.gridData = {
      grid: data.vGrid,
      width: this.gridData?.width || 32,
      height: this.gridData?.height || 20
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
