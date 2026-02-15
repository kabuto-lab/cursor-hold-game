/**
 * Алгебра вирусной битвы для TOVCH
 * Чистая логика симуляции без визуализации
 */

enum CellState {
  EMPTY = 0,
  VIRUS_A = 1,  // Красный игрок (сверху)
  VIRUS_B = 2   // Синий игрок (снизу)
}

interface VirusParams {
  // Параметры вируса для одной фракции
  aggression: number;      // ⚔️ Увеличивает урон в столкновениях
  mutation: number;        // 🧬 Шанс мутации параметров
  speed: number;           // ⚡ Увеличивает частоту/дальность распространения
  defense: number;         // 🛡️ Базовая защита от заражения/урона
  reproduction: number;    // 🦠 Шанс размножения в своей зоне
  stealth: number;         // 👻 Снижает шанс быть обнаруженным/атакованным
  virulence: number;       // ☣️ Увеличивает силу заражения
  resilience: number;      // 💪 Восстановление здоровья
  mobility: number;        // 🚶 Дальность перемещения/прыжков
  intellect: number;       // 🧠 Шанс "умного" выбора цели
  contagiousness: number;  // 🫁 Базовый шанс заражения соседей
  lethality: number;       // 💀 Урон по здоровью противника
}

interface Cell {
  state: CellState;
  health: number;
  infectionLevel: number;
  ownerParams?: VirusParams;
}

class VirusBattleAlgebra {
  private width: number;
  private height: number;
  private grid: Cell[][];
  public virusAParams: VirusParams;
  public virusBParams: VirusParams;
  private instabilityA: number;
  private instabilityB: number;
  public tickCount: number;
  private nextChaosEvent: number;
  private readonly totalCells: number;

  constructor(width: number = 32, height: number = 20) {
    this.width = width;
    this.height = height;
    this.totalCells = width * height;
    this.grid = [];
    this.virusAParams = this.getDefaultParams();
    this.virusBParams = this.getDefaultParams();
    this.instabilityA = 0;
    this.instabilityB = 0;
    this.tickCount = 0;
    this.nextChaosEvent = Math.floor(Math.random() * 11) + 10; // 10-20
    
    this.initializeGrid();
  }

  private getDefaultParams(): VirusParams {
    return {
      aggression: 0,
      mutation: 0,
      speed: 0,
      defense: 0,
      reproduction: 0,
      stealth: 0,
      virulence: 0,
      resilience: 0,
      mobility: 0,
      intellect: 0,
      contagiousness: 0,
      lethality: 0
    };
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          state: CellState.EMPTY,
          health: 0,
          infectionLevel: 0
        });
      }
      this.grid.push(row);
    }
  }

  public setPlayerParams(player: 'A' | 'B', params: Partial<VirusParams>): void {
    const fullParams = { ...this.getDefaultParams(), ...params };
    
    if (player === 'A') {
      this.virusAParams = fullParams;
    } else {
      this.virusBParams = fullParams;
    }
  }

  public placeInitialViruses(): void {
    // Размещение вирусов A в верхней половине (строки 0-9)
    const aStartY = 0;
    const aEndY = Math.floor(this.height / 2) - 1;
    
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) { // 3-5 вирусов
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * (aEndY - aStartY + 1)) + aStartY;
      
      this.grid[y][x] = {
        state: CellState.VIRUS_A,
        health: 20 + (this.virusAParams.defense || 0) * 2 + (this.virusAParams.resilience || 0) * 3,
        infectionLevel: 1.0,
        ownerParams: this.virusAParams
      };
    }
    
    // Размещение вирусов B в нижней половине (строки 10-19)
    const bStartY = Math.floor(this.height / 2);
    const bEndY = this.height - 1;
    
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) { // 3-5 вирусов
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * (bEndY - bStartY + 1)) + bStartY;
      
      this.grid[y][x] = {
        state: CellState.VIRUS_B,
        health: 20 + (this.virusBParams.defense || 0) * 2 + (this.virusBParams.resilience || 0) * 3,
        infectionLevel: 1.0,
        ownerParams: this.virusBParams
      };
    }
  }

  private getNeighbors(x: number, y: number, maxDistance: number = 1): [number, number][] {
    const neighbors: [number, number][] = [];
    
    for (let dy = -maxDistance; dy <= maxDistance; dy++) {
      for (let dx = -maxDistance; dx <= maxDistance; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          neighbors.push([nx, ny]);
        }
      }
    }
    
    return neighbors;
  }

  private calculateReproductionPhase(): void {
    // Создаем копию сетки для безопасного обновления
    const newGrid: Cell[][] = JSON.parse(JSON.stringify(this.grid));
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        
        if (cell.state === CellState.EMPTY) continue;
        
        const params = cell.ownerParams;
        if (!params) continue;
        
        // Базовый шанс размножения
        const reproductionChance = Math.min(
          (params.reproduction || 0) / 12.0 + (params.speed || 0) / 24.0,
          1.0
        );
        
        if (Math.random() < reproductionChance) {
          // Определяем дальность распространения
          const maxDistance = 1 + Math.floor((params.mobility || 0) / 3) + Math.floor((params.speed || 0) / 4);
          
          // Получаем соседей
          const neighbors = this.getNeighbors(x, y, maxDistance);
          
          if (neighbors.length > 0) {
            const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
            const neighborCell = this.grid[ny][nx];
            
            if (neighborCell.state === CellState.EMPTY) {
              // Заражаем пустую клетку
              const infectionLevel = 0.5 * (params.contagiousness || 0) / 12.0;
              
              newGrid[ny][nx] = {
                state: cell.state,
                health: 10 + (params.resilience || 0) * 2,
                infectionLevel: infectionLevel,
                ownerParams: params
              };
            }
          }
        }
      }
    }
    
    this.grid = newGrid;
  }

  private calculateInfectionAndCombatPhase(): void {
    const newGrid: Cell[][] = JSON.parse(JSON.stringify(this.grid));
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        
        if (cell.state === CellState.EMPTY) continue;
        
        const params = cell.ownerParams;
        if (!params) continue;
        
        // Получаем соседей
        const neighbors = this.getNeighbors(x, y, 1);
        
        for (const [nx, ny] of neighbors) {
          const neighborCell = this.grid[ny][nx];
          
          if (neighborCell.state === CellState.EMPTY) {
            // Попытка заражения пустой клетки
            const stealthNeighbor = neighborCell.ownerParams?.stealth || 0;
            
            const infectChance =
              ((params.contagiousness || 0) / 12.0) *
              (1 - stealthNeighbor / 24.0) *
              ((params.virulence || 0) / 12.0);
            
            if (Math.random() < infectChance) {
              // Заражаем клетку
              newGrid[ny][nx] = {
                state: cell.state,
                health: 10 + (params.resilience || 0) * 2,
                infectionLevel: Math.min(1.0, neighborCell.infectionLevel + 0.2),
                ownerParams: params
              };
            }
          } 
          else if (neighborCell.state !== cell.state) {
            // Столкновение с противником
            const isAttackerA = cell.state === CellState.VIRUS_A;
            const attackerParams = isAttackerA ? this.virusAParams : this.virusBParams;
            const defenderParams = isAttackerA ? this.virusBParams : this.virusAParams;
            
            const attackPower =
              (attackerParams.aggression || 0) +
              (attackerParams.virulence || 0) +
              (attackerParams.lethality || 0);

            const defendPower =
              (defenderParams.defense || 0) +
              (defenderParams.resilience || 0) +
              (defenderParams.stealth || 0);
            
            const captureChance = attackPower / (attackPower + defendPower || 1);
            
            const damage = Math.max(
              0,
              (attackerParams.lethality || 0) / 2.0 +
              (attackerParams.aggression || 0) / 3.0 -
              (defenderParams.defense || 0) / 4.0
            );
            
            if (Math.random() < captureChance) {
              // Захватываем клетку
              newGrid[ny][nx] = {
                state: cell.state,
                health: Math.max(1.0, neighborCell.health - damage),
                infectionLevel: neighborCell.infectionLevel,
                ownerParams: attackerParams
              };
            } else {
              // Наносим урон, но не захватываем
              newGrid[ny][nx].health = Math.max(0, neighborCell.health - damage);
              
              // Если здоровье <= 0, клетка может стать пустой или перейти атакующему
              if (newGrid[ny][nx].health <= 0) {
                if (Math.random() < 0.5) {
                  newGrid[ny][nx] = {
                    state: CellState.EMPTY,
                    health: 0,
                    infectionLevel: 0
                  };
                } else {
                  newGrid[ny][nx] = {
                    state: cell.state,
                    health: 5 + (attackerParams.resilience || 0),
                    infectionLevel: 0.5,
                    ownerParams: attackerParams
                  };
                }
              }
            }
          }
        }
      }
    }
    
    this.grid = newGrid;
  }

  private calculateMutationsAndWeakeningPhase(): void {
    // Подсчет контроля территории
    let aControl = 0;
    let bControl = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.state === CellState.VIRUS_A) aControl++;
        else if (cell.state === CellState.VIRUS_B) bControl++;
      }
    }
    
    const aControlPercent = (aControl / this.totalCells) * 100;
    const bControlPercent = (bControl / this.totalCells) * 100;
    
    // Расчет нестабильности
    if (aControlPercent > 70) {
      this.instabilityA += (aControlPercent - 70) / 100 * 2;
    } else {
      this.instabilityA *= 0.9; // Уменьшаем нестабильность
    }
    
    if (bControlPercent > 70) {
      this.instabilityB += (bControlPercent - 70) / 100 * 2;
    } else {
      this.instabilityB *= 0.9; // Уменьшаем нестабильность
    }
    
    // Мутации
    if (Math.random() < (this.virusAParams.mutation || 0) / 12.0) {
      // Мутация параметров вируса A
      const paramKeys = Object.keys(this.virusAParams) as (keyof VirusParams)[];
      const paramName = paramKeys[Math.floor(Math.random() * paramKeys.length)];
      
      // Изменение на ±1-3 с возможностью негативного изменения
      const change = Math.random() < 0.7 
        ? Math.floor(Math.random() * 3) + 1 
        : -(Math.floor(Math.random() * 3) + 1);
      
      const currentValue = this.virusAParams[paramName];
      const newValue = Math.max(0, Math.min(12, currentValue + change));
      
      this.virusAParams[paramName] = newValue as any;
    }
    
    if (Math.random() < (this.virusBParams.mutation || 0) / 12.0) {
      // Мутация параметров вируса B
      const paramKeys = Object.keys(this.virusBParams) as (keyof VirusParams)[];
      const paramName = paramKeys[Math.floor(Math.random() * paramKeys.length)];
      
      // Изменение на ±1-3 с возможностью негативного изменения
      const change = Math.random() < 0.7 
        ? Math.floor(Math.random() * 3) + 1 
        : -(Math.floor(Math.random() * 3) + 1);
      
      const currentValue = this.virusBParams[paramName];
      const newValue = Math.max(0, Math.min(12, currentValue + change));
      
      this.virusBParams[paramName] = newValue as any;
    }
  }

  private calculateEventsPhase(): void {
    if (this.tickCount === this.nextChaosEvent) {
      const chaosChance = 0.1 + Math.max(this.instabilityA, this.instabilityB) * 0.2;
      
      if (Math.random() < chaosChance) {
        const events = ['global_outbreak', 'weakening', 'super_mutation', 'collapse'];
        const eventType = events[Math.floor(Math.random() * events.length)];
        
        console.log(`Chaos event at tick ${this.tickCount}: ${eventType}`);
        
        if (eventType === 'global_outbreak') {
          // Глобальная вспышка: +20% к Contagiousness всем на 3 тика
          this.virusAParams.contagiousness = Math.min(12, Math.floor((this.virusAParams.contagiousness || 0) * 1.2));
          this.virusBParams.contagiousness = Math.min(12, Math.floor((this.virusBParams.contagiousness || 0) * 1.2));
        } 
        else if (eventType === 'weakening') {
          // Ослабление: -30% здоровья случайным 10% клеток доминирующей фракции
          const aCells = this.countCells(CellState.VIRUS_A);
          const bCells = this.countCells(CellState.VIRUS_B);
          const dominantFaction = aCells > bCells ? CellState.VIRUS_A : CellState.VIRUS_B;
          
          const factionCells: [number, number][] = [];
          for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
              if (this.grid[y][x].state === dominantFaction) {
                factionCells.push([x, y]);
              }
            }
          }
          
          const targetCount = Math.max(1, Math.floor(factionCells.length / 10));
          const targets = this.getRandomElements(factionCells, targetCount);
          
          for (const [tx, ty] of targets) {
            this.grid[ty][tx].health *= 0.7; // Уменьшаем здоровье на 30%
          }
        } 
        else if (eventType === 'super_mutation') {
          // Супермутация: +5 к случайному параметру лидера, но +instability*2
          const aCells = this.countCells(CellState.VIRUS_A);
          const bCells = this.countCells(CellState.VIRUS_B);
          const dominantFaction = aCells > bCells ? CellState.VIRUS_A : CellState.VIRUS_B;
          
          if (dominantFaction === CellState.VIRUS_A) {
            const paramKeys = Object.keys(this.virusAParams) as (keyof VirusParams)[];
            const paramName = paramKeys[Math.floor(Math.random() * paramKeys.length)];
            
            const currentValue = this.virusAParams[paramName];
            this.virusAParams[paramName] = Math.min(12, currentValue + 5) as any;
            this.instabilityA += this.instabilityA * 2;
          } else {
            const paramKeys = Object.keys(this.virusBParams) as (keyof VirusParams)[];
            const paramName = paramKeys[Math.floor(Math.random() * paramKeys.length)];
            
            const currentValue = this.virusBParams[paramName];
            this.virusBParams[paramName] = Math.min(12, currentValue + 5) as any;
            this.instabilityB += this.instabilityB * 2;
          }
        } 
        else if (eventType === 'collapse') {
          // Коллапс: Если контроль >90%, сброс 20% клеток в EMPTY
          const aCells = this.countCells(CellState.VIRUS_A);
          const bCells = this.countCells(CellState.VIRUS_B);
          const aPercent = (aCells / this.totalCells) * 100;
          const bPercent = (bCells / this.totalCells) * 100;
          
          const dominantFaction = aCells > bCells ? CellState.VIRUS_A : CellState.VIRUS_B;
          const controlPercent = dominantFaction === CellState.VIRUS_A ? aPercent : bPercent;
          
          if (controlPercent > 90) {
            const factionCells: [number, number][] = [];
            for (let y = 0; y < this.height; y++) {
              for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x].state === dominantFaction) {
                  factionCells.push([x, y]);
                }
              }
            }
            
            const collapseCount = Math.max(1, Math.floor(factionCells.length / 5)); // 20%
            const targets = this.getRandomElements(factionCells, collapseCount);
            
            for (const [tx, ty] of targets) {
              this.grid[ty][tx] = {
                state: CellState.EMPTY,
                health: 0,
                infectionLevel: 0
              };
            }
          }
        }
      }
      
      // Устанавливаем следующее событие
      this.nextChaosEvent = this.tickCount + Math.floor(Math.random() * 11) + 10; // 10-20
    }
  }

  private calculateRecoveryPhase(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.state !== CellState.EMPTY && cell.ownerParams) {
          // Восстановление здоровья
          const recoveryAmount = (cell.ownerParams.resilience || 0) / 5.0;
          const maxHealth = 20 + ((cell.ownerParams.defense || 0) * 2) + ((cell.ownerParams.resilience || 0) * 3);
          cell.health = Math.min(maxHealth, cell.health + recoveryAmount);

          // Увеличение уровня заражения для живых клеток
          cell.infectionLevel = Math.min(1.0, cell.infectionLevel + 0.05);
        }
      }
    }
  }

  private countCells(state: CellState): number {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].state === state) {
          count++;
        }
      }
    }
    return count;
  }

  private getRandomElements<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  public simulateTick(): 'A' | 'B' | null {
    this.tickCount++;
    
    // Выполняем все фазы
    this.calculateReproductionPhase();
    this.calculateInfectionAndCombatPhase();
    this.calculateMutationsAndWeakeningPhase();
    this.calculateEventsPhase();
    this.calculateRecoveryPhase();
    
    // Проверяем победу
    const winner = this.checkVictory();
    
    // Выводим статистику каждые 10 тиков
    if (this.tickCount % 10 === 0) {
      const aControl = this.countCells(CellState.VIRUS_A);
      const bControl = this.countCells(CellState.VIRUS_B);
      const emptyCells = this.countCells(CellState.EMPTY);
      
      console.log(`Tick ${this.tickCount}: A=${aControl} (${(aControl/this.totalCells*100).toFixed(1)}%), ` +
                  `B=${bControl} (${(bControl/this.totalCells*100).toFixed(1)}%), ` +
                  `Empty=${emptyCells} (${(emptyCells/this.totalCells*100).toFixed(1)}%), ` +
                  `Instability A=${this.instabilityA.toFixed(2)}, B=${this.instabilityB.toFixed(2)}`);
    }
    
    return winner;
  }

  private checkVictory(): 'A' | 'B' | null {
    const aControl = this.countCells(CellState.VIRUS_A);
    const bControl = this.countCells(CellState.VIRUS_B);
    
    const aPercent = (aControl / this.totalCells) * 100;
    const bPercent = (bControl / this.totalCells) * 100;
    
    if (aPercent >= 99) return 'A';
    if (bPercent >= 99) return 'B';
    
    return null;
  }

  public getStats(): { aCells: number; bCells: number; emptyCells: number; aPercent: number; bPercent: number } {
    const aCells = this.countCells(CellState.VIRUS_A);
    const bCells = this.countCells(CellState.VIRUS_B);
    const emptyCells = this.countCells(CellState.EMPTY);
    
    return {
      aCells,
      bCells,
      emptyCells,
      aPercent: (aCells / this.totalCells) * 100,
      bPercent: (bCells / this.totalCells) * 100
    };
  }

  public getGrid(): Cell[][] {
    return this.grid;
  }
}

// Экспортируем класс для использования в основном проекте
export { VirusBattleAlgebra, CellState, type VirusParams, type Cell };

// Экспорт по умолчанию
export default VirusBattleAlgebra;