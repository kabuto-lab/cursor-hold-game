/**
 * VirusParamsUI.ts
 * DOM UI for virus parameters
 */

import { VirusParams } from './BattleManager';

export interface VirusParamsCallbacks {
  onParamsChanged?: (params: VirusParams) => void;
  onReady?: (params: VirusParams) => void;
}

export class VirusParamsUI {
  private container: HTMLElement;
  private paramElements: Map<string, { valueElement: HTMLElement; incrementBtn: HTMLElement; decrementBtn: HTMLElement }> = new Map();
  private readyButton: HTMLButtonElement;
  private pointsRemainingElement: HTMLElement;
  private totalPoints: number = 12;
  private currentPoints: number = 12;
  private params: VirusParams;
  private callbacks: VirusParamsCallbacks = {};

  constructor(containerId: string, callbacks: VirusParamsCallbacks = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    
    this.container = container;
    this.callbacks = callbacks;
    this.initializeParams();
    this.createUI();
    this.updateUI();
  }

  private initializeParams(): void {
    this.params = {
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

  private createUI(): void {
    // Clear container
    this.container.innerHTML = '';

    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Virus Parameters';
    title.style.color = '#00ff00';
    title.style.fontFamily = 'Courier New, monospace';
    title.style.marginBottom = '10px';
    this.container.appendChild(title);

    // Create points counter
    this.pointsRemainingElement = document.createElement('div');
    this.pointsRemainingElement.id = 'points-remaining';
    this.pointsRemainingElement.style.color = '#00ff00';
    this.pointsRemainingElement.style.fontFamily = 'Courier New, monospace';
    this.pointsRemainingElement.style.marginBottom = '10px';
    this.container.appendChild(this.pointsRemainingElement);

    // Create param grid (3x4)
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    gridContainer.style.gap = '5px';
    gridContainer.style.marginBottom = '10px';
    this.container.appendChild(gridContainer);

    // Define parameter info
    const paramInfo = [
      { name: 'aggression', emoji: '⚔️', displayName: 'Aggression' },
      { name: 'mutation', emoji: '🧬', displayName: 'Mutation' },
      { name: 'speed', emoji: '⚡', displayName: 'Speed' },
      { name: 'defense', emoji: '🛡️', displayName: 'Defense' },
      { name: 'reproduction', emoji: '🦠', displayName: 'Reproduction' },
      { name: 'stealth', emoji: '👻', displayName: 'Stealth' },
      { name: 'virulence', emoji: '☣️', displayName: 'Virulence' },
      { name: 'resilience', emoji: '💪', displayName: 'Resilience' },
      { name: 'mobility', emoji: '🚶', displayName: 'Mobility' },
      { name: 'intellect', emoji: '🧠', displayName: 'Intellect' },
      { name: 'contagiousness', emoji: '🫁', displayName: 'Contagiousness' },
      { name: 'lethality', emoji: '💀', displayName: 'Lethality' },
    ];

    // Create parameter elements
    paramInfo.forEach(param => {
      const paramDiv = document.createElement('div');
      paramDiv.className = 'param-cell';
      paramDiv.dataset.param = param.name;
      paramDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      paramDiv.style.border = '1px solid #00ffff';
      paramDiv.style.padding = '5px';
      paramDiv.style.cursor = 'pointer';
      paramDiv.style.borderRadius = '0 0 5px 5px';
      paramDiv.style.overflow = 'hidden';
      paramDiv.style.textAlign = 'center';

      const emoji = document.createElement('div');
      emoji.className = 'param-emoji';
      emoji.textContent = param.emoji;
      emoji.style.fontSize = '1.5rem';
      emoji.style.marginBottom = '3px';
      emoji.style.display = 'block';
      paramDiv.appendChild(emoji);

      const name = document.createElement('div');
      name.className = 'param-name';
      name.textContent = param.displayName;
      name.style.fontSize = '0.7rem';
      name.style.color = '#00ff00';
      name.style.marginBottom = '3px';
      paramDiv.appendChild(name);

      const value = document.createElement('div');
      value.className = 'param-value';
      value.id = `param-${param.name}`;
      value.style.fontSize = '1rem';
      value.style.color = '#ffff00';
      value.style.fontWeight = 'bold';
      paramDiv.appendChild(value);

      const liquid = document.createElement('div');
      liquid.className = 'param-liquid';
      liquid.style.position = 'absolute';
      liquid.style.bottom = '0';
      liquid.style.left = '0';
      liquid.style.width = '100%';
      liquid.style.height = '0%';
      liquid.style.zIndex = '1';
      // Set specific color based on param
      this.setLiquidColor(liquid, param.name);
      paramDiv.appendChild(liquid);

      gridContainer.appendChild(paramDiv);

      // Store references
      this.paramElements.set(param.name, {
        valueElement: value,
        incrementBtn: paramDiv, // Clicking the whole cell increments
        decrementBtn: name // Clicking the name decrements
      });

      // Add event listeners
      paramDiv.addEventListener('click', () => this.incrementParam(param.name));
      name.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent increment when clicking name
        this.decrementParam(param.name);
      });
    });

    // Create ready button
    this.readyButton = document.createElement('button');
    this.readyButton.id = 'readyBtn';
    this.readyButton.textContent = 'READY';
    this.readyButton.style.width = '100%';
    this.readyButton.style.marginTop = '10px';
    this.readyButton.style.backgroundColor = '#ff00ff';
    this.readyButton.style.color = '#0f0f23';
    this.readyButton.style.border = 'none';
    this.readyButton.style.padding = '12px';
    this.readyButton.style.fontFamily = 'Courier New, monospace';
    this.readyButton.style.fontSize = '1.2rem';
    this.readyButton.style.cursor = 'pointer';
    this.readyButton.addEventListener('click', () => this.handleReady());
    this.container.appendChild(this.readyButton);
  }

  private setLiquidColor(liquidElement: HTMLElement, paramName: string): void {
    const colors: Record<string, string> = {
      'aggression': 'rgba(255, 0, 0, 0.6)', // Red for ⚔️
      'mutation': 'rgba(128, 0, 128, 0.6)', // Purple for 🧬
      'speed': 'rgba(255, 165, 0, 0.6)', // Orange for ⚡
      'defense': 'rgba(0, 0, 255, 0.6)', // Blue for 🛡️
      'reproduction': 'rgba(0, 128, 0, 0.6)', // Green for 🦠
      'stealth': 'rgba(128, 128, 128, 0.6)', // Gray for 👻
      'virulence': 'rgba(128, 0, 0, 0.6)', // Maroon for ☣️
      'resilience': 'rgba(255, 192, 203, 0.6)', // Pink for 💪
      'mobility': 'rgba(139, 69, 19, 0.6)', // Brown for 🚶
      'intellect': 'rgba(255, 255, 0, 0.6)', // Yellow for 🧠
      'contagiousness': 'rgba(0, 255, 255, 0.6)', // Cyan for 🫁
      'lethality': 'rgba(0, 0, 0, 0.6)', // Black for 💀
    };

    liquidElement.style.backgroundColor = colors[paramName] || 'rgba(0, 0, 0, 0.6)';
  }

  private incrementParam(paramName: keyof VirusParams): void {
    if (this.currentPoints > 0 && this.params[paramName] < 12) {
      this.params[paramName]++;
      this.currentPoints--;
      this.updateUI();
      this.notifyParamsChanged();
    }
  }

  private decrementParam(paramName: keyof VirusParams): void {
    if (this.params[paramName] > 0) {
      this.params[paramName]--;
      this.currentPoints++;
      this.updateUI();
      this.notifyParamsChanged();
    }
  }

  private updateUI(): void {
    // Update param values
    Object.entries(this.params).forEach(([paramName, value]) => {
      const element = this.paramElements.get(paramName)?.valueElement;
      if (element) {
        element.textContent = value.toString();
        
        // Update liquid height based on value
        const liquidElement = element.parentElement?.querySelector('.param-liquid') as HTMLElement;
        if (liquidElement) {
          // Calculate height as percentage of max value (12)
          const heightPercentage = (value / 12) * 100;
          liquidElement.style.height = `${heightPercentage}%`;
        }
      }
    });

    // Update points remaining
    this.pointsRemainingElement.textContent = `Points remaining: ${this.currentPoints}`;

    // Update ready button state
    this.readyButton.disabled = this.currentPoints !== 0;
    this.readyButton.style.opacity = this.currentPoints === 0 ? '1' : '0.5';
  }

  private notifyParamsChanged(): void {
    if (this.callbacks.onParamsChanged) {
      this.callbacks.onParamsChanged({ ...this.params });
    }
  }

  private handleReady(): void {
    if (this.currentPoints === 0 && this.callbacks.onReady) {
      this.callbacks.onReady({ ...this.params });
    }
  }

  getParams(): VirusParams {
    return { ...this.params };
  }

  setParams(params: VirusParams): void {
    // Calculate total assigned points to determine remaining
    const totalAssigned = Object.values(params).reduce((sum, val) => sum + val, 0);
    this.currentPoints = this.totalPoints - totalAssigned;
    
    // Apply the new params
    this.params = { ...params };
    this.updateUI();
  }

  setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }

  destroy(): void {
    // Remove event listeners
    this.paramElements.forEach(({ incrementBtn, decrementBtn }) => {
      // Note: In this simplified version, we're not removing individual listeners
      // In a real implementation, you'd want to properly clean up event listeners
    });
    
    this.readyButton.removeEventListener('click', this.handleReady.bind(this));
    
    // Clear container
    this.container.innerHTML = '';
  }
}