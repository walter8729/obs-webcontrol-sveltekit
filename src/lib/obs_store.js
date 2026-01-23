import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

export const obsState = writable({
    scenes: [],
    programScene: '',
    previewScene: '',
    programSceneItemList: []
});

export const obsConnected = writable(false);
export const obsScreenshot = writable('');

let socket;

export function initWebSocket() {
    if (socket) return;

    socket = io();

    socket.on('connect', () => {
        console.log('Connected to Backend WebSocket');
    });

    socket.on('state', (state) => {
        console.log('Received OBS state update:', state);
        obsState.set(state);
        import('./playoutStore').then(m => {
            m.playoutStore.syncWithServer(state);
        });
    });

    socket.on('screenshot', (data) => {
        obsScreenshot.set(data);
    });

    socket.on('connected', (connected) => {
        obsConnected.set(connected);
    });

    socket.on('playoutStatus', (status) => {
        // We import playoutStore dynamically to avoid circular dependencies if any
        import('./playoutStore').then(m => {
            m.playoutStore.updateStatus(status);
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from Backend WebSocket');
        obsConnected.set(false);
    });

    return socket;
}

export function sendCommand(type, data) {
    if (socket && socket.connected) {
        socket.emit('command', { type, data });
    } else {
        console.error('WebSocket not connected, cannot send command:', type);
    }
}
