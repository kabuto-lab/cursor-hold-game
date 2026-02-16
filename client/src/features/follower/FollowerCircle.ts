import * as PIXI from 'pixi.js';
import { NetworkManager } from '../../core/NetworkManager';

interface FollowerData {
  playerId: string;
  color: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  graphics: PIXI.Graphics | null;
}

export class FollowerCircle {
  private followers: Map<string, FollowerData> = new Map();
  private localPlayerId: string | null = null;
  private isCreator: boolean = false;

  constructor(
    private stage: PIXI.Container,
    private networkManager: NetworkManager
  ) {
    // Подписываемся на сообщение от сервера
    this.networkManager.onMessage('followerUpdate', (data: { playerId: string; x: number; y: number }) => {
      this.updateRemoteFollower(data.playerId, data.x, data.y);
    });

    // Запускаем тикер для интерполяции
    PIXI.Ticker.shared.add((ticker) => this.update(ticker.deltaTime));
  }

  // Устанавливаем, кто мы (creator или joiner)
  setLocalPlayer(playerId: string, isCreator: boolean) {
    this.localPlayerId = playerId;
    this.isCreator = isCreator;
    console.log(`[FollowerCircle] Local player set: ${playerId}, isCreator: ${isCreator}`);
  }

  // Локальное обновление позиции мыши (вызывается из InputManager или main)
  updateLocalPosition(x: number, y: number) {
    if (!this.localPlayerId) return;

    // Отправляем свою позицию серверу (каждые ~50 мс — можно регулировать)
    if (Math.random() < 0.1) { // ~50 мс при 60 fps
      this.networkManager.sendToRoom('followerUpdate', { x, y });
    }

    // Если мы joiner — обновляем свой круг у создателя (но свой не рисуем)
    if (!this.isCreator) {
      const creatorFollower = this.followers.get('creator');
      if (creatorFollower) {
        creatorFollower.targetX = x;
        creatorFollower.targetY = y;
      }
    }
  }

  private updateRemoteFollower(playerId: string, x: number, y: number) {
    let follower = this.followers.get(playerId);

    if (!follower) {
      follower = {
        playerId,
        color: playerId === 'creator' ? 0xff0000 : 0x0000ff, // красный для создателя, синий для joiner
        targetX: x,
        targetY: y,
        currentX: x,
        currentY: y,
        graphics: null,
      };
      this.followers.set(playerId, follower);
    }

    follower.targetX = x;
    follower.targetY = y;

    // Создаём графику, если ещё нет
    if (!follower.graphics) {
      const g = new PIXI.Graphics();
      g.beginFill(follower.color, 0.7);
      g.drawCircle(0, 0, 15);
      g.endFill();
      g.stroke({ width: 3, color: 0xffffff });
      g.alpha = 0.8;
      g.visible = true;
      g.zIndex = 1000;

      this.stage.addChild(g);
      follower.graphics = g;
      console.log(`[FollowerCircle] Created follower graphics for ${playerId}`);
    }
  }

  private update(delta: number) {
    this.followers.forEach((follower) => {
      if (!follower.graphics) return;

      // Интерполяция с запаздыванием
      const lerp = 0.15; // регулируй для большего/меньшего запаздывания
      follower.currentX += (follower.targetX - follower.currentX) * lerp * delta;
      follower.currentY += (follower.targetY - follower.currentY) * lerp * delta;

      follower.graphics.position.set(follower.currentX, follower.currentY);

      // Скрываем свой круг
      if (follower.playerId === this.localPlayerId) {
        follower.graphics.visible = false;
      }
    });
  }

  // Вызывается при присоединении/создании комнаты
  onRoomJoined(isCreator: boolean, localPlayerId: string) {
    this.setLocalPlayer(localPlayerId, isCreator);
  }

  // Очистка при выходе из комнаты
  destroy() {
    this.followers.forEach((f) => {
      if (f.graphics) this.stage.removeChild(f.graphics);
    });
    this.followers.clear();
  }
}
