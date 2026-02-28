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
  mutation: number;        // 🧬 Шанс конвертации врагов
  speed: number;           // ⚡ Скорость распространения
  defense: number;         // 🛡️ Защита от захвата
  reproduction: number;    // 🦠 Размножение
  stealth: number;         // 👻 Скрытность (снижает точность конвертации врага)
  virulence: number;       // ☣️ Разрушение
  resilience: number;      // 💪 Выживание
  mobility: number;        // 🚶 Передвижение
  intellect: number;       // 🧠 Стратегия (сопротивление конвертации)
  contagiousness: number;  // 🫁 Заражение (кол-во клеток для конвертации)
  lethality: number;       // 💀 Смертельность
}

export class BattleManager {
  private state: BattleState = { type: 'idle' };
  private gridData: BattleGridData | null = null;
  private onStateChangeCallback?: (state: BattleState) => void;
  private onGridUpdateCallback?: (grid: number[]) => void;
  
  // Virus params for defense visualization
  private paramsA: VirusParams | null = null;
  private paramsB: VirusParams | null = null;

  // Infestation tracking
  private infestedCells: Map<number, {
    hostType: number;      // Original owner
    infestorType: number;  // Who is infesting
    progress: number;      // 0.0 - 1.0
    stage: 'hidden' | 'visible' | 'critical';
  }> = new Map();
  
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

    // Обновляем инфестации
    this.updateInfestationsWrapper();

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
   * Calculate surround pressure for a cell
   * Returns: { enemyCount, allyCount, pressureLevel (0-1) }
   */
  private calculateSurroundPressure(
    grid: number[],
    x: number,
    y: number,
    virusType: number,
    width: number,
    height: number
  ): { enemyCount: number; allyCount: number; pressureLevel: number; enemyTypes: number[] } {
    let enemyCount = 0;
    let allyCount = 0;
    const enemyTypes: number[] = [];

    const neighbors = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const neighbor of neighbors) {
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        const neighborValue = grid[nIdx];

        if (neighborValue === virusType) {
          allyCount++;
        } else if (neighborValue !== 0) {
          enemyCount++;
          if (!enemyTypes.includes(neighborValue)) {
            enemyTypes.push(neighborValue);
          }
        }
      }
    }

    // Pressure level: 0.0 (no enemies) to 1.0 (completely surrounded by 8 enemies)
    const pressureLevel = enemyCount / 8;

    return { enemyCount, allyCount, pressureLevel, enemyTypes };
  }

  /**
   * Attempt to infest enemy cell (parasitic takeover)
   * Stealthy conversion that happens over time
   */
  private attemptInfestation(
    grid: number[],
    idx: number,
    attackerType: number,
    defenderType: number,
    attackerParams: VirusParams,
    defenderParams: VirusParams,
    surroundPressure: number
  ): boolean {
    // Check if cell is already infested
    const existingInfestation = this.infestedCells.get(idx);
    
    if (existingInfestation) {
      // Cell already infested - check if by same attacker
      if (existingInfestation.infestorType === attackerType) {
        // Continue existing infestation
        const infestChance = this.calculateInfestationChance(
          attackerParams, defenderParams, surroundPressure
        );
        
        if (Math.random() < infestChance) {
          existingInfestation.progress += 0.08; // +8% per tick
          
          // Update stage
          if (existingInfestation.progress >= 1.0) {
            // Capture complete!
            grid[idx] = attackerType;
            this.infestedCells.delete(idx);
            return true;
          } else if (existingInfestation.progress >= 0.7) {
            existingInfestation.stage = 'critical';
          } else if (existingInfestation.progress >= 0.3) {
            existingInfestation.stage = 'visible';
          }
        }
        return false;
      } else {
        // Cell infested by different virus - compete!
        const competingChance = attackerParams.mutation / (attackerParams.mutation + defenderParams.intellect);
        if (Math.random() < competingChance) {
          // Override infestation
          this.infestedCells.set(idx, {
            hostType: defenderType,
            infestorType: attackerType,
            progress: 0.1,
            stage: 'hidden'
          });
        }
        return false;
      }
    }
    
    // New infestation attempt
    // === ШАНС ИНФЕСТАЦИИ ===
    const infestChance = this.calculateInfestationChance(
      attackerParams, defenderParams, surroundPressure
    );
    
    if (Math.random() < infestChance) {
      // Start infestation
      this.infestedCells.set(idx, {
        hostType: defenderType,
        infestorType: attackerType,
        progress: 0.1,
        stage: 'hidden'
      });
      return true; // Infestation started (but cell not captured yet)
    }
    
    return false;
  }

  /**
   * Calculate infestation chance based on parameters
   */
  private calculateInfestationChance(
    attackerParams: VirusParams,
    defenderParams: VirusParams,
    surroundPressure: number
  ): number {
    // === БАЗОВЫЙ ШАНС ===
    const baseChance = 0.2; // 20%

    // === MUTATION: основной параметр ===
    // +4% за пункт (макс 48%)
    const mutationBonus = attackerParams.mutation * 0.04;

    // === CONTAGIOUSNESS: количество целей ===
    // +2% за пункт
    const contagiousBonus = attackerParams.contagiousness * 0.02;

    // === STEALTH: скрытность ===
    // +3% за пункт (игнорирует защиту)
    const stealthBonus = attackerParams.stealth * 0.03;

    // === VIRULENCE: повреждение хозяина ===
    // +1.5% за пункт
    const virulenceBonus = attackerParams.virulence * 0.015;

    // === БОНУС ОТ ДАВЛЕНИЯ ОКРУЖЕНИЯ ===
    // +20% при полном окружении
    const pressureBonus = surroundPressure * 0.2;

    // === ЗАЩИТА ЗАЩИТНИКА ===
    // Intellect: -3% за пункт
    const intellectResist = defenderParams.intellect * 0.03;
    
    // Defense: -2% за пункт (но Stealth игнорирует часть)
    const stealthPenetration = attackerParams.stealth / 12; // 0-100% penetration
    const effectiveDefense = defenderParams.defense * (1 - stealthPenetration);
    const defenseResist = effectiveDefense * 0.02;

    // Defense: -1.5% за пункт
    const resilienceResist = defenderParams.resilience * 0.015;

    // === ИТОГОВЫЙ ШАНС ===
    const finalChance = baseChance + mutationBonus + contagiousBonus + 
                        stealthBonus + virulenceBonus + pressureBonus -
                        intellectResist - defenseResist - resilienceResist;

    return Math.max(0.02, Math.min(0.95, finalChance)); // 2% - 95%
  }

  /**
   * Update all infested cells (progress, symptoms)
   */
  private updateInfestations(grid: number[]): void {
    const toRemove: number[] = [];

    for (const [idx, infestation] of this.infestedCells.entries()) {
      // Check if host cell still exists
      const currentCell = grid[idx];
      if (currentCell !== infestation.hostType) {
        // Host cell died or was captured
        toRemove.push(idx);
        continue;
      }

      // Apply infestation symptoms based on stage
      this.applyInfestationSymptoms(grid, idx, infestation);
    }

    // Clean up removed infestations
    for (const idx of toRemove) {
      this.infestedCells.delete(idx);
    }
  }

  /**
   * Apply infestation symptoms to cell
   */
  private applyInfestationSymptoms(
    grid: number[],
    idx: number,
    infestation: { hostType: number; infestorType: number; progress: number; stage: string }
  ): void {
    // Symptoms affect cell behavior
    const x = idx % this.gridData!.width;
    const y = Math.floor(idx / this.gridData!.height);

    // === HIDDEN STAGE (0-30%): No symptoms ===
    if (infestation.stage === 'hidden') {
      // Cell behaves normally, no penalties
      return;
    }

    // === VISIBLE STAGE (30-70%): Reduced defense ===
    if (infestation.stage === 'visible') {
      // Cell has reduced defense (handled in defense calculation)
      // Visual: slight color change toward infestor color
    }

    // === CRITICAL STAGE (70-100%): Cell about to turn ===
    if (infestation.stage === 'critical') {
      // Cell may spread infestation to neighbors
      this.spreadInfestationToNeighbors(grid, idx, infestation);
    }
  }

  /**
   * Spread infestation to adjacent cells of same type
   */
  private spreadInfestationToNeighbors(
    grid: number[],
    idx: number,
    infestation: { hostType: number; infestorType: number; progress: number; stage: string }
  ): void {
    const x = idx % this.gridData!.width;
    const y = Math.floor(idx / this.gridData!.height);
    const hostParams = infestation.hostType === 1 ? this.paramsA : this.paramsB;
    
    if (!hostParams) return;

    // Contagiousness determines spread attempts
    const attempts = 1 + Math.floor(hostParams.contagiousness / 6);

    const neighbors = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    for (let i = 0; i < attempts; i++) {
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      if (nx >= 0 && nx < this.gridData!.width && ny >= 0 && ny < this.gridData!.height) {
        const nIdx = ny * this.gridData!.width + nx;
        const neighborCell = grid[nIdx];

        // Can only spread to same host type
        if (neighborCell === infestation.hostType && !this.infestedCells.has(nIdx)) {
          // Chance to spread infestation
          const spreadChance = 0.15 + (hostParams.contagiousness * 0.02);
          if (Math.random() < spreadChance) {
            this.infestedCells.set(nIdx, {
              hostType: infestation.hostType,
              infestorType: infestation.infestorType,
              progress: 0.15,
              stage: 'hidden'
            });
          }
        }
      }
    }
  }

  /**
   * Get infestation data for a cell (for rendering)
   */
  getInfestationData(idx: number) {
    return this.infestedCells.get(idx);
  }

  /**
   * Get all infestations (for rendering)
   */
  getInfestations(): Map<number, { infestor: number; progress: number; stage: string }> {
    // Convert internal format to renderer format
    const rendererFormat = new Map<number, { infestor: number; progress: number; stage: string }>();
    for (const [idx, data] of this.infestedCells.entries()) {
      rendererFormat.set(idx, {
        infestor: data.infestorType,
        progress: data.progress,
        stage: data.stage
      });
    }
    return rendererFormat;
  }

  /**
   * Clear all infestations
   */
  clearInfestations(): void {
    this.infestedCells.clear();
  }

  /**
   * Cell behavior when surrounded (depends on virus parameters)
   */
  private handleSurroundedCell(
    grid: number[],
    idx: number,
    x: number,
    y: number,
    virusType: number,
    params: VirusParams,
    width: number,
    height: number
  ): void {
    const surround = this.calculateSurroundPressure(grid, x, y, virusType, width, height);

    // Если клетка окружена врагами (давление > 0.5 = 5+ врагов)
    if (surround.pressureLevel > 0.5) {
      // === ВЫСОКОЕ ДАВЛЕНИЕ - КЛЕТКА РЕАГИРУЕТ ===

      // 1. Высокий Intellect = клетка "зовёт на помощь" (распространяется в союзников)
      if (params.intellect >= 8) {
        // Попытка распространиться в соседние пустые клетки
        this.emergencySpread(grid, x, y, virusType, params, width, height);
      }

      // 2. Высокая Mutation = клетка пытается конвертировать врагов перед смертью
      if (params.mutation >= 8 && surround.enemyCount > 0) {
        this.desperateConversion(grid, idx, virusType, params, surround, width, height);
      }

      // 3. Высокая Defense + Resilience = клетка сопротивляется дольше
      if (params.defense + params.resilience >= 12) {
        // Клетка получает временный бонус к защите
        // (реализуется через визуальный эффект в BattleRenderer)
      }

      // 4. Высокая Stealth = клетка "прячется" (меньше шанса быть атакованной)
      if (params.stealth >= 8) {
        // Снижаем шанс конвертации этой клетки
        // (реализуется в attemptConversion)
      }
    }
  }

  /**
   * Emergency spread - cell tries to spread to empty neighbors when surrounded
   */
  private emergencySpread(
    grid: number[],
    x: number,
    y: number,
    virusType: number,
    params: VirusParams,
    width: number,
    height: number
  ): void {
    const neighbors = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    // Интеллект определяет количество попыток (до 4 при intellect 12)
    const attempts = 1 + Math.floor(params.intellect / 4);

    for (let i = 0; i < attempts; i++) {
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (grid[nIdx] === 0) {
          // Пустая клетка - пытаемся распространиться
          const spreadChance = (params.intellect + params.mobility) / 24;
          if (Math.random() < spreadChance) {
            grid[nIdx] = virusType;
          }
        }
      }
    }
  }

  /**
   * Desperate conversion - surrounded cell tries to convert enemies before dying
   */
  private desperateConversion(
    grid: number[],
    idx: number,
    virusType: number,
    params: VirusParams,
    surround: { enemyCount: number; allyCount: number; pressureLevel: number; enemyTypes: number[] },
    width: number,
    height: number
  ): void {
    const x = idx % width;
    const y = Math.floor(idx / width);

    // Попытка конвертировать случайного соседа-врага
    const neighbors = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    // Находим всех врагов по соседству
    const enemyNeighbors: { x: number; y: number; type: number }[] = [];
    for (const neighbor of neighbors) {
      const nx = x + neighbor.dx;
      const ny = y + neighbor.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        const neighborValue = grid[nIdx];
        if (neighborValue !== 0 && neighborValue !== virusType) {
          enemyNeighbors.push({ x: nx, y: ny, type: neighborValue });
        }
      }
    }

    if (enemyNeighbors.length > 0) {
      // Выбираем случайного врага
      const target = enemyNeighbors[Math.floor(Math.random() * enemyNeighbors.length)];
      const targetIdx = target.y * width + target.x;

      // Параметры врага (берём средние для упрощения)
      const dummyEnemyParams: VirusParams = {
        mutation: 6, intellect: 6, stealth: 6,
        aggression: 6, speed: 6, defense: 6,
        reproduction: 6, virulence: 6, resilience: 6,
        mobility: 6, contagiousness: 6, lethality: 6
      };

      // Шанс отчаянной конвертации (высокий, так как клетка "обречена")
      const desperateChance = (params.mutation / 12) * 0.6; // до 60% при mutation 12

      if (Math.random() < desperateChance) {
        grid[targetIdx] = virusType;
      }
    }
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
      // === КЛЕТКА ВРАГА - АТАКА С ВОЗМОЖНОСТЬЮ ИНФЕСТАЦИИ ===
      else if (neighborCell !== virusType) {
        // Aggression даёт бонус к шансу захвата вражеской клетки
        const attackChance = baseSpreadChance + aggressionBonus;
        if (Math.random() < attackChance) {
          // Проверяем, является ли это атакой или инфестацией
          const idx = y * width + x;
          const surroundPressure = this.calculateSurroundPressure(grid, nx, ny, neighborCell, width, height).pressureLevel;
          
          // Параметры врага
          const enemyParams = neighborCell === 1 ? this.paramsA : this.paramsB;
          
          // Пытаемся инфестировать вместо уничтожения (если Mutation >= 4)
          if (params.mutation >= 4 && enemyParams && Math.random() < 0.5) {
            // Попытка инфестации
            const infested = this.attemptInfestation(grid, nIdx, virusType, neighborCell, params, enemyParams, surroundPressure);
            if (!infested) {
              // Если инфестация не удалась - обычная атака
              this.attackCell(grid, nIdx, virusType, neighborCell, params);
            }
          } else {
            // Обычная атака
            this.attackCell(grid, nIdx, virusType, neighborCell, params);
          }
        }
      }
    }

    // === ОБРАБОТКА ОКРУЖЁННЫХ КЛЕТОК ===
    // Проверяем, не окружена ли эта клетка врагами
    this.handleSurroundedCell(grid, y * width + x, x, y, virusType, params, width, height);
  }

  /**
   * Update infestations each tick
   */
  private updateInfestationsWrapper(): void {
    if (this.gridData) {
      this.updateInfestations(this.gridData.grid);
    }
  }

  /**
   * Атака клетки врага
   * Aggression + Virulence + Lethality vs Defense + Resilience
   * С возможностью конвертации через Mutation
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
