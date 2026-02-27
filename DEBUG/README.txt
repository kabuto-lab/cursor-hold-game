# TOVCH Debug Package

**Generated:** 2026-02-27  
**Version:** v29  
**Purpose:** AI Debugging Package for Grok

---

## 📁 What's Inside

This package contains all source code files from the TOVCH project in text format for AI analysis.

### Structure:

```
DEBUG/
├── package.json.txt          # Root workspace config
├── prompt.txt                # AI debugging instructions
├── index.html                # This file (navigation)
│
├── client/
│   ├── src/
│   │   ├── main.ts.txt       # Entry point
│   │   ├── core/             # GameEngine, NetworkManager
│   │   ├── features/battle/  # BattleManager, BattleRenderer
│   │   └── ...
│   └── ...
│
└── server/
    └── src/rooms/
        ├── HoldingRoom.ts.txt    # Room logic
        └── schema.ts.txt         # Data schemas
```

---

## 🐛 Known Issue

**BattleRenderer not showing virus cells on canvas**

- Logs show: `RED=1, BLUE=1 → RED=2, BLUE=2` (spreading)
- Progress bar updates correctly
- **BUT:** Canvas shows no red/blue cells

### Expected Fix:

1. BattleRenderer must be initialized at battle start (not in constructor)
2. Grid size must be 20×32 = 640 cells (not 64×36 = 2304)
3. Call `battleRenderer.initGrid(20, 32)` when battle starts

---

## 🔗 Quick Start

1. Open `prompt.txt` for detailed debugging instructions
2. Open `index.html` in browser for navigation
3. Start with `client/src/main.ts.txt` and `client/src/features/battle/BattleRenderer.ts.txt`

---

## 📞 Links

- **Repository:** https://github.com/kabuto-lab/cursor-hold-game
- **Client:** https://cursor-hold-game.onrender.com
- **Server Health:** https://cursor-hold-game-server.onrender.com/health
