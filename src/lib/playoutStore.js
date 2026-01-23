import { writable, derived } from 'svelte/store';
import { sendCommand } from './obs_store';

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
        addToFileList: (item) => {
            sendCommand('playoutAddToPlaylist', item);
        },
        removeFromPlaylist: (id) => {
            sendCommand('playoutRemoveFromPlaylist', { id });
        },
        reorderPlaylist: (orders) => {
            // orders is [{id, sort_order}, ...]
            sendCommand('playoutReorder', { orders });
        },
        setCurrent: (id) => {
            sendCommand('playoutSetFile', { id });
        },
        setNext: (id) => {
            sendCommand('playoutSetNext', { id });
        },
        updateStatus: (newStatus) => update(s => ({
            ...s,
            status: { ...s.status, ...newStatus }
        })),
        updateSetting: (key, value) => {
            sendCommand('playoutUpdateSettings', { key, value });
        },
        setLoopAB: (loopAB) => {
            update(s => ({ ...s, loopAB }));
            sendCommand('playoutSetLoopAB', loopAB);
        },
        clearPlaylist: () => {
            sendCommand('playoutClearPlaylist', {});
        },
        playoutAction: (action) => {
            sendCommand('playoutAction', { action });
        },
        playoutSeek: (ms) => {
            sendCommand('playoutSeek', { ms });
        },
        setSpeed: (speed) => {
            sendCommand('playoutSetSpeed', { speed });
        }
    };
}

export const playoutStore = createPlayoutStore();

// Useful derived stores
export const currentMedia = derived(playoutStore, $s =>
    $s.currentIndex >= 0 ? $s.playlist[$s.currentIndex] : null
);

export const nextMedia = derived(playoutStore, $s =>
    $s.nextIndex >= 0 ? $s.playlist[$s.nextIndex] : null
);
