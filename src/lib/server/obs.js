import OBSWebSocket from 'obs-websocket-js';
import { OBS_ADDRESS, OBS_PASSWORD } from '../config.js';
import {
    getAllZocalos, setOnAirZocalo, addZocalo, deleteZocalo, updateZocalo,
    getAllPrograms, getActiveProgram, setActiveProgram, addProgram,
    deleteProgram, getZocaloDinamico, updateZocaloDinamico,
    getAllZocalosGlobal, getAllZocalosDinamicosGlobal, updateProgram,
    setOnAirAuxiliary, getPlaylist, addToPlaylist, removeFromPlaylist,
    clearPlaylist, updatePlaylistSortOrder, updatePlaylistItemStatus,
    setAllItemsIdle, getPlayoutSettings, updatePlayoutSetting
} from './db.js';
import { writeZocaloToFile, writeZocaloDinamicoToFile } from '../../file.js';
import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * @file obs.js
 * @description Servidor central de control para OBS.
 * Gestiona la conexión WebSocket con OBS, la sincronización de estados,
 * el sistema de playout multimedia y la comunicación en tiempo real vía Socket.io.
 */

const execPromise = promisify(exec);

// Instancia global de la conexión con OBS
export const obs = new OBSWebSocket();

let connected = false;
let connecting = false;
let reconnectTimeout = null;

/**
 * Bandera para detectar si el usuario ha detenido la reproducción manualmente.
 * Esto evita que el sistema salte al siguiente clip automáticamente cuando se presiona STOP.
 */
let manualStop = false;

/**
 * Estado global del sistema sincronizado con la base de datos y OBS.
 */
let state = {
    scenes: [],
    programScene: '',
    previewScene: '',
    programSceneItemList: [],
    zocalos: [],
    zocalosDinamicos: [],
    programs: [],
    activeProgramId: 1,
    playout: {
        playlist: [],
        settings: {},
        status: {
            currentMs: 0,
            durationMs: 0,
            state: 'IDLE',
            file: ''
        }
    }
};

/**
 * Obtiene la duración de un archivo multimedia usando ffprobe.
 * @param {string} path Ruta absoluta del archivo.
 * @returns {Promise<number>} Duración en segundos.
 */
async function getMediaDuration(path) {
    const ext = path.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'bmp', 'tga', 'gif', 'webp', 'svg', 'tiff', 'tif', 'exr', 'hdr', 'psd', 'ico', 'pbm', 'pgm', 'ppm', 'xbm', 'xpm', 'dds'];

    // Las imágenes tienen una duración fija de 10 segundos por defecto
    if (imageExts.includes(ext)) return 10;

    try {
        const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`);
        return parseFloat(stdout) || 0;
    } catch (e) {
        console.error('Error al obtener duración con ffprobe:', e.message);
        return 0;
    }
}

/**
 * Actualiza el estado global consultando la base de datos y OBS.
 * Emite el evento 'state' a todos los clientes conectados.
 */
async function updateState() {
    try {
        const activeProgram = await getActiveProgram();
        state.activeProgramId = activeProgram.id;
        state.programs = await getAllPrograms();
        state.zocalos = await getAllZocalosGlobal();
        state.zocalosDinamicos = await getAllZocalosDinamicosGlobal();

        // Sincronización de zócalos al aire con archivos físicos para OBS (F1, F2, F3)
        const onAirZocalo = state.zocalos.find(z => Number(z.onAir) === 1);
        const activeF3Slot = state.zocalosDinamicos.find(z => Number(z.onAir) === 1);

        await writeZocaloToFile(onAirZocalo ? [onAirZocalo] : []);

        if (activeF3Slot) {
            await writeZocaloDinamicoToFile(activeF3Slot.f3);
        } else {
            await writeZocaloDinamicoToFile("");
        }

        // Si OBS está conectado, obtenemos escenas y fuentes
        if (connected) {
            const sceneList = await obs.call('GetSceneList');
            state.scenes = sceneList.scenes.slice().reverse();
            state.programScene = sceneList.currentProgramSceneName;
            state.previewScene = sceneList.currentPreviewSceneName;

            const itemList = await obs.call('GetSceneItemList', { sceneName: state.programScene });
            state.programSceneItemList = itemList.sceneItems.slice().reverse();
        } else {
            state.scenes = [];
            state.programScene = '';
            state.previewScene = '';
            state.programSceneItemList = [];
        }

        // Cargar playlist y configuraciones de la BD
        state.playout.playlist = await getPlaylist();
        state.playout.settings = await getPlayoutSettings();

        broadcast('state', state);
    } catch (e) {
        console.error('Error al actualizar estado:', e.message);
    }
}

/**
 * Envía un evento a todos los clientes a través de Socket.io.
 */
function broadcast(event, data) {
    if (globalThis.io) {
        globalThis.io.emit(event, data);
    }
}

/**
 * Inicia el loop de capturas de pantalla de la escena de programa.
 */
async function startScreenshotLoop() {
    setInterval(async () => {
        if (!connected || !state.programScene) return;
        try {
            const data = await obs.call('GetSourceScreenshot', {
                sourceName: state.programScene,
                imageFormat: 'jpg',
                imageWidth: 640,
                imageHeight: 360,
                imageCompressionQuality: -1
            });
            if (data && data.imageData) {
                broadcast('screenshot', data.imageData);
            }
        } catch (e) { }
    }, 1000);
}

/**
 * Inicia el loop de monitoreo del estado de reproducción multimedia.
 * Gestiona el Loop A-B en el lado del servidor.
 */
async function startMediaStatusLoop() {
    setInterval(async () => {
        if (!connected) return;
        try {
            const status = await obs.call('GetMediaInputStatus', { inputName: 'playout' });

            const settings = state.playout.settings;
            // Lógica de mantenimiento del Loop A-B
            if (settings &&
                settings.loopABActive &&
                status.mediaState === 'OBS_MEDIA_STATE_PLAYING' &&
                status.mediaCursor >= Number(settings.loopABEnd) &&
                Number(settings.loopABEnd) > Number(settings.loopABStart)
            ) {
                await obs.call('SetMediaInputCursor', {
                    inputName: 'playout',
                    mediaCursor: Number(settings.loopABStart)
                });
                status.mediaCursor = Number(settings.loopABStart);
            }

            state.playout.status = {
                currentMs: status.mediaCursor,
                durationMs: status.mediaDuration,
                state: status.mediaState,
                file: ''
            };
            broadcast('playoutStatus', state.playout.status);
        } catch (e) { }
    }, 500);
}

/**
 * Gestiona la transición automática al siguiente clip cuando finaliza el actual.
 */
async function handleAutoNext() {
    if (!state.playout.settings.autoNext) return;

    const playlist = state.playout.playlist;
    const currentIndex = playlist.findIndex(item => item.status === 'playing');
    const nextIndex = playlist.findIndex(item => item.status === 'next');

    let toPlay = -1;

    if (nextIndex !== -1) {
        toPlay = nextIndex;
    } else if (state.playout.settings.loopList && playlist.length > 0) {
        toPlay = 0;
    }

    if (toPlay !== -1) {
        const item = playlist[toPlay];
        await playItem(item);
    } else {
        await obs.call('TriggerMediaInputAction', {
            inputName: 'playout',
            mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
        });
    }
}

/**
 * Carga y reproduce un elemento de la lista en OBS.
 * @param {Object} item Elemento de la playlist.
 */
async function playItem(item) {
    if (!connected) return;

    // Importante: Resetear bandera de stop manual al iniciar nueva reproducción
    manualStop = false;

    // Configurar archivo en OBS - Mantenemos la velocidad actual
    await obs.call('SetInputSettings', {
        inputName: 'playout',
        inputSettings: {
            local_file: item.path,
            looping: state.playout.settings.loopFile,
            speed_percent: state.playout.settings.speed || 100
        },
        overlay: true
    });

    // Forzar reinicio para asegurar que empiece desde el segundo 0
    await obs.call('TriggerMediaInputAction', {
        inputName: 'playout',
        mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART'
    });

    // Actualizar estados en BD
    await updatePlaylistItemStatus(item.id, 'playing');

    // Identificar el siguiente clip para pre-marcarlo en UI
    const playlist = await getPlaylist();
    const idx = playlist.findIndex(i => i.id === item.id);
    let nextIdx = idx + 1;
    if (nextIdx >= playlist.length) {
        nextIdx = state.playout.settings.loopList ? 0 : -1;
    }

    if (nextIdx !== -1) {
        await updatePlaylistItemStatus(playlist[nextIdx].id, 'next');
    }

    await updateState();
}

// Inicialización de loops de monitoreo (evitando duplicados en HMR)
if (!globalThis.screenshotLoopStarted) {
    startScreenshotLoop();
    globalThis.screenshotLoopStarted = true;
}

if (!globalThis.mediaStatusLoopStarted) {
    startMediaStatusLoop();
    globalThis.mediaStatusLoopStarted = true;
}

/**
 * Programa un reintento de conexión con OBS.
 */
function scheduleReconnect() {
    if (reconnectTimeout) return;
    console.log('Programando reconexión con OBS en 5s...');
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectOBS();
    }, 5000);
}

/**
 * Intenta conectar con el WebSocket de OBS.
 */
export async function connectOBS() {
    if (connecting || connected) return;
    connecting = true;
    console.log('Conectando a OBS en:', OBS_ADDRESS);

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    try {
        await obs.connect(OBS_ADDRESS, OBS_PASSWORD);
    } catch (e) {
        console.error('Error de conexión OBS:', e.message);
        connected = false;
        connecting = false;
        scheduleReconnect();
    }
}

// --- GESTIÓN DE EVENTOS DE CONEXIÓN ---

obs.removeAllListeners('ConnectionClosed');
obs.on('ConnectionClosed', () => {
    if (connected || connecting) {
        const wasConnected = connected;
        connected = false;
        connecting = false;
        if (wasConnected) {
            broadcast('connected', false);
            console.log('Conexión con OBS cerrada');
        }
        scheduleReconnect();
    }
});

obs.removeAllListeners('Identified');
obs.on('Identified', () => {
    connected = true;
    connecting = false;
    broadcast('connected', true);
    console.log('OBS Conectado e Identificado');
    updateState();
});

// --- GESTIÓN DE FINALIZACIÓN DE CLIPS ---

obs.removeAllListeners('MediaInputPlaybackEnded');
obs.on('MediaInputPlaybackEnded', async (data) => {
    if (data.inputName === 'playout') {
        // Si fue un STOP manual, NO saltamos al siguiente
        if (manualStop) {
            console.log('Playout detenido manualmente, omitiendo auto-next.');
            manualStop = false;
            return;
        }
        console.log('Fin de clip detectado, ejecutando auto-next...');
        await handleAutoNext();
    }
});

// Eventos de cambio en la estructura de OBS
const events = [
    'SceneListChanged', 'SceneCreated', 'SceneRemoved', 'SceneNameChanged',
    'CurrentProgramSceneChanged', 'CurrentPreviewSceneChanged',
    'SceneItemEnableStateChanged'
];

events.forEach(event => {
    obs.removeAllListeners(event);
    obs.on(event, () => {
        updateState();
    });
});

/**
 * Inicializa los eventos de Socket.io para la comunicación con el frontend.
 * @param {Object} io Instancia de Socket.io.
 */
export async function initWS(io) {
    if (globalThis.wsInitialized) return;
    globalThis.wsInitialized = true;

    io.on('connection', (socket) => {
        // Enviar estado inicial al nuevo cliente
        socket.emit('state', state);
        socket.emit('connected', connected);

        socket.on('command', async ({ type, data }) => {
            console.log('Comando recibido:', type, data);
            try {
                switch (type) {
                    case 'switchScene':
                        await obs.call('SetCurrentProgramScene', { sceneName: data.sceneName });
                        break;
                    case 'toggleSceneItem':
                        await obs.call('SetSceneItemEnabled', {
                            sceneName: data.sceneName,
                            sceneItemId: data.sceneItemId,
                            sceneItemEnabled: !data.enable
                        });
                        break;
                    case 'addZocalo':
                        await addZocalo(data);
                        await updateState();
                        break;
                    case 'deleteZocalo':
                        await deleteZocalo(data.id);
                        await updateState();
                        break;
                    case 'updateZocalo':
                        await updateZocalo(data);
                        await updateState();
                        break;
                    case 'setOnAirZocalo':
                        if (data.program_id && Number(data.program_id) !== Number(state.activeProgramId)) {
                            await setActiveProgram(data.program_id);
                        }
                        await setOnAirZocalo(data.id);
                        await updateState();
                        break;
                    case 'writeZocaloDinamicoToFile':
                        await updateZocaloDinamico(data.program_id, data.f3, data.slot || 1);
                        await updateState();
                        break;
                    case 'setOnAirAuxiliary':
                        await setOnAirAuxiliary(data.id);
                        await updateState();
                        break;
                    case 'addProgram':
                        await addProgram(data.name);
                        await updateState();
                        break;
                    case 'deleteProgram':
                        await deleteProgram(data.id);
                        await updateState();
                        break;
                    case 'setActiveProgram':
                        await setActiveProgram(data.id);
                        await updateState();
                        break;
                    case 'updateProgram':
                        await updateProgram(data.id, data.name);
                        await updateState();
                        break;
                    case 'playoutAction':
                        if (data.action === 'RESTART') {
                            const currentItem = state.playout.playlist.find(i => i.status === 'playing');
                            if (currentItem) {
                                await playItem(currentItem);
                            } else {
                                await obs.call('TriggerMediaInputAction', {
                                    inputName: 'playout',
                                    mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART'
                                });
                            }
                        } else if (data.action === 'PLAY' && (state.playout.status.state === 'OBS_MEDIA_STATE_ENDED' || state.playout.status.state === 'OBS_MEDIA_STATE_STOPPED')) {
                            const currentItem = state.playout.playlist.find(i => i.status === 'playing');
                            if (currentItem) {
                                await playItem(currentItem);
                            } else {
                                await obs.call('TriggerMediaInputAction', {
                                    inputName: 'playout',
                                    mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY'
                                });
                            }
                        } else if (data.action === 'STOP') {
                            // Marcar parada manual para evitar auto-next
                            manualStop = true;
                            await obs.call('TriggerMediaInputAction', {
                                inputName: 'playout',
                                mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'
                            });
                        } else {
                            // Si es PLAY o RESTART manual, reseteamos la bandera de stop
                            if (data.action === 'PLAY' || data.action === 'RESTART') {
                                manualStop = false;
                            }
                            await obs.call('TriggerMediaInputAction', {
                                inputName: 'playout',
                                mediaAction: `OBS_WEBSOCKET_MEDIA_INPUT_ACTION_${data.action}`
                            });
                        }
                        break;
                    case 'playoutSeek':
                        await obs.call('SetMediaInputCursor', {
                            inputName: 'playout',
                            mediaCursor: data.ms
                        });
                        break;
                    case 'playoutSetFile':
                        if (data.id) {
                            const item = state.playout.playlist.find(i => i.id === data.id);
                            if (item) await playItem(item);
                        } else if (data.path) {
                            await obs.call('SetInputSettings', {
                                inputName: 'playout',
                                inputSettings: { local_file: data.path },
                                overlay: true
                            });
                        }
                        break;
                    case 'playoutSetNext':
                        await updatePlaylistItemStatus(data.id, 'next');
                        await updateState();
                        break;
                    case 'playoutSetSpeed':
                        try {
                            const status = await obs.call('GetMediaInputStatus', { inputName: 'playout' });

                            // Preferir el cursor enviado desde el frontend (capturado al iniciar el drag)
                            // de lo contrario usar el cursor actual de OBS
                            const targetCursor = (data.seekMs !== undefined && data.seekMs !== null)
                                ? data.seekMs
                                : status.mediaCursor;

                            await obs.call('SetInputSettings', {
                                inputName: 'playout',
                                inputSettings: { speed_percent: data.speed },
                                overlay: true
                            });

                            await obs.call('SetMediaInputCursor', {
                                inputName: 'playout',
                                mediaCursor: targetCursor
                            });
                        } catch (e) {
                            console.error('Error al actualizar velocidad:', e.message);
                        }


                        await updatePlayoutSetting('speed', data.speed);
                        // Asegurar sincronización del estado interno
                        state.playout.settings.speed = data.speed;
                        await updateState();
                        break;
                    case 'playoutAddToPlaylist':
                        const duration = await getMediaDuration(data.path);
                        const newItemId = await addToPlaylist({
                            name: data.name,
                            path: data.path,
                            duration: Math.round(duration * 1000)
                        });

                        const currentPlaylist = await getPlaylist();
                        if (currentPlaylist.length === 1) {
                            await updatePlaylistItemStatus(newItemId, 'next');
                        }
                        await updateState();
                        break;
                    case 'playoutRemoveFromPlaylist':
                        await removeFromPlaylist(data.id);
                        await updateState();
                        break;
                    case 'playoutClearPlaylist':
                        await clearPlaylist();
                        await updateState();
                        break;
                    case 'playoutUpdateSettings':
                        await updatePlayoutSetting(data.key, data.value);

                        if (data.key === 'loopFile') {
                            await obs.call('SetInputSettings', {
                                inputName: 'playout',
                                inputSettings: { looping: data.value },
                                overlay: true
                            });
                        }
                        if (data.key === 'stopAfterCurrent' && data.value === true) {
                            await setAllItemsIdle();
                            const playing = state.playout.playlist.find(i => i.status === 'playing');
                            if (playing) await updatePlaylistItemStatus(playing.id, 'playing');
                        }
                        await updateState();
                        break;
                    case 'playoutSetLoopAB':
                        await updatePlayoutSetting('loopABActive', data.active);
                        await updatePlayoutSetting('loopABStart', data.start);
                        await updatePlayoutSetting('loopABEnd', data.end);
                        await updateState();
                        break;
                    case 'playoutReorder':
                        for (const item of data.orders) {
                            await updatePlaylistSortOrder(item.id, item.sort_order);
                        }
                        await updateState();
                        break;
                }
            } catch (e) {
                console.error('Error al ejecutar comando OBS:', e.message);
            }
        });
    });
    // Carga inicial de datos al inicializar el WebSocket para asegurar que el primer cliente reciba la info
    await updateState();
}

// Conexión inicial al arrancar el servidor
connectOBS();
// Asegurar que el estado inicial se cargue desde la BD aunque OBS no esté conectado
updateState();
