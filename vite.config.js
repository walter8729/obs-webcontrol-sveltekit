import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { Server } from "socket.io";
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

const webSocketServer = {
  name: 'webSocketServer',
  configureServer(server) {
    if (!server.httpServer) return;

    const io = new Server(server.httpServer);

    // We will attach the io instance to the global object or a shared module later
    // for the OBS logic to use. For now, just initialize it.
    globalThis.io = io;

    // Importar dinámicamente el servidor OBS para inicializarlo
    import('./src/lib/server/obs.js').then(({ initWS }) => {
      initWS(io);
      console.log('Servidor OBS inicializado y vinculado al WebSocket');
    });

    console.log('Socket.io server initialized');
  }
};

export default defineConfig({

  plugins: [sveltekit(), webSocketServer],

  server: {
    port: 5000,
    strictPort: false,
    cors: {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: true,
      optionsSuccessStatus: 204
    },
  },
  preview: {
    port: 5000,
    strictPort: false,
    cors: {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: true,
      optionsSuccessStatus: 204
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "src/variables.scss" as *;',
      },
    },
  },
});
