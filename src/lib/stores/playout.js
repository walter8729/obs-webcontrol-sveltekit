import { writable, derived } from 'svelte/store';
import { sendCommand } from './obs.js';

/**
 * @file playout.js (Store)
 * @description Store de Svelte para gestionar el sistema de reproducción multimedia (playout).
 * Contiene la lista de reproducción, configuraciones de repetición, velocidad y bucles A-B.
 */

/**
 * Crea el store de playout con métodos personalizados para interactuar con el servidor.
 */
function createPlayoutStore() {
    const { subscribe, set, update } = writable({
        playlist: [],
        currentIndex: -1,
        nextIndex: -1,
        autoNext: true,
        loopList: true,
        loopFile: false,
        stopAfterCurrent: false,
        speed: 100,
        loopAB: {
            active: false,
            start: 0,
            end: 0
        },
        status: {
            currentMs: 0,
            durationMs: 0,
            state: 'IDLE',
            file: ''
        }
    });

    return {
        subscribe,
        /**
         * Sincroniza el estado local con los datos completos del servidor.
         * @param {Object} fullState El objeto de estado global emitido por el servidor.
         */
        syncWithServer: (fullState) => {
            if (!fullState.playout) return;
            const p = fullState.playout;
            update(s => ({
                ...s,
                playlist: p.playlist || [],
                currentIndex: p.playlist?.findIndex(i => i.status === 'playing') ?? -1,
                nextIndex: p.playlist?.findIndex(i => i.status === 'next') ?? -1,
                autoNext: p.settings?.autoNext ?? true,
                loopList: p.settings?.loopList ?? true,
                loopFile: p.settings?.loopFile ?? false,
                stopAfterCurrent: p.settings?.stopAfterCurrent ?? false,
                speed: parseInt(p.settings?.speed || '100'),
                loopAB: {
                    active: p.settings?.loopABActive ?? false,
                    start: parseInt(p.settings?.loopABStart || '0'),
                    end: parseInt(p.settings?.loopABEnd || '0')
                }
            }));
        },
        /**
         * Agrega un archivo a la lista de reproducción.
         */
        addToFileList: (item) => {
            sendCommand('playoutAddToPlaylist', item);
        },
        /**
         * Elimina un elemento de la playlist por ID.
         */
        removeFromPlaylist: (id) => {
            sendCommand('playoutRemoveFromPlaylist', { id });
        },
        /**
         * Reorganiza el orden de los elementos en la playlist.
         * @param {Array<{id: number, sort_order: number}>} orders Array de nuevos órdenes.
         */
        reorderPlaylist: (orders) => {
            sendCommand('playoutReorder', { orders });
        },
        /**
         * Establece un archivo como el actual para reproducción inmediata.
         */
        setCurrent: (id) => {
            sendCommand('playoutSetFile', { id });
        },
        /**
         * Marca un archivo como el siguiente en la cola.
         */
        setNext: (id) => {
            sendCommand('playoutSetNext', { id });
        },
        /**
         * Actualiza solo el estado de reproducción (cursor, duración, etc.)
         * @param {Object} newStatus Nuevos valores de estado.
         */
        updateStatus: (newStatus) => update(s => ({
            ...s,
            status: { ...s.status, ...newStatus }
        })),
        /**
         * Actualiza una configuración de playout (ej: autoNext, loopList).
         */
        updateSetting: (key, value) => {
            sendCommand('playoutUpdateSettings', { key, value });
        },
        /**
         * Configura y activa el bucle entre dos puntos de tiempo (A y B).
         */
        setLoopAB: (loopAB) => {
            update(s => ({ ...s, loopAB }));
            sendCommand('playoutSetLoopAB', loopAB);
        },
        /**
         * Vacía la lista de reproducción.
         */
        clearPlaylist: () => {
            sendCommand('playoutClearPlaylist', {});
        },
        /**
         * Ejecuta una acción de control (PLAY, PAUSE, STOP, RESTART).
         */
        playoutAction: (action) => {
            sendCommand('playoutAction', { action });
        },
        /**
         * Salta a una posición de tiempo específica en el clip actual.
         * @param {number} ms Milisegundos de destino.
         */
        playoutSeek: (ms) => {
            sendCommand('playoutSeek', { ms });
        },
        /**
         * Ajusta la velocidad de reproducción.
         * @param {number} speed Porcentaje de velocidad (ej: 100).
         * @param {number|null} seekMs Opcional: tiempo al que saltar tras cambiar la velocidad.
         */
        setSpeed: (speed, seekMs = null) => {
            update(s => ({ ...s, speed: speed }));
            sendCommand('playoutSetSpeed', { speed, seekMs });
        }
    };
}

/** Instancia única del store de playout */
export const playoutStore = createPlayoutStore();

/** Store derivado: Obtiene el objeto del medio que se está reproduciendo actualmente */
export const currentMedia = derived(playoutStore, $s =>
    $s.currentIndex >= 0 ? $s.playlist[$s.currentIndex] : null
);

/** Store derivado: Obtiene el objeto del siguiente medio en la cola */
export const nextMedia = derived(playoutStore, $s =>
    $s.nextIndex >= 0 ? $s.playlist[$s.nextIndex] : null
);
