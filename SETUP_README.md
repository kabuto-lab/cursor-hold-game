# TOVCH (VYRU5) - Multiplayer Viral Battle Arena

## Quick Start

### Prerequisites
- Node.js v16 or higher
- npm

### Installation

1. **Install root dependencies:**
```bash
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
cd ..
```

3. **Install server dependencies:**
```bash
cd server
npm install
cd ..
```

### Running the Game

**Option 1: Run both client and server together**
```bash
npm run start
```

**Option 2: Run separately in different terminals**
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Access the Game

Open your browser and navigate to:
- **Client:** http://localhost:3000
- **Server Health Check:** http://localhost:2567/health

### How to Play

1. **Player 1:** Click "CREATE ROOM" to create a new room
2. **Player 1:** Copy the Room ID from the top panel
3. **Player 1:** Share the Room ID with Player 2
4. **Player 2:** Enter the Room ID and click "JOIN ROOM"
5. Both players can now:
   - See each other's mouse cursors (red for P1, blue for P2)
   - Chat using the chat panel (left sidebar)
   - Customize virus parameters (right sidebar)
   - Drag the center orb
   - Click "READY" to start the virus battle

## Project Structure

```
TOVCH/
├── package.json           # Root workspace config
├── client/                # Frontend (TypeScript + PixiJS + Vite)
│   ├── index.html        # Main HTML with CSS styles
│   ├── package.json      # Client dependencies
│   ├── tsconfig.json     # TypeScript config
│   ├── vite.config.ts    # Vite bundler config
│   └── src/              # Source code
│       ├── main.ts       # Entry point
│       ├── core/         # GameEngine, NetworkManager, InputManager
│       ├── ui/           # UIController
│       ├── chat/         # ChatManager
│       ├── features/     # MFL, Draggable, Battle systems
│       └── types/        # TypeScript type definitions
├── server/               # Backend (Node.js + Colyseus)
│   ├── package.json      # Server dependencies
│   ├── tsconfig.json     # TypeScript config
│   └── src/
│       ├── index.ts      # Server entry point
│       └── rooms/        # HoldingRoom.ts, schema.ts
└── fnt/                  # Font files (PIXY, etc.)
```

## Tech Stack

- **Frontend:** TypeScript, PixiJS v8, Vite, Colyseus.js
- **Backend:** Node.js, Colyseus, Express
- **Network:** WebSocket (Colyseus protocol)

## Controls

- **Mouse:** Move cursor, click to interact
- **Spacebar:** Hold hands (alternative)
- **Escape:** Release hold
- **Arrow Keys:** Cursor movement

## Features

- ✅ Real-time mouse cursor synchronization
- ✅ Draggable center orb with hover sync
- ✅ In-game chat
- ✅ Virus parameter customization (12 parameters)
- ✅ Battle grid simulation (32×20)
- ✅ Retro 8-bit aesthetics

## Troubleshooting

**Connection issues:**
- Make sure both terminals are running
- Check that ports 3000 and 2567 are not in use
- Clear browser cache (Ctrl+Shift+Delete)

**Build errors:**
- Delete `node_modules` folders
- Run `npm install` again
- Restart the development servers

## License

MIT
