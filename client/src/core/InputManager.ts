/**
 * InputManager.ts
 * Manages keyboard and mouse input
 */

export interface InputCallbacks {
  onMouseMove?: (x: number, y: number) => void;
  onMouseDown?: (x: number, y: number, button: number) => void;
  onMouseUp?: (x: number, y: number, button: number) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onClick?: (x: number, y: number) => void;
}

export class InputManager {
  private callbacks: InputCallbacks = {};
  private element: HTMLElement | Window;
  private isInitialized: boolean = false;

  constructor(element: HTMLElement | Window = window) {
    this.element = element;
  }

  setCallbacks(callbacks: InputCallbacks): void {
    this.callbacks = callbacks;
  }

  initialize(): void {
    if (this.isInitialized) return;

    // Mouse events
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('click', this.handleClick.bind(this));

    // Keyboard events
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.element.addEventListener('keyup', this.handleKeyUp.bind(this));

    this.isInitialized = true;
  }

  destroy(): void {
    if (!this.isInitialized) return;

    // Remove mouse events
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('click', this.handleClick.bind(this));

    // Remove keyboard events
    this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.element.removeEventListener('keyup', this.handleKeyUp.bind(this));

    this.isInitialized = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.callbacks.onMouseMove) {
      this.callbacks.onMouseMove(event.clientX, event.clientY);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.callbacks.onMouseDown) {
      this.callbacks.onMouseDown(event.clientX, event.clientY, event.button);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.callbacks.onMouseUp) {
      this.callbacks.onMouseUp(event.clientX, event.clientY, event.button);
    }
  }

  private handleClick(event: MouseEvent): void {
    if (this.callbacks.onClick) {
      this.callbacks.onClick(event.clientX, event.clientY);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.callbacks.onKeyDown) {
      this.callbacks.onKeyDown(event);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.callbacks.onKeyUp) {
      this.callbacks.onKeyUp(event);
    }
  }
}