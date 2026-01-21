<script>
    import { onMount, onDestroy } from "svelte";
    import { playoutStore, currentMedia } from "$lib/playoutStore";
    import { sendCommand } from "$lib/obs_store";

    $: status = $playoutStore.status;
    $: loopAB = $playoutStore.loopAB;
    $: playlist = $playoutStore.playlist;

    let isDragging = false;
    let seekValue = 0;

    function formatTime(ms) {
        if (!ms) return "00:00";
        const secTotal = Math.floor(ms / 1000);
        const hours = Math.floor(secTotal / 3600);
        const mins = Math.floor((secTotal % 3600) / 60);
        const secs = secTotal % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    $: progress =
        status.durationMs > 0
            ? (status.currentMs / status.durationMs) * 100
            : 0;
    $: remainingMs = status.durationMs - status.currentMs;

    function handleAction(action) {
        sendCommand("playoutAction", { action });
    }

    function handleSeek(e) {
        const val = parseFloat(e.target.value);
        const ms = Math.floor((val / 100) * status.durationMs);
        sendCommand("playoutSeek", { ms });
    }

    function setSpeed(e) {
        sendCommand("playoutSetSpeed", { speed: parseInt(e.target.value) });
    }

    function toggleLoopAB() {
        playoutStore.setLoopAB({ ...loopAB, active: !loopAB.active });
    }

    function setPoint(type) {
        if (type === "A") {
            playoutStore.setLoopAB({ ...loopAB, start: status.currentMs });
        } else {
            playoutStore.setLoopAB({ ...loopAB, end: status.currentMs });
        }
    }

    // Auto-Next Logic
    let lastState = "";
    $: {
        if (
            status.state === "OBS_MEDIA_STATE_ENDED" &&
            lastState !== "OBS_MEDIA_STATE_ENDED"
        ) {
            handleMediaEnded();
        }
        lastState = status.state;
    }

    // Loop A-B Enforcement (Client side as in user example)
    $: {
        if (
            loopAB.active &&
            status.currentMs >= loopAB.end &&
            loopAB.end > loopAB.start
        ) {
            sendCommand("playoutSeek", { ms: loopAB.start });
        }
    }

    async function handleMediaEnded() {
        if ($playoutStore.autoNext && playlist.length > 0) {
            const nextIdx = $playoutStore.nextIndex;
            if (nextIdx >= 0) {
                const item = playlist[nextIdx];
                await loadAndPlay(item, nextIdx);
            }
        }
    }

    async function loadAndPlay(item, index) {
        sendCommand("playoutSetFile", { path: item.path });
        playoutStore.setCurrent(index);
        // Small delay to ensure OBS loaded the file before playing
        setTimeout(() => {
            sendCommand("playoutAction", { action: "PLAY" });
        }, 200);
    }

    // Listen for events from Playlist component
    function handleGlobalAction(e) {
        const { type, item, index } = e.detail;
        if (type === "LOAD_PLAY" || type === "DOUBLE_CLICK") {
            loadAndPlay(item, index);
        } else if (type === "LOAD") {
            sendCommand("playoutSetFile", { path: item.path });
            playoutStore.setCurrent(index);
        } else if (type === "PLAY") {
            sendCommand("playoutAction", { action: "PLAY" });
            playoutStore.setCurrent(index);
        }
    }

    onMount(() => {
        window.addEventListener("playout-action", handleGlobalAction);
    });

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("playout-action", handleGlobalAction);
        }
    });
</script>

<div class="card bg-dark text-white shadow-lg overflow-hidden border-secondary">
    <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0 text-info text-truncate" style="max-width: 70%;">
                {status.state.replace("OBS_MEDIA_STATE_", "")}:
                <span class="text-white small"
                    >{$currentMedia?.name || "---"}</span
                >
            </h5>
            <div
                class="badge {status.state === 'OBS_MEDIA_STATE_PLAYING'
                    ? 'bg-success'
                    : 'bg-secondary'}"
            >
                {status.state.replace("OBS_MEDIA_STATE_", "")}
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container mb-1">
            <input
                type="range"
                class="form-range custom-range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                on:input={handleSeek}
            />
        </div>

        <div class="d-flex justify-content-between small font-monospace mb-3">
            <span class="text-success">{formatTime(status.currentMs)}</span>
            <span class="text-warning">-{formatTime(remainingMs)}</span>
            <span class="text-info">{formatTime(status.durationMs)}</span>
        </div>

        <!-- Main Controls -->
        <div class="row g-2 mb-3">
            <div class="col-4">
                <button
                    class="btn btn-outline-light w-100"
                    on:click={() =>
                        window.dispatchEvent(
                            new CustomEvent("playout-action", {
                                detail: { type: "PREV" },
                            }),
                        )}>|◀</button
                >
            </div>
            <div class="col-4">
                {#if status.state === "OBS_MEDIA_STATE_PLAYING"}
                    <button
                        class="btn btn-warning w-100 fw-bold"
                        on:click={() => handleAction("PAUSE")}>PAUSE</button
                    >
                {:else}
                    <button
                        class="btn btn-success w-100 fw-bold"
                        on:click={() => handleAction("PLAY")}>PLAY</button
                    >
                {/if}
            </div>
            <div class="col-4">
                <button
                    class="btn btn-outline-light w-100"
                    on:click={() =>
                        window.dispatchEvent(
                            new CustomEvent("playout-action", {
                                detail: { type: "NEXT" },
                            }),
                        )}>▶|</button
                >
            </div>
        </div>

        <div class="row g-2 mb-3">
            <div class="col-6">
                <button
                    class="btn btn-danger w-100"
                    on:click={() => handleAction("STOP")}>STOP</button
                >
            </div>
            <div class="col-6">
                <button
                    class="btn btn-info w-100"
                    on:click={() => handleAction("RESTART")}>RESTART</button
                >
            </div>
        </div>

        <!-- Loop A-B Section -->
        <div class="group-box p-2 border border-secondary rounded mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold text-muted">LOOP A-B</span>
                <button
                    class="btn btn-sm {loopAB.active
                        ? 'btn-success'
                        : 'btn-outline-secondary'} py-0 px-2"
                    on:click={toggleLoopAB}
                >
                    {loopAB.active ? "ON" : "OFF"}
                </button>
            </div>
            <div class="row g-1">
                <div class="col-6">
                    <button
                        class="btn btn-sm btn-outline-warning w-100 py-1"
                        on:click={() => setPoint("A")}
                    >
                        SET A: {Math.floor(loopAB.start / 1000)}s
                    </button>
                </div>
                <div class="col-6">
                    <button
                        class="btn btn-sm btn-outline-warning w-100 py-1"
                        on:click={() => setPoint("B")}
                    >
                        SET B: {Math.floor(loopAB.end / 1000)}s
                    </button>
                </div>
            </div>
        </div>

        <!-- Speed and Options -->
        <div class="row align-items-center g-2">
            <div class="col-12">
                <label class="form-label small text-muted mb-0" for="speedRange"
                    >Velocidad</label
                >
                <input
                    type="range"
                    class="form-range"
                    id="speedRange"
                    min="1"
                    max="200"
                    value="100"
                    on:change={setSpeed}
                />
            </div>
            <div class="col-12">
                <div class="form-check form-switch small">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        id="autoNext"
                        bind:checked={$playoutStore.autoNext}
                    />
                    <label class="form-check-label text-muted" for="autoNext"
                        >Auto-Siguiente</label
                    >
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .custom-range {
        height: 1.5rem;
    }
    .font-monospace {
        font-family: "Courier New", Courier, monospace;
    }
    .group-box {
        background-color: rgba(0, 0, 0, 0.2);
    }
</style>
