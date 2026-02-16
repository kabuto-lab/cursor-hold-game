/**
 * Отладочный UI для курсоров
 * Показывает координаты X Y обоих игроков под чатом
 * Мигает зелёным при правом клике
 */
export class CursorDebugUI {
  private container: HTMLDivElement;
  private player1Coords: HTMLSpanElement;
  private player2Coords: HTMLSpanElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '80px'; // Над чатом
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.color = '#00ff00';
    this.container.style.fontFamily = 'Courier New, monospace';
    this.container.style.background = 'rgba(0,0,0,0.7)';
    this.container.style.padding = '10px 20px';
    this.container.style.borderRadius = '0';
    this.container.style.zIndex = '1000';
    this.container.style.pointerEvents = 'none';
    this.container.style.border = '1px solid #00ffff';
    this.container.style.fontSize = '0.9rem';

    this.player1Coords = document.createElement('span');
    this.player1Coords.textContent = 'Player 1: X: 0 Y: 0';
    this.player1Coords.style.marginRight = '40px';

    this.player2Coords = document.createElement('span');
    this.player2Coords.textContent = 'Player 2: X: 0 Y: 0';

    this.container.appendChild(this.player1Coords);
    this.container.appendChild(this.player2Coords);
    document.body.appendChild(this.container);

    // Правый клик — мигание зелёным
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.flashPlayer2(); // мигает второй игрок (кто нажал)
    });
  }

  updatePlayer1(x: number, y: number): void {
    this.player1Coords.textContent = `Player 1: X: ${Math.round(x)} Y: ${Math.round(y)}`;
  }

  updatePlayer2(x: number, y: number): void {
    this.player2Coords.textContent = `Player 2: X: ${Math.round(x)} Y: ${Math.round(y)}`;
  }

  private flashPlayer2(): void {
    const originalBg = this.player2Coords.style.background;
    const originalColor = this.player2Coords.style.color;
    
    this.player2Coords.style.background = '#00ff00';
    this.player2Coords.style.color = '#000000';
    
    setTimeout(() => {
      this.player2Coords.style.background = originalBg;
      this.player2Coords.style.color = originalColor;
    }, 300);
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
