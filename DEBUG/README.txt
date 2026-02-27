# TOVCH Debug Package — README

**Generated:** 2026-02-27  
**Version:** v30  
**Purpose:** AI Debugging Package for Grok

---

## 📁 FLAT STRUCTURE

Все файлы находятся в **корне** этой папки (плоская структура).

**Имена файлов содержат префиксы**, указывающие на их расположение в проекте:

```
client.src.main.ts.txt              = client/src/main.ts
client.src.core.GameEngine.ts.txt   = client/src/core/GameEngine.ts
server.src.rooms.HoldingRoom.ts.txt = server/src/rooms/HoldingRoom.ts
```

---

## 📄 ФОРМАТ КАЖДОГО ФАЙЛА

Каждый файл начинается с заголовка:

```txt
========================================
ORIGINAL FILE PATH: C:\__Qwen1\TOVCH\client\src\main.ts
========================================

[полное содержимое файла...]
```

---

## 🎯 НАЧНИ ОТСЮДА

1. **prompt.txt** — детальная инструкция для AI
2. **index.html** — навигация по файлам (открой в браузере)
3. **client.src.main.ts.txt** — точка входа
4. **client.src.features.battle.BattleRenderer.ts.txt** — визуализация
5. **client.src.features.battle.BattleManager.ts.txt** — логика битвы

---

## 🐛 ИЗВЕСТНАЯ ПРОБЛЕМА

**BattleRenderer не отображает клетки вирусов на canvas**

**Симптомы:**
- Логи: `RED=1, BLUE=1 → RED=2, BLUE=2`
- Прогресс-бар работает
- Canvas пустой

**Причина:**
- Grid size mismatch: 640 != 2304
- BattleRenderer инициализируется с неправильными размерами

**Решение:**
- Инициализировать BattleRenderer при старте битвы
- Вызвать `initGrid(20, 32)` в `onVirusBattleStarted`

---

## 📞 CONTACTS

- **Repository:** https://github.com/kabuto-lab/cursor-hold-game
- **Client:** https://cursor-hold-game.onrender.com
- **Server:** https://cursor-hold-game-server.onrender.com/health
