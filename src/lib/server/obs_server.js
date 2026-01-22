import OBSWebSocket from 'obs-websocket-js';
import { OBS_ADDRESS, OBS_PASSWORD } from '../config.js';
import { getAllZocalos, setOnAirZocalo, addZocalo, deleteZocalo, updateZocalo, getAllPrograms, getActiveProgram, setActiveProgram, addProgram, deleteProgram, getZocaloDinamico, updateZocaloDinamico, getAllZocalosGlobal, getAllZocalosDinamicosGlobal, updateProgram, setOnAirAuxiliary } from '../../db.mjs';
import { readZocaloDinamicoFromFile, writeZocaloToFile, writeZocaloDinamicoToFile } from '../../file.js';

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
    activeProgramId: 1
};

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
            broadcast('playoutStatus', {
                currentMs: status.mediaCursor,
                durationMs: status.mediaDuration,
                state: status.mediaState,
                file: '' // We could get this from settings if needed
            });
        } catch (e) {
            // Probably source 'playout' doesn't exist yet or is not a media source
        }
    }, 500);
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
                        await obs.call('TriggerMediaInputAction', {
                            inputName: 'playout',
                            mediaAction: `OBS_WEBSOCKET_MEDIA_INPUT_ACTION_${data.action}`
                        });
                        break;
                    case 'playoutSeek':
                        await obs.call('SetMediaInputCursor', {
                            inputName: 'playout',
                            mediaCursor: data.ms
                        });
                        break;
                    case 'playoutSetFile':
                        await obs.call('SetInputSettings', {
                            inputName: 'playout',
                            inputSettings: { local_file: data.path },
                            overlay: true
                        });
                        break;
                    case 'playoutSetSpeed':
                        await obs.call('SetInputSettings', {
                            inputName: 'playout',
                            inputSettings: { speed_percent: data.speed },
                            overlay: true
                        });
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
