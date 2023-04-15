import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({

  plugins: [sveltekit()],

  server: {
    port: 5173,
    strictPort: false,
    cors: {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: true,
      optionsSuccessStatus: 204
    },
  },
  preview: {
    port: 5173,
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
