<script>
    import { playoutStore } from "$lib/playoutStore";
    import { flip } from "svelte/animate";

    let draggingIndex = null;
    let contextMenu = { show: false, x: 0, y: 0, index: -1 };

    $: playlist = $playoutStore.playlist;

    $: totalDurationMs = playlist.reduce(
        (acc, item) => acc + (item.duration || 0),
        0,
    );

    function formatDuration(ms) {
        if (!ms) return "00:00";
        const secTotal = Math.floor(ms / 1000);
        const days = Math.floor(secTotal / 86400);
        const hours = Math.floor((secTotal % 86400) / 3600);
        const mins = Math.floor((secTotal % 3600) / 60);
        const secs = secTotal % 60;

        const hms = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

        if (days > 0) return `${days}d ${hms}`;
        if (hours > 0) return hms;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function formatTotalDuration(ms) {
        if (!ms) return "00:00";
        const secTotal = Math.floor(ms / 1000);
        const days = Math.floor(secTotal / 86400);
        const hours = Math.floor((secTotal % 86400) / 3600);
        const mins = Math.floor((secTotal % 3600) / 60);
        const secs = secTotal % 60;

        const hms = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

        if (days > 0) return `${days}d ${hms}`;
        if (hours > 0) return hms;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function handleDragStart(index) {
        draggingIndex = index;
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === index) return;

        // Perform local reorder for UI feel, then sync
        const newList = [...playlist];
        const [movedItem] = newList.splice(draggingIndex, 1);
        newList.splice(index, 0, movedItem);
        // We calculate all orders to simplify backend
        const orders = newList.map((item, idx) => ({
            id: item.id,
            sort_order: idx + 1,
        }));
        playoutStore.reorderPlaylist(orders);

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

        if (type === "play") {
            playoutStore.setCurrent(item.id);
        } else if (type === "next") {
            playoutStore.setNext(item.id);
        }
        closeContextMenu();
    }

    function handleDoubleClick(index) {
        const item = playlist[index];
        playoutStore.setCurrent(item.id);
    }
</script>

<div
    class="playlist-container card bg-dark text-white h-100 border-secondary"
    on:click={closeContextMenu}
    on:keydown={(e) => e.key === "Escape" && closeContextMenu()}
    role="presentation"
>
    <div
        class="card-header py-2 d-flex justify-content-between align-items-center bg-dark"
    >
        <h6 class="mb-0 text-light fw-bold">LISTA DE REPRODUCCIÓN</h6>
        <div class="d-flex align-items-center gap-2">
            <span class="small text-muted font-monospace"
                >{formatTotalDuration(totalDurationMs)}</span
            >
            <button
                class="btn btn-sm btn-outline-danger py-0 px-2"
                on:click={() => playoutStore.clearPlaylist()}>Limpiar</button
            >
        </div>
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
                        <div
                            class="index px-2 text-white-50 small font-monospace"
                        >
                            {(i + 1).toString().padStart(2, "0")}
                        </div>
                        <div
                            class="name flex-grow-1 text-truncate py-2 small ps-1 text-light"
                        >
                            {item.name}
                        </div>
                        <div
                            class="duration px-2 small font-monospace text-white-50"
                        >
                            {formatDuration(item.duration || 0)}
                        </div>
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

{#if contextMenu.show}
    <div
        class="context-menu bg-dark shadow-lg rounded py-1 border border-secondary"
        style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
    >
        <button on:click={() => action("play")}>Reproducir</button>
        <button on:click={() => action("next")}>Marcar como Siguiente</button>
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

    /* Colores solicitados y destacados */
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
        min-width: 160px;
    }
    .context-menu button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 8px 15px;
        border: none;
        background: none;
        color: #eee;
        font-size: 0.9rem;
        transition: background 0.2s;
    }
    .context-menu button:hover {
        background-color: #333;
        color: white;
    }
</style>
