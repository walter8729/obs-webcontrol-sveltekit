<script>
    /**
     * @file Playlist.svelte
     * @description Componente de lista de reproducción con soporte para reordenamiento mediante Drag & Drop,
     * menú contextual y estados visuales para medios "al aire" y "siguiente".
     */
    import { playoutStore } from "../../stores/playout.js";
    import { formatTime } from "../../utils/formatters.js";
    import { flip } from "svelte/animate";

    /** @type {number|null} Índice del elemento que se está arrastrando actualmente */
    let draggingIndex = null;

    /** @type {Object} Estado del menú contextual */
    let contextMenu = { show: false, x: 0, y: 0, index: -1 };

    // Suscripción a la lista de reproducción del store
    $: playlist = $playoutStore.playlist;

    // Cálculo reactivo de la duración total de la lista
    $: totalDurationMs = playlist.reduce(
        (acc, item) => acc + (item.duration || 0),
        0,
    );

    /**
     * Inicia el proceso de arrastre guardando el índice origen.
     * @param {number} index
     */
    function handleDragStart(index) {
        draggingIndex = index;
    }

    /**
     * Gestiona el evento de arrastre sobre otro elemento para permitir el reordenamiento visual.
     * @param {DragEvent} e
     * @param {number} index Índice destino.
     */
    function handleDragOver(e, index) {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === index) return;

        // Clonar lista y realizar reordenamiento local
        const newList = [...playlist];
        const [movedItem] = newList.splice(draggingIndex, 1);
        newList.splice(index, 0, movedItem);

        // Mapear nuevos órdenes para persistir en el servidor
        const orders = newList.map((item, idx) => ({
            id: item.id,
            sort_order: idx + 1,
        }));

        playoutStore.reorderPlaylist(orders);
        draggingIndex = index;
    }

    /** Limpia el índice de arrastre al soltar el elemento */
    function handleDrop() {
        draggingIndex = null;
    }

    /**
     * Muestra el menú contextual en la posición del ratón.
     * @param {MouseEvent} e
     * @param {number} index Índice del elemento sobre el que se hace clic derecho.
     */
    function showContextMenu(e, index) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            index,
        };
    }

    /** Cierra el menú contextual */
    function closeContextMenu() {
        contextMenu.show = false;
    }

    /**
     * Ejecuta una acción desde el menú contextual (play inmediato o marcar como siguiente).
     * @param {string} type Tipo de acción.
     */
    function handleMenuAction(type) {
        const item = playlist[contextMenu.index];
        if (!item) return;

        if (type === "play") {
            playoutStore.setCurrent(item.id);
        } else if (type === "next") {
            playoutStore.setNext(item.id);
        }
        closeContextMenu();
    }

    /** Reproduce un elemento al hacer doble clic */
    function handleDoubleClick(index) {
        const item = playlist[index];
        playoutStore.setCurrent(item.id);
    }
</script>

<!-- Contenedor principal de la Playlist -->
<div
    class="playlist-container card bg-dark text-white h-100 border-secondary"
    on:click={closeContextMenu}
    on:keydown={(e) => e.key === "Escape" && closeContextMenu()}
    role="presentation"
>
    <!-- Cabecera con duración total y botón de limpieza -->
    <div
        class="card-header py-2 d-flex justify-content-between align-items-center bg-dark"
    >
        <h6 class="mb-0 text-light fw-bold uppercase">LISTA DE REPRODUCCIÓN</h6>
        <div class="d-flex align-items-center gap-2">
            <span class="small text-muted font-monospace"
                >{formatTime(totalDurationMs)}</span
            >
            <button
                class="btn btn-sm btn-outline-danger py-0 px-2"
                on:click={() => playoutStore.clearPlaylist()}>Limpiar</button
            >
        </div>
    </div>

    <!-- Lista de elementos con scroll -->
    <div
        class="playlist-body overflow-auto flex-grow-1"
        style="max-height: 500px;"
    >
        {#if playlist.length === 0}
            <div class="p-4 text-center text-muted italic">
                La lista está vacía. Arrastra archivos desde el explorador.
            </div>
        {:else}
            <div class="list-group list-group-flush">
                {#each playlist as item, i (item.id)}
                    <div
                        animate:flip={{ duration: 200 }}
                        class="list-group-item list-group-item-action bg-dark p-0 border-secondary d-flex align-items-center item-row"
                        class:playing={item.status === "playing"}
                        class:next={item.status === "next"}
                        class:dragging={draggingIndex === i}
                        draggable="true"
                        on:dragstart={() => handleDragStart(i)}
                        on:dragover={(e) => handleDragOver(e, i)}
                        on:drop={handleDrop}
                        on:contextmenu={(e) => showContextMenu(e, i)}
                        on:dblclick={() => handleDoubleClick(i)}
                    >
                        <!-- Índice del elemento en la lista -->
                        <div
                            class="index px-2 text-white-50 small font-monospace"
                        >
                            {(i + 1).toString().padStart(2, "0")}
                        </div>
                        <!-- Nombre del archivo -->
                        <div
                            class="name flex-grow-1 text-truncate py-2 small ps-1 text-light"
                        >
                            {item.name}
                        </div>
                        <!-- Duración individual -->
                        <div
                            class="duration px-2 small font-monospace text-white-50"
                        >
                            {formatTime(item.duration || 0)}
                        </div>
                        <!-- Botón para quitar de la lista -->
                        <button
                            class="btn btn-sm text-danger px-2 border-0 opacity-50 hover-opacity-100"
                            on:click={() =>
                                playoutStore.removeFromPlaylist(item.id)}
                            >×</button
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Menú Contextual personalizado -->
{#if contextMenu.show}
    <div
        class="context-menu bg-dark shadow-lg rounded py-1 border border-secondary"
        style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
    >
        <button on:click={() => handleMenuAction("play")}>
            <i class="bi bi-play-fill me-2"></i> Reproducir ahora
        </button>
        <button on:click={() => handleMenuAction("next")}>
            <i class="bi bi-快速forward-fill me-2"></i> Marcar como Siguiente
        </button>
        <div class="dropdown-divider border-secondary"></div>
        <button
            class="text-danger"
            on:click={() => {
                playoutStore.removeFromPlaylist(playlist[contextMenu.index].id);
                closeContextMenu();
            }}
        >
            <i class="bi bi-trash-fill me-2"></i> Eliminar de lista
        </button>
    </div>
{/if}

<style>
    .playlist-container {
        user-select: none;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }
    .playlist-body::-webkit-scrollbar {
        width: 6px;
    }
    .playlist-body::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 3px;
    }
    .item-row {
        cursor: grab;
        border-bottom: 1px solid #2a2a2a !important;
        background-color: transparent !important;
        transition: background-color 0.2s;
    }
    .item-row:hover {
        background-color: #2a2a2a !important;
    }
    .item-row:active {
        cursor: grabbing;
    }

    .hover-opacity-100:hover {
        opacity: 1 !important;
    }

    .playing {
        background-color: rgba(0, 123, 255, 0.15) !important;
        border-left: 3px solid #007bff !important;
    }
    .playing .name {
        color: #007bff !important;
        font-weight: bold;
    }
    .next {
        background-color: rgba(255, 193, 7, 0.1) !important;
        border-left: 3px solid #ffc107 !important;
    }
    .next .name {
        color: #ffc107 !important;
    }

    .dragging {
        opacity: 0.5;
        background: #333 !important;
    }

    .context-menu {
        position: fixed;
        z-index: 1000;
        min-width: 180px;
    }
    .context-menu button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 8px 15px;
        border: none;
        background: none;
        color: #eee;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    .context-menu button:hover {
        background-color: #333;
        color: white;
    }
    .uppercase {
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>
