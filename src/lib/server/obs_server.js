import OBSWebSocket from 'obs-websocket-js';
import { OBS_ADDRESS, OBS_PASSWORD } from '../config.js';
import { getAllZocalos, setOnAirZocalo, addZocalo, deleteZocalo, updateZocalo, getAllPrograms, getActiveProgram, setActiveProgram, addProgram, deleteProgram, getZocaloDinamico, updateZocaloDinamico, getAllZocalosGlobal, getAllZocalosDinamicosGlobal, updateProgram, setOnAirAuxiliary, getPlaylist, addToPlaylist, removeFromPlaylist, clearPlaylist, updatePlaylistSortOrder, updatePlaylistItemStatus, setAllItemsIdle, getPlayoutSettings, updatePlayoutSetting } from '../../db.mjs';
import { readZocaloDinamicoFromFile, writeZocaloToFile, writeZocaloDinamicoToFile } from '../../file.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const obs = new OBSWebSocket();
let connected = false;
let connecting = false;
let reconnectTimeout = null;

let state = {
    scenes: [],
    programScene: '',
    previewScene: '',
    programSceneItemList: [],
    zocalos: [], // All zocalos
    zocalosDinamicos: [], // All F3s
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

async function getMediaDuration(path) {
    // Images default to 10s
    const ext = path.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'bmp', 'tga', 'gif', 'webp', 'svg', 'tiff', 'tif', 'exr', 'hdr', 'psd', 'ico', 'pbm', 'pgm', 'ppm', 'xbm', 'xpm', 'dds'];
    if (imageExts.includes(ext)) return 10;

    try {
        const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path}"`);
        return parseFloat(stdout) || 0;
    } catch (e) {
        console.error('Error getting duration with ffprobe:', e.message);
        return 0;
    }
}

async function updateState() {
    try {
        // Fetch everything
        const activeProgram = await getActiveProgram();
        state.activeProgramId = activeProgram.id;
        state.programs = await getAllPrograms();
        state.zocalos = await getAllZocalosGlobal();
        state.zocalosDinamicos = await getAllZocalosDinamicosGlobal();

        // Update Files based on GLOBAL "on air" status
        const onAirZocalo = state.zocalos.find(z => Number(z.onAir) === 1);
        const activeF3Slot = state.zocalosDinamicos.find(z => Number(z.onAir) === 1);

        await writeZocaloToFile(onAirZocalo ? [onAirZocalo] : []);

        if (activeF3Slot) {
            await writeZocaloDinamicoToFile(activeF3Slot.f3);
        } else {
            await writeZocaloDinamicoToFile("");
        }

        // Update OBS specific state if connected
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

        // Fetch playout state
        state.playout.playlist = await getPlaylist();
        state.playout.settings = await getPlayoutSettings();

        broadcast('state', state);
    } catch (e) {
        console.error('Error updating state:', e.message);
    }
}

function broadcast(event, data) {
    if (globalThis.io) {
        globalThis.io.emit(event, data);
    }
}

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
        } catch (e) {
            // Silently fail screenshots
        }
    }, 200);
}

async function startMediaStatusLoop() {
    setInterval(async () => {
        if (!connected) return;
        try {
            const status = await obs.call('GetMediaInputStatus', { inputName: 'playout' });

            // Loop A-B enforcement (Server-side)
            const settings = state.playout.settings;
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
                // Update local status immediately for smoother UI
                status.mediaCursor = Number(settings.loopABStart);
            }

            state.playout.status = {
                currentMs: status.mediaCursor,
                durationMs: status.mediaDuration,
                state: status.mediaState,
                file: ''
            };
            broadcast('playoutStatus', state.playout.status);
        } catch (e) {
            // Probably source 'playout' doesn't exist yet
        }
    }, 500);
}

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

async function playItem(item) {
    if (!connected) return;

    // Set file in OBS
    await obs.call('SetInputSettings', {
        inputName: 'playout',
        inputSettings: { local_file: item.path, looping: state.playout.settings.loopFile },
        overlay: true
    });

    // Explicitly trigger restart to ensure it plays from beginning
    await obs.call('TriggerMediaInputAction', {
        inputName: 'playout',
        mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART'
    });

    // Update DB statuses
    await updatePlaylistItemStatus(item.id, 'playing');

    // Determine next item
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

if (!globalThis.screenshotLoopStarted) {
    startScreenshotLoop();
    globalThis.screenshotLoopStarted = true;
}

if (!globalThis.mediaStatusLoopStarted) {
    startMediaStatusLoop();
    globalThis.mediaStatusLoopStarted = true;
}

function scheduleReconnect() {
    if (reconnectTimeout) return;
    console.log('Scheduling OBS reconnect in 5s...');
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectOBS();
    }, 5000);
}

export async function connectOBS() {
    if (connecting || connected) return;

    connecting = true;
    console.log('Connecting to OBS:', OBS_ADDRESS);

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    try {
        await obs.connect(OBS_ADDRESS, OBS_PASSWORD);
        // On success, Identified will fire
    } catch (e) {
        console.error('OBS Connection Error:', e.message);
        connected = false;
        connecting = false;
        scheduleReconnect();
    }
}

// Clear any existing listeners to prevent duplication on HMR
obs.removeAllListeners('ConnectionClosed');
obs.removeAllListeners('Identified');

obs.on('ConnectionClosed', () => {
    if (connected || connecting) {
        const wasConnected = connected;
        connected = false;
        connecting = false;
        if (wasConnected) {
            broadcast('connected', false);
            console.log('OBS Connection Closed');
        }
        scheduleReconnect();
    }
});

obs.on('Identified', () => {
    connected = true;
    connecting = false;
    broadcast('connected', true);
    console.log('OBS Connected and Identified');
    updateState();
});

obs.removeAllListeners('MediaInputPlaybackEnded');
obs.on('MediaInputPlaybackEnded', async (data) => {
    if (data.inputName === 'playout') {
        console.log('Playout media ended, handling auto-next...');
        await handleAutoNext();
    }
});

// Event Handlers
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

export async function initWS(io) {
    if (globalThis.wsInitialized) return;
    globalThis.wsInitialized = true;

    io.on('connection', (socket) => {
        // Send initial state
        socket.emit('state', state);
        socket.emit('connected', connected);

        socket.on('command', async ({ type, data }) => {
            console.log('Received command:', type, data);
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
                            console.log(`Auto-switching active program to ${data.program_id}`);
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
                                // Fallback if no item marked as playing
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
                        } else {
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
                        // If data.id is provided, we use the item from playlist
                        if (data.id) {
                            const item = state.playout.playlist.find(i => i.id === data.id);
                            if (item) await playItem(item);
                        } else if (data.path) {
                            // Direct path play (not in playlist)
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
                            const currentCursor = status.mediaCursor;

                            await obs.call('SetInputSettings', {
                                inputName: 'playout',
                                inputSettings: { speed_percent: data.speed },
                                overlay: true
                            });

                            // Restore cursor to avoid starting from 0
                            if (status.mediaState === 'OBS_MEDIA_STATE_PLAYING') {
                                await obs.call('SetMediaInputCursor', {
                                    inputName: 'playout',
                                    mediaCursor: currentCursor
                                });
                            }
                        } catch (e) {
                            console.error('Error updating speed:', e.message);
                        }
                        await updatePlayoutSetting('speed', data.speed);
                        break;
                    case 'playoutAddToPlaylist':
                        const duration = await getMediaDuration(data.path);
                        const newItemId = await addToPlaylist({
                            name: data.name,
                            path: data.path,
                            duration: Math.round(duration * 1000) // to ms
                        });

                        // If playlist was empty, mark as next
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

                        // If loopFile changed, update OBS immediately
                        if (data.key === 'loopFile') {
                            await obs.call('SetInputSettings', {
                                inputName: 'playout',
                                inputSettings: { looping: data.value },
                                overlay: true
                            });
                        }
                        // If stopAfterCurrent turned ON, clear next
                        if (data.key === 'stopAfterCurrent' && data.value === true) {
                            await setAllItemsIdle(); // Or just clear 'next'
                            // Re-set playing if any
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
                        // data.orders is an array of {id, sort_order}
                        for (const item of data.orders) {
                            await updatePlaylistSortOrder(item.id, item.sort_order);
                        }
                        await updateState();
                        break;
                }
            } catch (e) {
                console.error('Error executing OBS command:', e.message);
            }
        });
    });
}

// Initial connection
connectOBS();
