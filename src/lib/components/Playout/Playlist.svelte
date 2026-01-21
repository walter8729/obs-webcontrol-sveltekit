<script>
    import { playoutStore } from "$lib/playoutStore";
    import { flip } from "svelte/animate";

    let draggingIndex = null;
    let contextMenu = { show: false, x: 0, y: 0, index: -1 };

    $: playlist = $playoutStore.playlist;

    function formatDuration(ms) {
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

    function handleDragStart(index) {
        draggingIndex = index;
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === index) return;

        playoutStore.reorderPlaylist(draggingIndex, index);
        draggingIndex = index;
    }

    function handleDrop() {
        draggingIndex = null;
    }

    function showContextMenu(e, index) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            index,
        };
    }

    function closeContextMenu() {
        contextMenu.show = false;
    }

    function action(type) {
        const item = playlist[contextMenu.index];
        if (!item) return;

        if (type === "load_play") {
            // Logic to be implemented in Controls or higher level
            window.dispatchEvent(
                new CustomEvent("playout-action", {
                    detail: {
                        type: "LOAD_PLAY",
                        item,
                        index: contextMenu.index,
                    },
                }),
            );
        } else if (type === "load") {
            window.dispatchEvent(
                new CustomEvent("playout-action", {
                    detail: { type: "LOAD", item, index: contextMenu.index },
                }),
            );
        } else if (type === "play") {
            window.dispatchEvent(
                new CustomEvent("playout-action", {
                    detail: { type: "PLAY", item, index: contextMenu.index },
                }),
            );
        } else if (type === "next") {
            playoutStore.setNext(contextMenu.index);
        }
        closeContextMenu();
    }

    function handleDoubleClick(index) {
        const item = playlist[index];
        // Default double click: Load and Play (or just Load based on settings)
        window.dispatchEvent(
            new CustomEvent("playout-action", {
                detail: { type: "DOUBLE_CLICK", item, index },
            }),
        );
    }
</script>

<div
    class="playlist-container card bg-dark text-white h-100"
    on:click={closeContextMenu}
    on:keydown={(e) => e.key === "Escape" && closeContextMenu()}
    role="presentation"
>
    <div
        class="card-header py-2 d-flex justify-content-between align-items-center"
    >
        <h6 class="mb-0">LISTA DE REPRODUCCIÓN</h6>
        <button
            class="btn btn-sm btn-outline-danger py-0"
            on:click={() => playoutStore.clearPlaylist()}>Limpiar</button
        >
    </div>

    <div
        class="playlist-body overflow-auto flex-grow-1"
        style="max-height: 500px;"
    >
        {#if playlist.length === 0}
            <div class="p-4 text-center text-muted italic">
                La lista está vacía. Agrega archivos desde el explorador.
            </div>
        {:else}
            <div class="list-group list-group-flush shadow-sm">
                {#each playlist as item, i (item.id)}
                    <div
                        animate:flip={{ duration: 200 }}
                        class="list-group-item list-group-item-action bg-dark p-0 border-secondary d-flex align-items-center item-row"
                        class:playing={item.status === "playing"}
                        class:next={item.status === "next"}
                        class:loaded={item.status === "loaded"}
                        class:dragging={draggingIndex === i}
                        draggable="true"
                        on:dragstart={() => handleDragStart(i)}
                        on:dragover={(e) => handleDragOver(e, i)}
                        on:drop={handleDrop}
                        on:contextmenu={(e) => showContextMenu(e, i)}
                        on:dblclick={() => handleDoubleClick(i)}
                    >
                        <div class="index px-2 text-muted fw-bold small">
                            {i + 1}
                        </div>
                        <div
                            class="name flex-grow-1 text-truncate py-2 small ps-1"
                        >
                            {item.name}
                        </div>
                        <div class="duration px-2 small font-monospace">
                            {formatDuration(item.duration || 0)}
                        </div>
                        <button
                            class="btn btn-sm text-danger px-2 border-0"
                            on:click={() => playoutStore.removeFromPlaylist(i)}
                            >×</button
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if contextMenu.show}
    <div
        class="context-menu bg-secondary shadow rounded py-1 border border-dark"
        style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
    >
        <button on:click={() => action("load_play")}>Cargar y Reproducir</button
        >
        <button on:click={() => action("load")}>Cargar</button>
        <button on:click={() => action("play")}>Reproducir</button>
        <div class="dropdown-divider border-dark"></div>
        <button on:click={() => action("next")}>Marcar como siguiente</button>
    </div>
{/if}

<style>
    .playlist-container {
        user-select: none;
    }
    .item-row {
        cursor: grab;
        border-bottom: 1px solid #333 !important;
    }
    .item-row:active {
        cursor: grabbing;
    }

    /* Colores solicitados */
    .playing {
        background-color: rgba(40, 167, 69, 0.3) !important;
        color: #28a745 !important;
        border-left: 4px solid #28a745 !important;
    }
    .next {
        background-color: rgba(255, 193, 7, 0.3) !important;
        color: #ffc107 !important;
        border-left: 4px solid #ffc107 !important;
    }
    .loaded {
        background-color: rgba(220, 53, 69, 0.3) !important;
        color: #dc3545 !important;
        border-left: 4px solid #dc3545 !important;
    }

    .dragging {
        opacity: 0.5;
        background: #444 !important;
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
        padding: 5px 15px;
        border: none;
        background: none;
        color: white;
        font-size: 0.85rem;
    }
    .context-menu button:hover {
        background-color: #007bff;
    }
</style>
