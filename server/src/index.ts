import express from 'express';
import { Server } from 'colyseus';
import { createServer } from 'http';
import cors from 'cors';
import { HoldingRoom } from './rooms/HoldingRoom';

const PORT = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  server
});

// Register rooms
gameServer.define('holding_room', HoldingRoom);

// Define a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start listening
gameServer.listen(PORT);

console.log(`Listening on Port: ${PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});