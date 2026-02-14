import * as PIXI from 'pixi.js';
import { Game } from './game';

// Initialize the game when the page loads
window.addEventListener('load', () => {
  const game = new Game();
  game.init();
});

// Handle window resize
window.addEventListener('resize', () => {
  // Notify the game about the resize if it's initialized
  if ((window as any).holdingHandsGame) {
    (window as any).holdingHandsGame.onResize();
  }
});