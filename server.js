import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initWS, connectOBS } from './src/lib/server/obs.js';

const port = process.env.PORT || 5000;
const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Attach to globalThis for obs.js
globalThis.io = io;

// Initialize OBS and WebSocket logic from the shared module
console.log('Initializing OBS Server logic...');
initWS(io);
connectOBS();

// SvelteKit handler (from adapter-node build)
app.use(handler);

server.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 Production server running!`);
    console.log(`➜  Local:   http://localhost:${port}`);
    console.log(`➜  Network: http://<your-ip>:${port}\n`);
});
