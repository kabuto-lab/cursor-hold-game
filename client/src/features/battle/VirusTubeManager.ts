/**
 * VirusTubeManager - управляет интерактивными пробирками параметров вируса
 * 
 * Функционал:
 * - 12 параметров вируса в сетке 3×4
 * - Максимум 12 очков на все параметры
 * - Клик по пробирке → +1 (если есть очки)
 * - Клик по emoji/названию/цифре → -1
 * - Анимация капли, всплеска, пузырьков
 * - Синхронизация с сервером через callback
 */

export class VirusTubeManager {
  private params: Map<string, number>;
  private maxTotalPoints: number = 12;
  private maxPerParam: number = 10;
  private onParamsChangeCallback?: (params: { [key: string]: number }) => void;
  
  // DOM элементы
  private paramCells: Map<string, HTMLElement>;
  private paramValues: Map<string, HTMLElement>;
  private paramLiquids: Map<string, HTMLElement>;
  private pointsRemainingElement: HTMLElement | null;
  private randomizeBtn: HTMLButtonElement | null;
  private readyBtn: HTMLButtonElement | null;

  // Цвета для каждого параметра (совпадают с CSS)
  private readonly paramColors: { [key: string]: string } = {
    aggression: '#ff0000',      // Red for ⚔️
    mutation: '#800080',        // Purple for 🧬
    speed: '#ffa500',           // Orange for ⚡
    defense: '#0000ff',         // Blue for 🛡️
    reproduction: '#008000',    // Green for 🦠
    stealth: '#808080',         // Gray for 👻
    virulence: '#800000',       // Maroon for ☣️
    resilience: '#ffc0cb',      // Pink for 💪
    mobility: '#8b4513',        // Brown for 🚶
    intellect: '#ffff00',       // Yellow for 🧠
    contagiousness: '#00ffff',  // Cyan for 🫁
    lethality: '#000000',       // Black for 💀
  };

  constructor() {
    this.params = new Map();
    this.paramCells = new Map();
    this.paramValues = new Map();
    this.paramLiquids = new Map();
    this.pointsRemainingElement = null;
    this.randomizeBtn = null;
    this.readyBtn = null;

    // Инициализация параметров
    this.initializeParams();
    
    // Поиск DOM элементов
    this.findElements();
    
    // Установка обработчиков событий
    this.setupEventListeners();
    
    // Первоначальное обновление UI
    this.updateDisplay();
  }

  /**
   * Инициализация всех 12 параметров нулями
   */
  private initializeParams(): void {
    const paramNames = [
      'aggression', 'mutation', 'speed',
      'defense', 'reproduction', 'stealth',
      'virulence', 'resilience', 'mobility',
      'intellect', 'contagiousness', 'lethality'
    ];

    paramNames.forEach(name => {
      this.params.set(name, 0);
    });
  }

  /**
   * Поиск всех DOM элементов пробирок
   */
  private findElements(): void {
    // Находим все .param-cell
    const cells = document.querySelectorAll('.param-cell');
    cells.forEach(cell => {
      const paramName = cell.getAttribute('data-param');
      if (paramName) {
        this.paramCells.set(paramName, cell as HTMLElement);
        
        // Находим value и liquid внутри ячейки
        const valueEl = cell.querySelector('.param-value');
        const liquidEl = cell.querySelector('.param-liquid');
        
        if (valueEl) {
          this.paramValues.set(paramName, valueEl as HTMLElement);
        }
        if (liquidEl) {
          this.paramLiquids.set(paramName, liquidEl as HTMLElement);
        }
      }
    });

    // Находим счётчик очков
    this.pointsRemainingElement = document.getElementById('points-remaining');
    
    // Находим кнопки
    this.randomizeBtn = document.getElementById('randomizeBtn') as HTMLButtonElement;
    this.readyBtn = document.getElementById('readyBtn') as HTMLButtonElement;
  }

  /**
   * Установка обработчиков событий
   */
  private setupEventListeners(): void {
    // Обработчики для каждой пробирки
    this.paramCells.forEach((cell, paramName) => {
      // Клик по самой пробирке (но НЕ по emoji/названию/цифре) → +1
      cell.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Если кликнули по emoji, названию или цифре — игнорируем (у них свои обработчики)
        if (target.classList.contains('param-emoji') || 
            target.classList.contains('param-name') || 
            target.classList.contains('param-value')) {
          return;
        }
        
        this.addPoint(paramName);
      });

      // Клик по emoji → -1
      const emojiEl = cell.querySelector('.param-emoji');
      if (emojiEl) {
        emojiEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removePoint(paramName);
        });
      }

      // Клик по названию → -1
      const nameEl = cell.querySelector('.param-name');
      if (nameEl) {
        nameEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removePoint(paramName);
        });
      }

      // Клик по цифре → -1
      const valueEl = cell.querySelector('.param-value');
      if (valueEl) {
        valueEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removePoint(paramName);
        });
      }
    });
  }

  /**
   * Добавить очко к параметру
   */
  addPoint(paramName: string): boolean {
    const currentValue = this.params.get(paramName) || 0;
    const usedPoints = this.getUsedPoints();

    // Проверка: не превышен ли лимит на параметр
    if (currentValue >= this.maxPerParam) {
      console.log(`[VirusTube] Parameter ${paramName} already at max (${this.maxPerParam})`);
      return false;
    }

    // Проверка: не использованы ли все очки
    if (usedPoints >= this.maxTotalPoints) {
      console.log(`[VirusTube] All points used (${this.maxTotalPoints}/${this.maxTotalPoints})`);
      return false;
    }

    // Увеличиваем значение
    this.params.set(paramName, currentValue + 1);
    
    // Запускаем анимацию
    this.playDropAnimation(paramName);
    
    // Обновляем UI
    this.updateDisplay();
    
    // Вызываем callback
    this.notifyParamsChange();

    console.log(`[VirusTube] Added point to ${paramName}: ${currentValue} → ${currentValue + 1}`);
    return true;
  }

  /**
   * Убрать очко от параметра
   */
  removePoint(paramName: string): boolean {
    const currentValue = this.params.get(paramName) || 0;

    // Проверка: не ноль ли уже
    if (currentValue <= 0) {
      console.log(`[VirusTube] Parameter ${paramName} already at 0`);
      return false;
    }

    // Уменьшаем значение
    this.params.set(paramName, currentValue - 1);
    
    // Обновляем UI
    this.updateDisplay();
    
    // Вызываем callback
    this.notifyParamsChange();

    console.log(`[VirusTube] Removed point from ${paramName}: ${currentValue} → ${currentValue - 1}`);
    return true;
  }

  /**
   * Получить количество использованных очков
   */
  private getUsedPoints(): number {
    let total = 0;
    this.params.forEach(value => {
      total += value;
    });
    return total;
  }

  /**
   * Обновить отображение всех параметров
   */
  updateDisplay(): void {
    // Обновляем каждую пробирку
    this.params.forEach((value, paramName) => {
      // Обновляем цифру
      const valueEl = this.paramValues.get(paramName);
      if (valueEl) {
        valueEl.textContent = value.toString();
      }

      // Обновляем высоту жидкости
      const liquidEl = this.paramLiquids.get(paramName);
      if (liquidEl) {
        const heightPercent = (value / this.maxPerParam) * 100;
        liquidEl.style.height = `${heightPercent}%`;
      }

      // Обновляем состояние disabled для пробирки
      const cell = this.paramCells.get(paramName);
      if (cell) {
        const usedPoints = this.getUsedPoints();
        const isFull = value >= this.maxPerParam;
        const noPointsLeft = usedPoints >= this.maxTotalPoints && value === 0;
        
        if (isFull || noPointsLeft) {
          cell.classList.add('disabled');
        } else {
          cell.classList.remove('disabled');
        }
      }
    });

    // Обновляем счётчик оставшихся очков
    if (this.pointsRemainingElement) {
      const remaining = this.maxTotalPoints - this.getUsedPoints();
      this.pointsRemainingElement.textContent = remaining.toString();
    }

    // Обновляем состояние кнопки READY
    if (this.readyBtn) {
      const usedPoints = this.getUsedPoints();
      if (usedPoints === this.maxTotalPoints) {
        this.readyBtn.disabled = false;
        this.readyBtn.style.opacity = '1';
      } else {
        this.readyBtn.disabled = true;
        this.readyBtn.style.opacity = '0.5';
      }
    }
  }

  /**
   * Проиграть анимацию капли для параметра
   */
  private playDropAnimation(paramName: string): void {
    const cell = this.paramCells.get(paramName);
    if (!cell) return;

    const color = this.paramColors[paramName] || '#00ffff';

    // Создаём каплю
    const drop = document.createElement('div');
    drop.className = 'tube-drop';
    drop.style.setProperty('--tube-color', color);
    cell.appendChild(drop);

    // Запускаем падение
    requestAnimationFrame(() => {
      drop.classList.add('falling');
    });

    // После падения: всплеск и пузырьки
    setTimeout(() => {
      this.playSplashEffect(cell, color);
      this.playBubblesEffect(cell, color);
      
      // Удаляем каплю
      drop.remove();
    }, 400);
  }

  /**
   * Эффект всплеска
   */
  private playSplashEffect(cell: HTMLElement, color: string): void {
    const splash = document.createElement('div');
    splash.className = 'tube-splash';
    splash.style.background = `rgba(255, 255, 255, 0.6)`;
    cell.appendChild(splash);

    requestAnimationFrame(() => {
      splash.classList.add('active');
    });

    setTimeout(() => {
      splash.remove();
    }, 400);
  }

  /**
   * Эффект пузырьков (2-3 пузырька)
   */
  private playBubblesEffect(cell: HTMLElement, color: string): void {
    const bubbleCount = 2 + Math.floor(Math.random() * 2); // 2 or 3

    for (let i = 0; i < bubbleCount; i++) {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'tube-bubble';
        
        // Случайная позиция и размер
        const left = 20 + Math.random() * 60; // 20-80%
        const size = 4 + Math.random() * 4; // 4-8px
        
        bubble.style.left = `${left}%`;
        bubble.style.bottom = '10%';
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.background = `rgba(255, 255, 255, 0.4)`;
        
        cell.appendChild(bubble);

        setTimeout(() => {
          bubble.remove();
        }, 1500);
      }, i * 200);
    }
  }

  /**
   * Случайное распределение 12 очков
   */
  randomize(): void {
    // Сброс
    this.params.forEach((_, key) => {
      this.params.set(key, 0);
    });

    // Распределяем 12 очков случайно
    let pointsLeft = this.maxTotalPoints;
    const paramKeys = Array.from(this.params.keys());

    while (pointsLeft > 0) {
      // Выбираем случайный параметр
      const randomIndex = Math.floor(Math.random() * paramKeys.length);
      const paramName = paramKeys[randomIndex];
      const currentValue = this.params.get(paramName) || 0;

      // Если ещё не достигнут максимум для этого параметра
      if (currentValue < this.maxPerParam) {
        this.params.set(paramName, currentValue + 1);
        pointsLeft--;
      }
    }

    // Обновляем UI
    this.updateDisplay();
    
    // Вызываем callback
    this.notifyParamsChange();

    console.log('[VirusTube] Randomized params:', Object.fromEntries(this.params));
  }

  /**
   * Сбросить все параметры в 0
   */
  reset(): void {
    this.params.forEach((_, key) => {
      this.params.set(key, 0);
    });

    this.updateDisplay();
    this.notifyParamsChange();

    console.log('[VirusTube] Reset all params to 0');
  }

  /**
   * Получить текущие значения параметров
   */
  getParams(): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    this.params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Установить callback при изменении параметров
   */
  setOnParamsChange(callback: (params: { [key: string]: number }) => void): void {
    this.onParamsChangeCallback = callback;
  }

  /**
   * Уведомить об изменении параметров
   */
  private notifyParamsChange(): void {
    if (this.onParamsChangeCallback) {
      this.onParamsChangeCallback(this.getParams());
    }
  }

  /**
   * Установить параметры извне (при получении от сервера)
   */
  setParams(params: { [key: string]: number }): void {
    Object.entries(params).forEach(([key, value]) => {
      if (this.params.has(key)) {
        this.params.set(key, value);
      }
    });

    this.updateDisplay();
    console.log('[VirusTube] Set params from external:', params);
  }

  /**
   * Получить количество оставшихся очков
   */
  getRemainingPoints(): number {
    return this.maxTotalPoints - this.getUsedPoints();
  }

  /**
   * Проверить, все ли очки распределены
   */
  isMaxedOut(): boolean {
    return this.getUsedPoints() >= this.maxTotalPoints;
  }
}
