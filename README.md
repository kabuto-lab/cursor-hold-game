# Digital Hand Holding Game

A 2-player collaborative game where players can "hold hands" virtually in a shared 8-bit retro styled space.

## 🎮 Game Concept

This is a simple, intimate 2-player collaborative experience with an 8-bit retro aesthetic. Players share a virtual space where they can see and interact with each other's mouse cursors in real-time, symbolizing "holding hands" in a digital way.

### Core Gameplay
- Player 1 opens the game in a new browser tab, clicks a "Create Room" button to generate a unique shareable room link
- Player 1 sends this link to Player 2 (e.g., via chat or email)
- Player 2 clicks the link and joins the same room
- Once both are in, they see each other's mouse cursors on a shared canvas with 8-bit styled cursors that move smoothly in real-time
- Players can "hold hands" by clicking on the other player's cursor (or pressing Spacebar), which locks their cursors together with a visual chain effect
- Either player can release by clicking again or pressing Escape
- If players hold hands for 30 seconds, a retro particle effect (hearts) is triggered

## 🛠 Tech Stack

- **Frontend**: TypeScript, PixiJS v8+, Vite, colyseus.js
- **Backend**: Node.js, Colyseus, @colyseus/schema
- **Build Tool**: Vite
- **Graphics**: PixiJS for rendering with pixi-filters for retro effects

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd holding-hands-game
```

2. Install dependencies:
```bash
npm install
```

3. Install client and server dependencies separately:
```bash
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Running the Game

1. Start both the server and client in development mode:
```bash
npm run start
```

2. Alternatively, run them separately:
```bash
# Terminal 1: Start the server
cd server && npm run dev

# Terminal 2: Start the client
cd client && npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

1. Build the client:
```bash
cd client && npm run build
```

2. Build the server:
```bash
cd server && npm run build
```

3. Start the production server:
```bash
cd server && npm start
```

## 🎯 Controls

- **Mouse/Touch**: Move your cursor around the canvas
- **Click on other player's cursor**: Hold hands with them
- **Spacebar**: Alternative way to hold hands with the other player
- **Escape**: Release held hands
- **Arrow Keys**: Alternative keyboard controls for cursor movement

## 🎨 Features

- Real-time cursor synchronization at 60 FPS
- 8-bit retro styling with pixel art effects
- Visual chain connection when holding hands
- Heart particle easter egg after holding hands for 30 seconds
- Responsive design that works on desktop and mobile
- Accessibility features including keyboard navigation
- Automatic room cleanup after 5 minutes of inactivity

## 🔧 Troubleshooting

### Common Issues

1. **Connection problems**: Make sure both players are on the same network or that ports are properly forwarded
2. **Performance issues**: The game uses retro-style pixelation which may affect performance on older devices
3. **Cross-browser compatibility**: The game works on Chrome, Firefox, Safari, and Edge

### Development Tips

- The server runs on port 2567 by default
- The client runs on port 3000 by default
- Rooms are ephemeral and auto-delete after 5 minutes of inactivity
- Maximum of 2 players per room

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Reporting Issues

If you encounter any bugs or issues, please open an issue on the GitHub repository with detailed steps to reproduce.# cursor-hold-game
# cursor-hold-game
