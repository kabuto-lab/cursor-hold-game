/**
 * Менеджер ввода
 * Обрабатывает клавиатуру и мышь
 */
export class InputManager {
  private keyboardState: Map<string, boolean>;
  private mouseState: {
    x: number;
    y: number;
    leftButton: boolean;
    rightButton: boolean;
  };

  // Callback для обновления позиции мыши (для follower circle)
  public onMouseMove?: (x: number, y: number) => void;

  constructor() {
    this.keyboardState = new Map();
    this.mouseState = {
      x: 0,
      y: 0,
      leftButton: false,
      rightButton: false
    };

    this.setupEventListeners();
  }

  /**
   * Установить обработчики событий
   */
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keyboardState.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keyboardState.set(e.code, false);
    });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
      // Mouse position relative to viewport (canvas is full screen at 0,0)
      this.mouseState.x = e.clientX;
      this.mouseState.y = e.clientY;

      // Вызываем callback для follower circle
      if (this.onMouseMove) {
        this.onMouseMove(this.mouseState.x, this.mouseState.y);
      }
    });

    window.addEventListener('mousedown', (e) => {
      switch (e.button) {
        case 0: // Left button
          this.mouseState.leftButton = true;
          break;
        case 2: // Right button
          this.mouseState.rightButton = true;
          break;
      }
    });

    window.addEventListener('mouseup', (e) => {
      switch (e.button) {
        case 0: // Left button
          this.mouseState.leftButton = false;
          break;
        case 2: // Right button
          this.mouseState.rightButton = false;
          break;
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Проверить, нажата ли клавиша
   */
  isKeyPressed(keyCode: string): boolean {
    return this.keyboardState.get(keyCode) === true;
  }

  /**
   * Получить состояние мыши
   */
  getMouseState(): { x: number; y: number; leftButton: boolean; rightButton: boolean } {
    return { ...this.mouseState };
  }

  /**
   * Получить позицию мыши
   */
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseState.x, y: this.mouseState.y };
  }
}