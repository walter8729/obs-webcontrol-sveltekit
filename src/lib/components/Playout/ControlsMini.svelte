<script>
    /**
     * @file ControlsMini.svelte
     * @description Versión minimalista de los controles de playout con estética Winamp.
     */
    import { playoutStore, currentMedia } from "../../stores/playout.js";
    import { formatTime } from "../../utils/formatters.js";

    $: status = $playoutStore.status;

    // Cálculos de tiempo
    $: progress =
        status.durationMs > 0
            ? (status.currentMs / status.durationMs) * 100
            : 0;
    $: remainingMs = status.durationMs - status.currentMs;

    function handleAction(action) {
        playoutStore.playoutAction(action);
    }

    function handleSeek(e) {
        const val = parseFloat(e.target.value);
        const ms = Math.floor((val / 100) * status.durationMs);
        playoutStore.playoutSeek(ms);
    }

    function handlePrev() {
        const playlist = $playoutStore.playlist;
        const idx = playlist.findIndex((i) => i.status === "playing");
        if (idx > 0) {
            playoutStore.setCurrent(playlist[idx - 1].id);
        } else if (idx === 0 && $playoutStore.loopList) {
            playoutStore.setCurrent(playlist[playlist.length - 1].id);
        }
    }

    function handleNext() {
        const playlist = $playoutStore.playlist;
        const idx = playlist.findIndex((i) => i.status === "playing");
        if (idx !== -1 && idx < playlist.length - 1) {
            playoutStore.setCurrent(playlist[idx + 1].id);
        } else if (idx === playlist.length - 1 && $playoutStore.loopList) {
            playoutStore.setCurrent(playlist[0].id);
        }
    }
</script>

<div
    class="controls-mini-container border border-secondary bg-dark text-white shadow-lg rounded overflow-hidden"
>
    <!-- Pantalla Superior: Título y Tiempo -->
    <div
        class="display-area bg-black p-2 d-flex align-items-center gap-2 border-bottom border-secondary"
    >
        <div class="time-display font-monospace text-success fw-bold">
            {formatTime(status.currentMs)}
        </div>
        <div class="title-container flex-grow-1 overflow-hidden">
            <div class="scrolling-text small text-info fw-bold">
                {$currentMedia?.name || "SIN SEÑAL..."}&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
        </div>
    </div>

    <!-- Barra de Progreso -->
    <div class="progress-area bg-black px-2 py-1">
        <input
            type="range"
            class="form-range mini-seekbar"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            on:input={handleSeek}
        />
    </div>

    <!-- Fila de Botones: Iconos con estilo del proyecto -->
    <div
        class="actions-row d-flex justify-content-between align-items-center p-2 bg-dark"
    >
        <div class="btn-group btn-group-sm">
            <button
                class="btn btn-dark border-secondary px-2"
                on:click={handlePrev}
                title="Anterior"
            >
                ⏮
            </button>
            {#if status.state === "OBS_MEDIA_STATE_PLAYING"}
                <button
                    class="btn btn-warning px-3"
                    on:click={() => handleAction("PAUSE")}
                    title="Pausa"
                >
                    ⏯
                </button>
            {:else}
                <button
                    class="btn btn-success px-2"
                    on:click={() => handleAction("PLAY")}
                    title="Reproducir"
                >
                    ⏯
                </button>
            {/if}
            <button
                class="btn btn-danger px-2"
                on:click={() => handleAction("STOP")}
                title="Detener"
            >
                ⏹
            </button>
            <button
                class="btn btn-dark border-secondary px-2"
                on:click={handleNext}
                title="Siguiente"
            >
                ⏭
            </button>
        </div>

        <div class="d-flex align-items-center gap-2">
            <div class="state-indicator small">
                <span
                    class="badge {status.state === 'OBS_MEDIA_STATE_PLAYING'
                        ? 'bg-primary'
                        : 'bg-secondary'}"
                >
                    {status.state === "OBS_MEDIA_STATE_PLAYING"
                        ? "PLAYING"
                        : "IDLE"}
                </span>
            </div>
            <button
                class="btn btn-outline-info btn-sm p-1 leading-none"
                on:click={() => handleAction("RESTART")}
                title="Reiniciar"
            >
                🔃
            </button>
        </div>
    </div>
</div>

<style>
    .controls-mini-container {
        font-family: "asap_condensedregular", sans-serif;
        width: 100%;
    }

    .display-area {
        height: 34px;
    }

    .time-display {
        font-size: 1.1rem;
        min-width: 75px;
        text-shadow: 0 0 8px rgba(25, 255, 25, 0.5);
    }

    .title-container {
        white-space: nowrap;
        mask-image: linear-gradient(
            to right,
            transparent,
            black 10%,
            black 90%,
            transparent
        );
    }

    .scrolling-text {
        display: inline-block;
        animation: scroll-left 20s linear infinite;
        font-size: 0.85rem;
    }

    @keyframes scroll-left {
        0% {
            transform: translateX(100%);
        }
        100% {
            transform: translateX(-100%);
        }
    }

    .mini-seekbar {
        height: 4px;
        padding: 0;
        margin: 4px 0;
    }

    .leading-none {
        line-height: 1;
    }

    /* Overrides para que los botones se vean bien en tamaño mini */
    .btn-group-sm > .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
    }
</style>
