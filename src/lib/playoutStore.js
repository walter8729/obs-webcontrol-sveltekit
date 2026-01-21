import { writable, derived } from 'svelte/store';

function createPlayoutStore() {
    const { subscribe, set, update } = writable({
        playlist: [],
        currentIndex: -1,
        nextIndex: -1,
        autoNext: true,
        playMode: 'playlist', // 'single', 'playlist', 'loop-file', 'loop-playlist'
        loopAB: {
            active: false,
            start: 0,
            end: 0
        },
        status: {
            currentMs: 0,
            durationMs: 0,
            state: 'IDLE', // 'PLAYING', 'PAUSED', 'STOPPED', 'IDLE'
            file: ''
        }
    });

    return {
        subscribe,
        addToFileList: (file) => update(s => {
            const newItem = {
                ...file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'idle' // 'playing', 'loaded', 'next'
            };
            return { ...s, playlist: [...s.playlist, newItem] };
        }),
        removeFromPlaylist: (index) => update(s => {
            const newList = s.playlist.filter((_, i) => i !== index);
            let newCurrent = s.currentIndex;
            let newNext = s.nextIndex;

            if (index === s.currentIndex) newCurrent = -1;
            else if (index < s.currentIndex) newCurrent--;

            if (index === s.nextIndex) newNext = -1;
            else if (index < s.nextIndex) newNext--;

            return { ...s, playlist: newList, currentIndex: newCurrent, nextIndex: newNext };
        }),
        reorderPlaylist: (oldIndex, newIndex) => update(s => {
            const newList = [...s.playlist];
            const [movedItem] = newList.splice(oldIndex, 1);
            newList.splice(newIndex, 0, movedItem);

            // Adjust indices
            let newCurrent = s.currentIndex;
            if (s.currentIndex === oldIndex) newCurrent = newIndex;
            else if (oldIndex < s.currentIndex && newIndex >= s.currentIndex) newCurrent--;
            else if (oldIndex > s.currentIndex && newIndex <= s.currentIndex) newCurrent++;

            let newNext = s.nextIndex;
            if (s.nextIndex === oldIndex) newNext = newIndex;
            else if (oldIndex < s.nextIndex && newIndex >= s.nextIndex) newNext--;
            else if (oldIndex > s.nextIndex && newIndex <= s.nextIndex) newNext++;

            return { ...s, playlist: newList, currentIndex: newCurrent, nextIndex: newNext };
        }),
        setCurrent: (index) => update(s => {
            // Update status of items
            const newList = s.playlist.map((item, i) => ({
                ...item,
                status: i === index ? 'playing' : (i === s.nextIndex ? 'next' : 'idle')
            }));

            // If we have a playlist mode and no next specified, set next to index + 1
            let next = s.nextIndex;
            if (next === -1 || next === index) {
                next = (index + 1) % s.playlist.length;
            }

            return { ...s, playlist: newList, currentIndex: index, nextIndex: next };
        }),
        setNext: (index) => update(s => {
            const newList = s.playlist.map((item, i) => ({
                ...item,
                status: i === s.currentIndex ? 'playing' : (i === index ? 'next' : 'idle')
            }));
            return { ...s, playlist: newList, nextIndex: index };
        }),
        updateStatus: (newStatus) => update(s => ({
            ...s,
            status: { ...s.status, ...newStatus }
        })),
        setLoopAB: (loopAB) => update(s => ({ ...s, loopAB })),
        setPlayMode: (playMode) => update(s => ({ ...s, playMode })),
        clearPlaylist: () => set({
            playlist: [],
            currentIndex: -1,
            nextIndex: -1,
            autoNext: true,
            playMode: 'playlist',
            loopAB: { active: false, start: 0, end: 0 },
            status: { currentMs: 0, durationMs: 0, state: 'IDLE', file: '' }
        })
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
