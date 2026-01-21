<script>
    import { onMount } from "svelte";
    import { playoutStore } from "$lib/playoutStore";

    let currentDir = "C:\\";
    let parentDir = "";
    let items = [];
    let loading = false;
    let error = null;

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
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function addToPlaylist(item) {
        if (!item.isDirectory && item.isVideo) {
            playoutStore.addToFileList(item);
        }
    }

    onMount(() => {
        loadDir(currentDir);
    });
</script>

<div class="file-explorer card bg-dark text-white h-100">
    <div
        class="card-header d-flex justify-content-between align-items-center py-2"
    >
        <h6 class="mb-0">EXPLORADOR</h6>
        <button
            class="btn btn-sm btn-outline-light"
            on:click={() => loadDir(currentDir)}
            title="Actualizar"
        >
            🔄
        </button>
    </div>

    <div class="path-bar p-2 bg-secondary text-truncate small">
        {currentDir}
    </div>

    <div
        class="list-group list-group-flush overflow-auto flex-grow-1"
        style="max-height: 400px;"
    >
        {#if parentDir && parentDir !== currentDir}
            <button
                class="list-group-item list-group-item-action bg-dark text-info py-1 small"
                on:click={() => loadDir(parentDir)}
            >
                📁 .. (Subir)
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
                class="list-group-item list-group-item-action bg-dark text-white p-0 d-flex align-items-center"
            >
                <button
                    class="btn btn-link text-decoration-none text-start flex-grow-1 py-1 px-2 small {item.isDirectory
                        ? 'text-warning'
                        : item.isVideo
                          ? 'text-light'
                          : 'text-muted'}"
                    on:click={() =>
                        item.isDirectory ? loadDir(item.path) : null}
                    disabled={!item.isDirectory && !item.isVideo}
                >
                    {item.isDirectory ? "📁" : "📄"}
                    {item.name}
                </button>

                {#if item.isVideo}
                    <button
                        class="btn btn-sm btn-success py-0 px-2 me-1"
                        on:click={() => addToPlaylist(item)}
                        title="Agregar a Playlist"
                    >
                        +
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .file-explorer {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    .list-group-item:hover {
        background-color: #3d3d3d !important;
    }
    .path-bar {
        font-family: monospace;
        background-color: #1a1a1a !important;
    }
</style>
