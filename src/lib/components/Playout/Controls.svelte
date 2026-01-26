<script>
    /**
     * @file Controls.svelte
     * @description Componente de controles principales del sistema de playout.
     * Incluye botones de transporte (play, pause, stop, etc.), barra de progreso,
     * control de velocidad y configuración de bucles A-B.
     */
    import { onMount, onDestroy } from "svelte";
    import {
        playoutStore,
        currentMedia,
        nextMedia,
    } from "../../stores/playout.js";
    import { formatTime } from "../../utils/formatters.js";

    // Suscripción reactiva al estado del playout
    $: status = $playoutStore.status;
    $: playlist = $playoutStore.playlist;

    // Configuraciones reactivas vinculadas al store
    $: autoNext = $playoutStore.autoNext;
    $: loopList = $playoutStore.loopList;
    $: loopFile = $playoutStore.loopFile;
    $: stopAfterCurrent = $playoutStore.stopAfterCurrent;
    $: loopAB = $playoutStore.loopAB;

    /** @type {number} Velocidad actual seleccionada localmente en el slider */
    let localSpeed = 100;

    /** @type {boolean} Flag para evitar que el slider "tiemble" mientras el usuario lo arrastra */
    let isDraggingSpeed = false;

    // Sincronizar la velocidad local con la del store solo cuando el usuario no está arrastrando el slider
    $: {
        if (!isDraggingSpeed) {
            localSpeed = $playoutStore.speed;
        }
    }

    /** @type {number} Almacena el tiempo actual del clip cuando se inicia el cambio de velocidad */
    let speedCaptureTime = 0;

    // Lógica de cálculo de progreso y tiempo restante
    $: progress =
        status.durationMs > 0
            ? (status.currentMs / status.durationMs) * 100
            : 0;
    $: remainingMs = status.durationMs - status.currentMs;

    /**
     * Ejecuta una acción de transporte genérica (PLAY, PAUSE, STOP, RESTART).
     * @param {string} action Nombre de la acción.
     */
    function handleAction(action) {
        playoutStore.playoutAction(action);
    }

    /**
     * Gestiona el salto directo a un punto del video (seek) desde la barra de progreso.
     * @param {Event} e Evento de input del range.
     */
    function handleSeek(e) {
        const val = parseFloat(e.target.value);
        const ms = Math.floor((val / 100) * status.durationMs);
        playoutStore.playoutSeek(ms);
    }

    /** Captura el tiempo actual al pulsar el slider de velocidad para mantener la posición */
    function onSpeedPointerDown() {
        isDraggingSpeed = true;
        speedCaptureTime = status.currentMs;
    }

    /** Al soltar el slider, envía la nueva velocidad y el tiempo capturado al servidor */
    function onSpeedPointerUp() {
        isDraggingSpeed = false;
        playoutStore.setSpeed(localSpeed, speedCaptureTime);
    }

    /** Actualización visual inmediata del valor de velocidad */
    function onSpeedInputChange(e) {
        localSpeed = parseInt(e.target.value);
    }

    /** Resetea la velocidad al 100% (original) sin perder la posición de reproducción */
    function resetSpeed() {
        localSpeed = 100;
        playoutStore.setSpeed(100, status.currentMs);
    }

    /** Alterna configuraciones booleanas como AutoNext o LoopFile */
    function toggleSetting(key) {
        playoutStore.updateSetting(key, !$playoutStore[key]);
    }

    /** Activa o desactiva el bucle entre puntos A y B */
    function toggleLoopAB() {
        playoutStore.setLoopAB({ ...loopAB, active: !loopAB.active });
    }

    /** Establece el punto de inicio (A) o fin (B) del bucle en el segundo actual */
    function setPoint(type) {
        if (type === "A") {
            playoutStore.setLoopAB({ ...loopAB, start: status.currentMs });
        } else {
            playoutStore.setLoopAB({ ...loopAB, end: status.currentMs });
        }
    }

    /** Salta al clip anterior en la lista de reproducción */
    function handlePrev() {
        const idx = playlist.findIndex((i) => i.status === "playing");
        if (idx > 0) {
            playoutStore.setCurrent(playlist[idx - 1].id);
        } else if (idx === 0 && loopList) {
            playoutStore.setCurrent(playlist[playlist.length - 1].id);
        }
    }

    /** Salta al siguiente clip en la lista de reproducción */
    function handleNext() {
        const idx = playlist.findIndex((i) => i.status === "playing");
        if (idx !== -1 && idx < playlist.length - 1) {
            playoutStore.setCurrent(playlist[idx + 1].id);
        } else if (idx === playlist.length - 1 && loopList) {
            playoutStore.setCurrent(playlist[0].id);
        }
    }

    /**
     * Limpia el nombre del estado de OBS para mostrar algo más amigable en UI.
     * @param {string} state Estado crudo de OBS.
     */
    function getSimpleState(state) {
        if (!state) return "IDLE";
        const s = state.replace("OBS_MEDIA_STATE_", "");
        return s === "OBS_MEDIA_STATE_ENDED" ? "ENDED" : s;
    }
</script>

<div
    class="card bg-dark text-white shadow-lg border-secondary main-controls-card"
>
    <div class="card-body p-3">
        <!-- Sección de Estado Actual -->
        <div
            class="status-box mb-3 p-2 rounded border border-secondary bg-black"
        >
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small text-muted fw-bold"
                    >ESTADO DE REPRODUCCIÓN</span
                >
                <span
                    class="badge {status.state === 'OBS_MEDIA_STATE_PLAYING'
                        ? 'bg-primary'
                        : 'bg-secondary'} px-3"
                >
                    {getSimpleState(status.state)}
                </span>
            </div>
            <div class="item-info">
                <div class="d-flex gap-2 align-items-baseline">
                    <span class="small text-info text-nowrap">AL AIRE:</span>
                    <span class="text-white-50 text-truncate fw-bold"
                        >{$currentMedia?.name || "---"}</span
                    >
                </div>
                <div class="d-flex gap-2 align-items-baseline">
                    <span class="small text-warning text-nowrap"
                        >SIGUIENTE:</span
                    >
                    <span class="text-white-50 text-truncate"
                        >{$nextMedia?.name || "---"}</span
                    >
                </div>
            </div>
        </div>

        <!-- Barra de Progreso del Clip -->
        <div class="progress-section mb-1 mt-3">
            <input
                type="range"
                class="form-range playback-range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                on:input={handleSeek}
            />
        </div>

        <!-- Etiquetas de Tiempo -->
        <div
            class="d-flex justify-content-between small font-monospace mb-4 time-labels"
        >
            <div class="d-flex flex-column">
                <span class="text-muted tiny-label">TRANSCURRIDO</span>
                <span class="text-success">{formatTime(status.currentMs)}</span>
            </div>
            <div class="d-flex flex-column text-center">
                <span class="text-muted tiny-label">RESTANTE</span>
                <span class="text-warning">-{formatTime(remainingMs)}</span>
            </div>
            <div class="d-flex flex-column text-end">
                <span class="text-muted tiny-label">DURACIÓN TOTAL</span>
                <span class="text-info">{formatTime(status.durationMs)}</span>
            </div>
        </div>

        <!-- Controles de Transporte (PREV, PLAY/PAUSE, NEXT) -->
        <div class="transport-grid mb-3">
            <button
                class="btn btn-dark border-secondary transport-btn"
                on:click={handlePrev}
                title="Anterior"
            >
                <i class="bi bi-skip-start-fill"></i>
                <span class="btn-text">ANTERIOR</span>
            </button>
            <div class="play-pause-group">
                {#if status.state === "OBS_MEDIA_STATE_PLAYING"}
                    <button
                        class="btn btn-warning transport-btn main-btn w-100"
                        on:click={() => handleAction("PAUSE")}
                    >
                        <i class="bi bi-pause-fill"></i>
                        <span class="btn-text">PAUSA</span>
                    </button>
                {:else}
                    <button
                        class="btn btn-success transport-btn main-btn w-100"
                        on:click={() => handleAction("PLAY")}
                    >
                        <i class="bi bi-play-fill"></i>
                        <span class="btn-text">PLAY</span>
                    </button>
                {/if}
            </div>
            <button
                class="btn btn-dark border-secondary transport-btn"
                on:click={handleNext}
                title="Siguiente"
            >
                <i class="bi bi-skip-end-fill"></i>
                <span class="btn-text">SIGUIENTE</span>
            </button>
        </div>

        <!-- Botones de Acción Secundaria (STOP, RESTART) -->
        <div class="row g-2 mb-4">
            <div class="col-6">
                <button
                    class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    on:click={() => handleAction("STOP")}
                >
                    <i class="bi bi-stop-fill"></i> STOP
                </button>
            </div>
            <div class="col-6">
                <button
                    class="btn btn-outline-info btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    on:click={() => handleAction("RESTART")}
                >
                    <i class="bi bi-arrow-counterclockwise"></i> REINICIAR
                </button>
            </div>
        </div>

        <!-- Opciones de Automatización -->
        <div class="row g-2 mb-4">
            <div class="col-6">
                <button
                    class="btn btn-sm w-100 {stopAfterCurrent
                        ? 'btn-danger'
                        : 'btn-outline-secondary'} text-uppercase tiny-font"
                    on:click={() => toggleSetting("stopAfterCurrent")}
                >
                    Detener tras actual
                </button>
            </div>
            <div class="col-6">
                <button
                    class="btn btn-sm w-100 {autoNext
                        ? 'btn-primary'
                        : 'btn-outline-secondary'} text-uppercase tiny-font"
                    on:click={() => toggleSetting("autoNext")}
                >
                    Auto Próximo {autoNext ? "SÍ" : "NO"}
                </button>
            </div>
        </div>

        <!-- Sección de Bucle A-B -->
        <div
            class="loop-ab-section p-2 border border-secondary rounded mb-3 bg-black"
        >
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="tiny-font fw-bold text-muted">BUCLE A-B</span>
                <button
                    class="btn btn-sm {loopAB?.active
                        ? 'btn-success'
                        : 'btn-outline-secondary'} py-0 px-2 tiny-font"
                    on:click={toggleLoopAB}
                >
                    {loopAB?.active ? "ACTIVO" : "INACTIVO"}
                </button>
            </div>
            <div class="row g-1">
                <div class="col-6">
                    <button
                        class="btn btn-sm btn-outline-warning w-100 py-1 tiny-font"
                        on:click={() => setPoint("A")}
                    >
                        SET A: {formatTime(loopAB?.start)}
                    </button>
                </div>
                <div class="col-6">
                    <button
                        class="btn btn-sm btn-outline-warning w-100 py-1 tiny-font"
                        on:click={() => setPoint("B")}
                    >
                        SET B: {formatTime(loopAB?.end)}
                    </button>
                </div>
            </div>
        </div>

        <!-- Control de Velocidad -->
        <div
            class="speed-section p-2 border border-secondary rounded mb-3 bg-black"
        >
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="tiny-font fw-bold text-muted"
                    >CONTROL DE VELOCIDAD</span
                >
                <span class="badge bg-dark border border-secondary text-info"
                    >{localSpeed}%</span
                >
            </div>
            <div class="position-relative px-1">
                <input
                    type="range"
                    class="form-range speed-range"
                    min="25"
                    max="200"
                    step="1"
                    bind:value={localSpeed}
                    on:pointerdown={onSpeedPointerDown}
                    on:pointerup={onSpeedPointerUp}
                    on:input={onSpeedInputChange}
                />
                <div
                    class="speed-marker"
                    role="button"
                    tabindex="0"
                    style="left: 42.85%;"
                    on:click={resetSpeed}
                    on:keydown={(e) => e.key === "Enter" && resetSpeed()}
                    title="Velocidad Original (100%)"
                ></div>
            </div>
        </div>

        <!-- Opciones de Bucle (Archivo / Lista) -->
        <div class="loop-section p-2 border border-secondary rounded bg-black">
            <span class="tiny-font fw-bold text-muted d-block mb-2"
                >MODO DE REPETICIÓN</span
            >
            <div class="d-flex gap-2">
                <button
                    class="btn btn-sm flex-grow-1 {loopFile
                        ? 'btn-info'
                        : 'btn-outline-secondary'} tiny-font"
                    on:click={() => toggleSetting("loopFile")}
                >
                    REPETIR CLIP
                </button>
                <button
                    class="btn btn-sm flex-grow-1 {loopList
                        ? 'btn-info'
                        : 'btn-outline-secondary'} tiny-font"
                    on:click={() => toggleSetting("loopList")}
                >
                    REPETIR LISTA
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .main-controls-card {
        background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
    }
    .status-box {
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    .tiny-label {
        font-size: 0.6rem;
        letter-spacing: 1px;
    }
    .tiny-font {
        font-size: 0.7rem;
        font-weight: bold;
    }
    .playback-range {
        height: 6px;
    }
    .playback-range::-webkit-slider-runnable-track {
        background: #333;
        height: 6px;
        border-radius: 3px;
    }
    .playback-range::-webkit-slider-thumb {
        margin-top: -5px;
        background: #007bff;
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
    }

    .transport-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
    }
    .transport-btn {
        font-size: 0.8rem;
        font-weight: bold;
        padding: 10px 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }
    .main-btn {
        height: 100%;
        font-size: 1rem;
    }
    .main-btn i {
        font-size: 1.5rem;
    }

    .speed-section .position-relative {
        height: 20px;
        display: flex;
        align-items: center;
    }
    .speed-range {
        margin: 0;
    }
    .speed-marker {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ffc107;
        opacity: 0.5;
        cursor: pointer;
        z-index: 1;
    }
    .speed-marker:hover {
        opacity: 1;
        width: 4px;
        margin-left: -1px;
    }

    .item-info {
        font-family: inherit;
        line-height: 1.4;
    }
</style>
