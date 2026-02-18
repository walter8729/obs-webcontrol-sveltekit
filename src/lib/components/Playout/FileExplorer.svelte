<script>
    /**
     * @file FileExplorer.svelte
     * @description Componente para explorar el sistema de archivos local y agregar medios a la playlist.
     * Permite navegar carpetas, ver archivos compatibles (video, audio, imagen) y arrastrarlos.
     */
    import { onMount } from "svelte";
    import { playoutStore } from "../../stores/playout.js";

    /** @type {string} Directorio actual en visualización */
    let currentDir = "C:\\";

    /** @type {string} Directorio padre para permitir navegación hacia atrás */
    let parentDir = "";

    /** @type {Array<Object>} Lista de archivos y carpetas en el directorio actual */
    let items = [];

    /** @type {boolean} Estado de carga de la petición API */
    let loading = false;

    /** @type {string|null} Mensaje de error en caso de fallo en la lectura */
    let error = null;

    /**
     * Carga el contenido de un directorio desde la API del servidor.
     * @param {string} dir Ruta completa del directorio a cargar.
     */
    async function loadDir(dir) {
        loading = true;
        error = null;
        try {
            const resp = await fetch(
                `/api/playout/ls?dir=${encodeURIComponent(dir)}`,
            );
            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            items = data.items;
            currentDir = data.currentDir;
            parentDir = data.parentDir;

            // Persistir el último directorio visitado en el navegador
            if (typeof window !== "undefined") {
                localStorage.setItem("playout_explorer_dir", currentDir);
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    /**
     * Agrega un archivo compatible a la lista de reproducción global.
     * @param {Object} item Datos del archivo seleccionado.
     */
    function addToPlaylist(item) {
        if (
            !item.isDirectory &&
            (item.isVideo || item.isAudio || item.isImage)
        ) {
            playoutStore.addToFileList(item);
        }
    }

    /**
     * Maneja el inicio del arrastre (drag) de un archivo para soltarlo en la playlist.
     * @param {DragEvent} e
     * @param {Object} item
     */
    function handleDragStart(e, item) {
        if (item.isDirectory) return;
        e.dataTransfer.setData("text/plain", JSON.stringify(item));
        e.dataTransfer.effectAllowed = "copy";
    }

    // Al montar el componente, recuperar el último directorio o empezar en C:
    onMount(() => {
        const savedDir = localStorage.getItem("playout_explorer_dir");
        if (savedDir) {
            currentDir = savedDir;
        }
        loadDir(currentDir);
    });
</script>

<div
    class="file-explorer card bg-dark text-white h-100 border-secondary shadow-lg"
>
    <div
        class="card-header d-flex justify-content-between align-items-center py-2 bg-dark"
    >
        <h6 class="mb-0 text-light fw-bold small uppercase">
            EXPLORADOR DE ARCHIVOS
        </h6>
        <div class="d-flex gap-1">
            <button
                class="btn btn-sm btn-outline-info py-0 px-2"
                on:click={() => loadDir(currentDir)}
                title="Actualizar"
            >
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>
    </div>

    <!-- Visualización de la ruta actual -->
    <div class="path-bar p-2 text-truncate small">
        <span class="text-muted">DIR:</span>
        {currentDir}
    </div>

    <!-- Cuerpo del explorador con scroll -->
    <div
        class="list-group list-group-flush overflow-auto flex-grow-1 explorer-body"
        style="max-height: 100dvh;"
    >
        {#if parentDir && parentDir !== currentDir}
            <button
                class="list-group-item list-group-item-action bg-dark text-info py-1 small border-secondary d-flex align-items-center"
                on:click={() => loadDir(parentDir)}
            >
                <i class="bi bi-folder-symlink me-2"></i> .. (Subir nivel)
            </button>
        {/if}

        {#if loading}
            <div class="p-3 text-center">
                <div
                    class="spinner-border spinner-border-sm text-info"
                    role="status"
                ></div>
            </div>
        {/if}

        {#if error}
            <div class="p-2 text-danger small">Error: {error}</div>
        {/if}

        {#each items as item}
            <div
                class="list-group-item list-group-item-action bg-dark p-0 d-flex align-items-center border-secondary item-row"
                draggable={!item.isDirectory}
                on:dragstart={(e) => handleDragStart(e, item)}
                on:dblclick={() =>
                    item.isDirectory ? loadDir(item.path) : addToPlaylist(item)}
            >
                <button
                    class="btn btn-link text-decoration-none text-start flex-grow-1 py-2 px-2 small d-flex align-items-center {item.isDirectory
                        ? 'text-warning'
                        : item.isVideo || item.isAudio || item.isImage
                          ? 'text-light'
                          : 'text-muted'}"
                    on:click={() =>
                        item.isDirectory ? loadDir(item.path) : null}
                    disabled={!item.isDirectory &&
                        !item.isVideo &&
                        !item.isAudio &&
                        !item.isImage}
                >
                    <span class="me-2">
                        {#if item.isDirectory}
                            <i class="bi bi-folder-fill"></i>
                        {:else if item.isVideo}
                            <i class="bi bi-play-btn-fill"></i>
                        {:else if item.isAudio}
                            <i class="bi bi-music-note-beamed"></i>
                        {:else if item.isImage}
                            <i class="bi bi-image"></i>
                        {:else}
                            <i class="bi bi-file-earmark"></i>
                        {/if}
                    </span>
                    <span class="text-truncate file-name">{item.name}</span>
                </button>

                <!-- Botón rápido para agregar a la playlist (se muestra al hacer hover) -->
                {#if !item.isDirectory && (item.isVideo || item.isAudio || item.isImage)}
                    <button
                        class="btn btn-sm text-success py-0 px-2 me-1 add-btn opacity-0"
                        on:click={() => addToPlaylist(item)}
                        title="Agregar a Playlist"
                    >
                        <i class="bi bi-plus-circle-fill"></i>
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .file-explorer {
        user-select: none;
    }
    .explorer-body::-webkit-scrollbar {
        width: 6px;
    }
    .explorer-body::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 3px;
    }
    .item-row {
        cursor: default;
        transition: background-color 0.2s;
    }
    .item-row:hover {
        background-color: #2a2a2a !important;
    }
    .item-row:hover .add-btn {
        opacity: 0.8 !important;
    }
    .add-btn:hover {
        opacity: 1 !important;
        transform: scale(1.1);
    }
    .path-bar {
        font-family: "Consolas", monospace;
        background-color: #000 !important;
        border-bottom: 1px solid #333;
        font-size: 0.75rem;
    }
    .file-name {
        max-width: 180px;
    }
    .btn-link {
        box-shadow: none;
        border: none;
    }
    .uppercase {
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>
