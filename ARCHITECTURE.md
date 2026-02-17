# TOVCH (VYRU5) — Complete Project Architecture

**Version:** v9  
**Last Updated:** 2026-02-17  
**Type:** 2-Player Real-Time Multiplayer Browser Game  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Diagram](#architecture-diagram)
5. [File-by-File Explanation](#file-by-file-explanation)
6. [Network Communication](#network-communication)
7. [Build & Deployment](#build--deployment)
8. [Replication Guide](#replication-guide)

---

## 🎮 Project Overview

**TOVCH** (Digital Hand Holding Game / VYRU5) is a real-time collaborative browser game for 2 players. Players connect via a shared room, see each other's mouse cursors as colored followers, and can interact with a draggable center orb. The game features retro 8-bit aesthetics with modern WebSocket synchronization.

### Core Features
- **Room System:** Create/join rooms via shareable IDs
- **Mouse Followers (MFL):** Real-time cursor synchronization (red for P1, blue for P2)
- **Draggable Orb:** Center object with synchronized hover/drag states
- **In-Game Chat:** Real-time messaging within rooms
- **Virus Battle UI:** 12-parameter virus customization (work in progress)
- **Retro Visual Style:** Neon colors, CRT effects, pixel art aesthetic

---

## 🛠 Tech Stack

### Frontend (Client)
| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | ^5.0.2 | Type-safe JavaScript |
| **PixiJS** | ^8.16.0 | 2D WebGL rendering |
| **Vite** | ^5.0.0 | Build tool & dev server |
| **Colyseus.js** | ^0.15.28 | WebSocket client |
| **Pixi Filters** | ^5.x.x | Bloom, CRT, Noise, Pixelate effects |

### Backend (Server)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v16+ | Runtime environment |
| **TypeScript** | ^5.0.2 | Type-safe JavaScript |
| **Colyseus** | ^0.15.0 | Multiplayer framework |
| **Express** | ^4.18.2 | HTTP server |
| **@colyseus/schema** | ^2.0.0 | State synchronization |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Render** | Deployment (client + server) |
| **npm workspaces** | Monorepo management |
| **Husky + lint-staged** | Git hooks |

---

## 📁 Project Structure

```
TOVCH/
├── 📄 package.json                 # Root workspace config
├── 📄 README.md                    # User-facing documentation
├── 📄 ARCHITECTURE.md              # This file (developer docs)
├── 📄 .gitignore                   # Git ignore rules
├── 📄 commit_changes.bat           # Windows commit script
│
├── 📂 client/                      # Frontend application
│   ├── 📄 package.json            # Client dependencies & scripts
│   ├── 📄 tsconfig.json           # TypeScript compiler config
│   ├── 📄 vite.config.ts          # Vite bundler config
│   ├── 📄 index.html              # Main HTML + CSS styles
│   ├── 📂 src/                    # Source code
│   │   ├── 📄 main.ts             # Application entry point
│   │   ├── 📄 NetworkManager.ts   # (DEPRECATED - legacy file)
│   │   ├── 📂 core/               # Core systems
│   │   │   ├── 📄 GameEngine.ts   # PixiJS initialization
│   │   │   ├── 📄 InputManager.ts # Mouse/keyboard handling
│   │   │   └── 📄 NetworkManager.ts # Colyseus client wrapper
│   │   ├── 📂 ui/                 # UI management
│   │   │   └── 📄 UIController.ts # Lobby/room UI, sidebars
│   │   ├── 📂 chat/               # Chat functionality
│   │   │   ├── 📄 ChatManager.ts  # In-room chat
│   │   │   └── 📄 DraggableChatManager.ts # Draggable chat window
│   │   ├── 📂 features/           # Game features
│   │   │   ├── 📂 mouse-follower/ # Mouse follower system (MFL)
│   │   │   │   └── 📄 MouseFollowerManager.ts
│   │   │   ├── 📂 draggable/      # Draggable center orb
│   │   │   │   └── 📄 DraggableObject.ts
│   │   │   ├── 📂 battle/         # Virus battle (WIP)
│   │   │   │   ├── 📄 BattleManager.ts
│   │   │   │   ├── 📄 BattleRenderer.ts
│   │   │   │   └── 📄 VirusParamsUI.ts
│   │   │   ├── 📂 cursor/         # (DEPRECATED - old cursor system)
│   │   │   └── 📂 follower/       # (DEPRECATED - old follower system)
│   │   └── 📂 types/              # TypeScript type definitions
│   │       ├── 📄 schema.ts       # Colyseus state schemas (client types)
│   │       ├── 📄 pixi-extend.d.ts # PixiJS type extensions
│   │       └── 📄 pixi-filters.d.ts # Filter type definitions
│   └── 📂 dist/                   # Production build output
│
├── 📂 server/                      # Backend application
│   ├── 📄 package.json            # Server dependencies & scripts
│   ├── 📄 tsconfig.json           # TypeScript compiler config
│   └── 📂 src/                    # Source code
│       ├── 📄 index.ts            # Server entry point
│       └── 📂 rooms/              # Colyseus room implementations
│           ├── 📄 HoldingRoom.ts  # Main game room logic
│           └── 📄 schema.ts       # Colyseus state schemas (server types)
│
└── 📂 node_modules/                # Dependencies (git-ignored)
```

---

## 🏗 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  Port: 3000 (dev) | https://cursor-hold-game.onrender.com      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  index.html                                               │ │
│  │  - UI: Landing screen, game screen, sidebars              │ │
│  │  - CSS: Retro-neon styles, animations                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  main.ts (Entry Point)                                    │ │
│  │  - Initializes all managers                               │ │
│  │  - Sets up interactions                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ GameEngine │  │ NetworkMgr   │  │ UIController         │   │
│  │ - PixiJS   │  │ - Colyseus   │  │ - Lobby/Room views   │   │
│  │ - Ticker   │  │ - WebSocket  │  │ - Sidebars           │   │
│  └────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                │                      │               │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ InputMgr   │  │ ChatManager  │  │ DraggableChatMgr     │   │
│  │ - Mouse    │  │ - Messaging  │  │ - Chat positioning   │   │
│  │ - Keyboard │  │ - Timestamps │  │ - Sync position      │   │
│  └────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Features                                               │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐    │   │
│  │  │ MouseFollowerMgr │  │ DraggableObject          │    │   │
│  │  │ - mfl1 (RED)     │  │ - Center orb             │    │   │
│  │  │ - mfl2 (BLUE)    │  │ - Hover sync             │    │   │
│  │  │ - Trail effects  │  │ - Drag sync              │    │   │
│  │  └──────────────────┘  └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (Colyseus Protocol)
                            │ Port: 2567
                            │
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Node.js)                        │
│  Port: 2567 | https://cursor-hold-game-server.onrender.com     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  index.ts                                                 │ │
│  │  - Express setup                                          │ │
│  │  - Colyseus server initialization                         │ │
│  │  - Health check endpoint (/health)                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  HoldingRoom.ts (Room Logic)                              │ │
│  │  - Player join/leave handling                             │ │
│  │  - Message handlers (mflUpdate, drag events, chat)        │ │
│  │  - State synchronization                                  │ │
│  │  - Auto-cleanup (5 min after empty)                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  schema.ts (State Definitions)                            │ │
│  │  - PlayerSchema: id, name, x, y, isReady, virusParams     │ │
│  │  - DraggableObjectSchema: id, x, y, isHovered, etc.       │ │
│  │  - RoomState: players, objects, roomId, battleGrid        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 File-by-File Explanation

### Root Level

#### `package.json` (Root)
**Purpose:** Monorepo workspace configuration  
**Key Fields:**
- `workspaces: ["client", "server"]` - Defines npm workspaces
- `scripts.start` - Runs both client and server concurrently
- `devDependencies` - Husky (git hooks), lint-staged, concurrently

**Usage:**
```bash
npm install          # Install all dependencies (root + workspaces)
npm run start        # Run both client (3000) and server (2567)
npm run dev:client   # Run client only
npm run dev:server   # Run server only
```

---

### Client (`/client`)

#### `client/package.json`
**Purpose:** Client-side dependencies and build scripts  
**Key Dependencies:**
- `pixi.js` - Rendering engine
- `colyseus.js` - WebSocket client
- `vite` - Build tool
- `typescript` - Type checking

**Scripts:**
```bash
npm run dev     # Start Vite dev server (port 3000)
npm run build   # TypeScript compile + Vite production build
npm run test    # Run Vitest tests
```

---

#### `client/tsconfig.json`
**Purpose:** TypeScript compiler configuration for client  
**Key Settings:**
- `module: "ESNext"` - ES modules for Vite
- `moduleResolution: "bundler"` - Vite-compatible resolution
- `noEmit: true` - Vite handles transpilation
- `include: ["src", "src/types/**/*.d.ts"]` - Type definitions

---

#### `client/vite.config.ts`
**Purpose:** Vite bundler configuration  
**Key Settings:**
- `base: '/'` - Base path for Render deployment
- `server.port: 3000` - Dev server port
- `build.outDir: 'dist'` - Production output directory

---

#### `client/index.html`
**Purpose:** Main HTML template + inline CSS styles  
**Structure:**
```html
<head>
  <style>
    /* All CSS styles here: retro-neon theme, sidebars, buttons, etc. */
  </style>
</head>
<body>
  <div id="app">
    <!-- Landing Screen (lobby) -->
    <div id="landingScreen">...</div>
    
    <!-- Game Screen (room) -->
    <div id="gameScreen">
      <div id="canvasContainer"></div>  <!-- PixiJS canvas -->
      <div id="topRoomIdPanel">...</div>  <!-- Top info panel -->
      <div id="player1Name">...</div>     <!-- Player 1 name -->
      <div id="player2Name">...</div>     <!-- Player 2 name -->
      <div id="leftSidebar">...</div>     <!-- Left menu (chat, controls) -->
      <div id="sidebar">...</div>         <!-- Right menu (virus params) -->
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
```

**Key CSS Classes:**
- `.sidebar` - Fixed-position sidebars with slide animation
- `.param-cell` - Virus parameter "test tubes" with liquid effects
- `.btn` - Retro-styled buttons with hover effects
- `.copyable-id` - Clickable ID with copy-to-clipboard

---

#### `client/src/main.ts`
**Purpose:** Application entry point  
**Responsibilities:**
1. Initialize all managers (GameEngine, NetworkManager, etc.)
2. Set up room creation/joining callbacks
3. Connect managers after room is joined
4. Handle player identity (Player 1 vs Player 2)

**Key Code Flow:**
```typescript
class MainApp {
  constructor() {
    this.gameEngine = new GameEngine();
    this.networkManager = new NetworkManager();
    this.inputManager = new InputManager();
    this.uiController = new UIController();
    this.chatManager = new ChatManager();
    this.mouseFollower = new MouseFollowerManager(...);
    this.draggableObject = new DraggableObject(...);
    
    this.setupInteractions(); // Set up create/join callbacks
    this.gameEngine.init('canvasContainer'); // Init PixiJS
  }
  
  private setupInteractions(): void {
    this.uiController.onCreateRoom = async () => {
      const roomId = await this.networkManager.createRoom();
      this.uiController.setView('room');
      this.mouseFollower.onRoomJoined(true, sessionId); // isCreator = true
    };
    
    this.uiController.onJoinRoom = async (roomId) => {
      await this.networkManager.joinRoom(roomId);
      this.uiController.setView('room');
      this.mouseFollower.onRoomJoined(false, sessionId); // isCreator = false
    };
  }
}
```

---

#### `client/src/core/GameEngine.ts`
**Purpose:** PixiJS initialization and game ticker  
**Key Methods:**
- `init(containerId)` - Async PixiJS setup
- `addTickerUpdate(fn)` - Add update loop callback
- `start()` - Start game ticker

**Important Settings:**
```typescript
await this.app.init({
  backgroundColor: 0x1a1a1a,
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio, 2),
});
this.app.canvas.style.pointerEvents = 'auto'; // Allow interaction
this.app.canvas.style.zIndex = '1'; // Below UI elements
```

---

#### `client/src/core/InputManager.ts`
**Purpose:** Mouse and keyboard input handling  
**Tracked State:**
- Keyboard: `Map<keyCode, isPressed>`
- Mouse: `{ x, y, leftButton, rightButton }`

**Callbacks:**
```typescript
onMouseMove?: (x: number, y: number) => void;
onKeyDown?: (code: string) => void;
onKeyUp?: (code: string) => void;
```

---

#### `client/src/core/NetworkManager.ts`
**Purpose:** Colyseus WebSocket client wrapper  
**Key Methods:**
- `createRoom()` - Create new room, return roomId
- `joinRoom(roomId)` - Join existing room
- `sendToRoom(messageType, data)` - Send message to server
- `onMessage(messageType, callback)` - Listen for messages
- `getSessionId()` - Get local player's session ID
- `getPlayerCount()` - Get current player count

**Room State Change Callback:**
```typescript
onRoomStateChange?: (count: number, max: number) => void;

// Auto-updates when players join/leave
this.currentRoom.state.players.onAdd = () => this.updatePlayerCount();
this.currentRoom.state.players.onRemove = () => this.updatePlayerCount();
```

---

#### `client/src/ui/UIController.ts`
**Purpose:** UI state management (lobby ↔ room, sidebars)  
**Key Methods:**
- `setView('lobby' | 'room')` - Switch screens
- `showCreatedRoomId(roomId)` - Display room ID at top
- `setPlayerName('Player 1' | 'Player 2')` - Set player name display
- `updatePlayerCount(count, max)` - Update player counter
- `toggleLeftSidebar()` / `toggleRightSidebar()` - Toggle menus

**DOM Elements Managed:**
- `#landingScreen`, `#gameScreen` - Screen containers
- `#topRoomIdPanel`, `#player1Name`, `#player2Name` - Top info bar
- `#leftSidebar`, `#sidebar` - Side menus
- `#createRoomBtn`, `#joinRoomBtn` - Action buttons

---

#### `client/src/chat/ChatManager.ts`
**Purpose:** In-room chat functionality  
**Features:**
- Send/receive messages via Colyseus
- Timestamped messages
- Auto-scroll to bottom

**Network Messages:**
```typescript
// Send
room.send('chatMessage', { message, timestamp });

// Receive
room.onMessage('chatMessage', (data) => {
  // data: { playerId, playerName, message, timestamp }
});
```

---

#### `client/src/chat/DraggableChatManager.ts`
**Purpose:** Draggable chat window positioning  
**Features:**
- Drag chat with mouse/touch
- Sync position across clients
- Save position to localStorage

---

#### `client/src/features/mouse-follower/MouseFollowerManager.ts`
**Purpose:** Real-time mouse cursor synchronization (MFL system)  
**Key Concepts:**
- **mfl1 (RED):** Follows Player 1 (creator) mouse
- **mfl2 (BLUE):** Follows Player 2 (joiner) mouse
- Both players see BOTH followers
- Trail particles (8 particles, fade out)
- Smooth interpolation (lerp 0.2)

**Network Flow:**
```typescript
// Client → Server (every ~33ms)
room.send('mflUpdate', { isCreator, x, y });

// Server → All Clients (broadcast)
room.onMessage('mflUpdate', (data) => {
  // data: { playerId, isCreator, x, y }
  this.updateRemoteFollower(data.playerId, data.isCreator, data.x, data.y);
});
```

**Visual Properties:**
- Circle radius: 20px
- Trail length: 8 particles
- Pulse effect: `1 + Math.sin(Date.now() / 200) * 0.1`
- Interpolation: `current += (target - current) * 0.2 * delta`

---

#### `client/src/features/draggable/DraggableObject.ts`
**Purpose:** Center draggable orb with synchronized state  
**States:**
- **Idle (Cyan - 0x00ffff):** No interaction
- **Local Hover (Magenta - 0xff00ff):** My mouse over orb
- **Remote Hover (Hot Pink - 0xff69b4):** Other player's mouse over orb
- **Dragging (Yellow - 0xffff00):** Being dragged

**Network Messages:**
```typescript
// Hover
room.send('updateObjectHover', { objectId, isHovered });
room.onMessage('objectHoverChanged', (data) => {
  // data: { objectId, isHovered, hoveredBy }
});

// Drag
room.send('startDragObject', { objectId, startX, startY });
room.send('updateObjectPosition', { objectId, x, y });
room.send('stopDragObject', { objectId, endX, endY });
```

**Exclusive Drag:**
- Only one player can drag at a time
- Server validates drag ownership via `draggedBy` field

---

#### `client/src/features/battle/BattleManager.ts`
**Purpose:** Virus battle state machine (WIP)  
**States:**
```typescript
type BattleState =
  | { type: 'idle' }
  | { type: 'preparing'; params: VirusParams; startTime: number }
  | { type: 'running'; startTime: number }
  | { type: 'ended'; winner: 'A' | 'B' };
```

**Virus Parameters (12 total, 12 points to distribute):**
1. Aggression ⚔️
2. Mutation 🧬
3. Speed ⚡
4. Defense 🛡️
5. Reproduction 🦠
6. Stealth 👻
7. Virulence ☣️
8. Resilience 💪
9. Mobility 🚶
10. Intellect 🧠
11. Contagiousness 🫁
12. Lethality 💀

---

#### `client/src/features/battle/BattleRenderer.ts`
**Purpose:** Render virus battle grid (WIP)  
**Planned Features:**
- 20×32 battle grid
- Top: Player A virus (red)
- Bottom: Player B virus (blue)
- Real-time spread visualization

---

#### `client/src/features/battle/VirusParamsUI.ts`
**Purpose:** Virus parameter UI panel (placeholder)  
**Current State:** Empty (UI is in `index.html` as static HTML)

---

#### `client/src/types/schema.ts`
**Purpose:** TypeScript type definitions matching server schemas  
**Key Types:**
```typescript
class PlayerSchema {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isHoldingHands: boolean;
  holdingHandsWith: string;
  isRoomCreator: boolean;
  isReady: boolean;
  virusParams?: { [key: string]: number };
  cursorX: number;
  cursorY: number;
}

class DraggableObjectSchema {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  isBeingDragged: boolean;
  draggedBy: string;
  isFollower: boolean;
  owner: string;
  targetX: number;
  targetY: number;
  isHovered: boolean;
  hoveredBy: string;
}
```

---

#### `client/src/types/pixi-extend.d.ts`
**Purpose:** PixiJS type extensions  
**Usage:** Augment PixiJS types for custom properties

---

#### `client/src/types/pixi-filters.d.ts`
**Purpose:** PixiJS filter type definitions  
**Usage:** Type definitions for bloom, CRT, noise, pixelate filters

---

### Server (`/server`)

#### `server/package.json`
**Purpose:** Server-side dependencies and scripts  
**Key Dependencies:**
- `colyseus` - Multiplayer framework
- `@colyseus/schema` - State synchronization
- `express` - HTTP server
- `cors` - Cross-origin requests

**Scripts:**
```bash
npm run dev   # ts-node-dev with hot reload
npm run build # TypeScript compile to /dist
npm start     # Run compiled JS from /dist
```

---

#### `server/tsconfig.json`
**Purpose:** TypeScript compiler configuration for server  
**Key Settings:**
- `module: "commonjs"` - Node.js modules
- `outDir: "./dist"` - Output directory
- `experimentalDecorators: true` - For Colyseus schema decorators
- `emitDecoratorMetadata: true` - Required for schema reflection

---

#### `server/src/index.ts`
**Purpose:** Server entry point  
**Key Setup:**
```typescript
import express from 'express';
import { Server } from 'colyseus';
import { HoldingRoom } from './rooms/HoldingRoom';

const app = express();
const server = createServer(app);
const gameServer = new Server({ server });

gameServer.define('holding_room', HoldingRoom, {});

app.get('/health', (req, res) => res.send('OK'));

gameServer.listen(PORT); // Default: 2567
```

**Endpoints:**
- `GET /health` - Health check (returns "OK")
- WebSocket: `ws://localhost:2567` (Colyseus protocol)

---

#### `server/src/rooms/schema.ts`
**Purpose:** Colyseus state schema definitions  
**Schemas:**

**PlayerSchema:**
```typescript
class PlayerSchema extends Schema {
  @type('string') id!: string;
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') color: number = 0xffffff;
  @type('boolean') isHoldingHands: boolean = false;
  @type('string') holdingHandsWith: string = '';
  @type('boolean') isRoomCreator: boolean = false;
  @type('boolean') isReady: boolean = false;
  @type({ map: 'number' }) virusParams: Map<string, number> = new Map();
  @type('number') cursorX: number = 0;
  @type('number') cursorY: number = 0;
}
```

**DraggableObjectSchema:**
```typescript
class DraggableObjectSchema extends Schema {
  @type('string') id!: string;
  @type('number') x: number = 400;
  @type('number') y: number = 300;
  @type('number') radius: number = 30;
  @type('number') color: number = 0xff69b4;
  @type('boolean') isBeingDragged: boolean = false;
  @type('string') draggedBy: string = '';
  @type('boolean') isFollower: boolean = false;
  @type('string') owner: string = '';
  @type('number') targetX: number = 0;
  @type('number') targetY: number = 0;
  @type('boolean') isHovered: boolean = false;
  @type('string') hoveredBy: string = '';
}
```

**RoomState:**
```typescript
class RoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: DraggableObjectSchema }) objects = new MapSchema<DraggableObjectSchema>();
  @type('string') roomId: string = '';
  @type('number') maxPlayers: number = 2;
  @type({ array: 'number' }) battleGrid: number[] = [];
  @type('boolean') battleActive: boolean = false;
}
```

---

#### `server/src/rooms/HoldingRoom.ts`
**Purpose:** Main game room logic  
**Extends:** `Room<RoomState>` from Colyseus

**Lifecycle Methods:**
```typescript
onCreate(options: any) {
  this.setState(new RoomState());
  this.state.roomId = options.roomId || this.roomId;
  this.state.maxPlayers = 2;
  
  // Set up message handlers
  this.onMessage('mflUpdate', (client, data) => { ... });
  this.onMessage('updateObjectHover', (client, data) => { ... });
  this.onMessage('chatMessage', (client, data) => { ... });
  // ... more handlers
}

onJoin(client: Client, options: any) {
  const player = new PlayerSchema();
  player.id = client.sessionId;
  player.name = `Player${client.sessionId.substring(0, 4)}`;
  player.isRoomCreator = this.state.players.size === 0;
  this.state.players.set(client.sessionId, player);
}

onLeave(client: Client, consented: boolean) {
  this.state.players.delete(client.sessionId);
  this.releaseHoldsForPlayer(client.sessionId);
}

onDispose() {
  if (this.holdTimeout) clearTimeout(this.holdTimeout);
}
```

**Message Handlers:**
| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| `mflUpdate` | C→S | Mouse follower position |
| `updateObjectHover` | C→S | Orb hover state |
| `startDragObject` | C→S | Start dragging orb |
| `updateObjectPosition` | C→S | Update orb position |
| `stopDragObject` | C→S | Stop dragging orb |
| `chatMessage` | C→S | Send chat message |
| `updateVirusParams` | C→S | Update virus parameters |
| `toggleReady` | C→S | Toggle ready status |
| `updateCursor` | C→S | Legacy cursor update |

**Broadcast Messages (S→C):**
| Message Type | Data | Purpose |
|--------------|------|---------|
| `mflUpdate` | `{ playerId, isCreator, x, y }` | Sync mouse follower |
| `objectHoverChanged` | `{ objectId, isHovered, hoveredBy }` | Sync hover state |
| `objectDragStarted` | `{ objectId, playerId }` | Drag started |
| `objectPositionUpdated` | `{ objectId, x, y }` | Position update |
| `objectDragStopped` | `{ objectId, playerId }` | Drag stopped |
| `chatMessage` | `{ playerId, playerName, message, timestamp }` | Chat message |
| `virusParamsUpdated` | `{ playerId, params }` | Virus params update |
| `virusBattleStarted` | `{ message, battleGrid }` | Battle started |
| `virusBattleEnded` | `{ winner, virusACount, virusBCount }` | Battle ended |

**Auto-Cleanup:**
```typescript
onActivate() {
  this.setSimulationInterval((deltaTime) => {
    if (this.clients.length === 0) {
      if (this.holdTimeout) clearTimeout(this.holdTimeout);
      this.holdTimeout = setTimeout(() => {
        if (this.clients.length === 0) {
          this.disconnect(); // Delete room after 5 min empty
        }
      }, 5 * 60 * 1000);
    }
  });
}
```

---

## 🌐 Network Communication

### Connection Flow

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│             │                    │             │
│ 1. connect()│───────────────────>│             │
│             │   WebSocket        │             │
│             │   handshake        │             │
│             │<───────────────────│             │
│             │   sessionId        │             │
│             │                    │             │
│ 2. create() │───────────────────>│ onCreate()  │
│   or        │   "holding_room"   │             │
│   joinById()│                    │             │
│             │<───────────────────│ onJoin()    │
│             │   Room state       │             │
│             │                    │             │
│ 3. onStateChange()              │             │
│    (initial state)              │             │
│             │                    │             │
│ 4. send()   │───────────────────>│ onMessage() │
│             │   custom message   │             │
│             │                    │             │
│ 5. onMessage()│<─────────────────│ broadcast() │
│             │   custom message   │             │
└─────────────┘                    └─────────────┘
```

### Message Rate Limits

| Message Type | Rate | Notes |
|--------------|------|-------|
| `mflUpdate` | ~30/sec | Rate-limited in client (33ms interval) |
| `updateObjectPosition` | Every frame | During drag only |
| `updateObjectHover` | On hover enter/leave | Debounced by user action |
| `chatMessage` | User-triggered | Server validates length (max 200 chars) |
| `updateCursor` | Deprecated | Use `mflUpdate` instead |

---

## 🏗 Build & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Run both client and server
npm run start

# Or run separately
npm run dev:client   # http://localhost:3000
npm run dev:server   # ws://localhost:2567
```

### Production Build

```bash
# Build client
cd client && npm run build
# Output: client/dist/

# Build server
cd server && npm run build
# Output: server/dist/

# Start production server
cd server && npm start
```

### Render Deployment

**Environment Variables:**
- `PORT` - Server port (default: 2567)

**Build Commands:**
- Client: `cd client && npm run build`
- Server: `cd server && npm run build`

**Start Commands:**
- Client: `npx serve client/dist`
- Server: `node server/dist/index.js`

**URLs:**
- Client: https://cursor-hold-game.onrender.com
- Server: https://cursor-hold-game-server.onrender.com
- Health: https://cursor-hold-game-server.onrender.com/health

---

## 📋 Replication Guide

### Step 1: Project Setup

```bash
# Create project structure
mkdir tovch-game
cd tovch-game
npm init -y

# Create workspaces
mkdir client server

# Initialize client
cd client
npm init -y
npm install pixi.js colyseus.js vite typescript vitest
npx tsc --init

# Initialize server
cd ../server
npm init -y
npm install colyseus @colyseus/schema express cors
npm install -D ts-node-dev @types/express @types/node
npx tsc --init
```

### Step 2: Configure Root package.json

```json
{
  "name": "holding-hands-game",
  "workspaces": ["client", "server"],
  "scripts": {
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "start": "concurrently \"npm run dev:server\" \"npm run dev:client\""
  }
}
```

### Step 3: Implement Core Files

1. **Server:**
   - `server/src/index.ts` - Express + Colyseus setup
   - `server/src/rooms/schema.ts` - State schemas
   - `server/src/rooms/HoldingRoom.ts` - Room logic

2. **Client:**
   - `client/index.html` - UI structure + CSS
   - `client/src/main.ts` - Entry point
   - `client/src/core/GameEngine.ts` - PixiJS init
   - `client/src/core/NetworkManager.ts` - Colyseus client
   - `client/src/core/InputManager.ts` - Input handling
   - `client/src/ui/UIController.ts` - UI management
   - `client/src/features/mouse-follower/MouseFollowerManager.ts`
   - `client/src/features/draggable/DraggableObject.ts`
   - `client/src/chat/ChatManager.ts`

### Step 4: Test Locally

```bash
npm install
npm run start
```

Open two browser windows:
1. http://localhost:3000 → Create Room
2. http://localhost:3000 → Join Room (use ID from step 1)

### Step 5: Deploy to Render

1. Connect GitHub repository
2. Create two services:
   - **Web Service (Client):**
     - Build: `cd client && npm run build`
     - Start: `npx serve client/dist`
   - **Web Service (Server):**
     - Build: `cd server && npm run build`
     - Start: `node server/dist/index.js`
3. Set environment variables
4. Deploy

---

## 🔧 Troubleshooting

### Common Issues

**1. Canvas overlaps UI buttons**
- Ensure `canvas.style.zIndex = '1'`
- Ensure buttons have `z-index: 200+` and `position: fixed`

**2. Mouse followers not visible**
- Check `follower.graphics.visible = false` for local player
- Verify `eventMode = 'none'` on follower containers

**3. Room ID not copying**
- Ensure `pointer-events: auto` on panel
- Check clipboard permissions in browser

**4. Server connection fails**
- Verify WebSocket URL (localhost vs production)
- Check firewall for port 2567

**5. Build fails with TypeScript errors**
- Run `npm run build` in client directory
- Check `tsconfig.json` matches Vite requirements

---

## 📚 Additional Resources

- [Colyseus Documentation](https://docs.colyseus.io/)
- [PixiJS Documentation](https://pixijs.download/release/docs/index.html)
- [Vite Documentation](https://vitejs.dev/)
- [Render Deployment Guide](https://render.com/docs)

---

**End of Architecture Document**
