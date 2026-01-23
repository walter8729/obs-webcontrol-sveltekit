import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

/**
 * @file obs.js (Store)
 * @description Store de Svelte para gestionar el estado de OBS en el cliente.
 * Se comunica con el servidor a través de Socket.io.
 */

/** 
 * Estado global de OBS (escenas, fuentes, etc.) 
 * @type {import('svelte/store').Writable<Object>}
 */
export const obsState = writable({
    scenes: [],
    programScene: '',
    previewScene: '',
    programSceneItemList: []
});

/** 
 * Indica si el servidor está conectado actualmente con OBS 
 * @type {import('svelte/store').Writable<boolean>}
 */
export const obsConnected = writable(false);

/** 
 * Almacena la última captura de pantalla (base64) recibida de la escena de programa 
 * @type {import('svelte/store').Writable<string>}
 */
export const obsScreenshot = writable('');

/** @type {Object} Instancia del socket cliente */
let socket;

/**
 * Inicializa la conexión WebSocket con el servidor backend.
 * Configura los escuchadores de eventos para sincronizar los stores locales.
 * @returns {Object|undefined} La instancia del socket o undefined si ya existe.
 */
export function initWebSocket() {
    if (socket) return;

    // Conectar al mismo host que sirve la página
    socket = io();

    socket.on('connect', () => {
        console.log('Conectado al WebSocket del Servidor');
    });

    // Sincronización completa del estado cuando el servidor lo emite
    socket.on('state', (state) => {
        obsState.set(state);
        // Sincronizar también el store de playout
        import('./playout.js').then(m => {
            m.playoutStore.syncWithServer(state);
        });
    });

    // Recepción de capturas de programa (JPG en string)
    socket.on('screenshot', (data) => {
        obsScreenshot.set(data);
    });

    // Estado de la conexión Servidor <-> OBS
    socket.on('connected', (connected) => {
        obsConnected.set(connected);
    });

    // Actualizaciones parciales del estado de reproducción del playout
    socket.on('playoutStatus', (status) => {
        import('./playout.js').then(m => {
            m.playoutStore.updateStatus(status);
        });
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del WebSocket del Servidor');
        obsConnected.set(false);
    });

    return socket;
}

/**
 * Envía un comando al servidor para que sea ejecutado en OBS o la BD.
 * @param {string} type Tipo de comando (ej: 'switchScene', 'playoutAction').
 * @param {Object} data Datos asociados al comando.
 */
export function sendCommand(type, data) {
    if (socket && socket.connected) {
        socket.emit('command', { type, data });
    } else {
        console.error('WebSocket no conectado, no se puede enviar comando:', type);
    }
}
