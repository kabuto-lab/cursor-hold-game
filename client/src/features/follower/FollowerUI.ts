/**
 * UI для отображения координат follower circles
 * Показывает координаты обоих игроков в реальном времени
 */
export class FollowerUI {
  private container: HTMLDivElement;
  private creatorCoords: HTMLSpanElement;
  private joinerCoords: HTMLSpanElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '80px';
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
    this.container.style.display = 'flex';
    this.container.style.gap = '40px';

    // Координаты создателя (красный круг)
    this.creatorCoords = document.createElement('span');
    this.creatorCoords.innerHTML = '<span style="color: #ff0000;">🔴 Creator:</span> X: 0 Y: 0';
    
    // Координаты присоединившегося (синий круг)
    this.joinerCoords = document.createElement('span');
    this.joinerCoords.innerHTML = '<span style="color: #0000ff;">🔵 Joiner:</span> X: 0 Y: 0';

    this.container.appendChild(this.creatorCoords);
    this.container.appendChild(this.joinerCoords);
    document.body.appendChild(this.container);
  }

  updateCreator(x: number, y: number): void {
    this.creatorCoords.innerHTML = `<span style="color: #ff0000;">🔴 Creator:</span> X: ${Math.round(x)} Y: ${Math.round(y)}`;
  }

  updateJoiner(x: number, y: number): void {
    this.joinerCoords.innerHTML = `<span style="color: #0000ff;">🔵 Joiner:</span> X: ${Math.round(x)} Y: ${Math.round(y)}`;
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
