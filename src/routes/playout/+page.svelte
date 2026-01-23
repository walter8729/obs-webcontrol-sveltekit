<script>
    import { onMount } from "svelte";
    import FileExplorer from "$lib/components/Playout/FileExplorer.svelte";
    import Playlist from "$lib/components/Playout/Playlist.svelte";
    import Controls from "$lib/components/Playout/Controls.svelte";
    import Preview from "../Preview.svelte";
    import { initWebSocket } from "$lib/obs_store";

    onMount(() => {
        initWebSocket();
    });
</script>

<svelte:head>
    <title>OBS Playout - Control Panel</title>
</svelte:head>

<div class="container-fluid playout-page py-3 bg-black min-vh-100">
    <div class="row g-3">
        <!-- Explorer Sidebar -->
        <div class="col-md-3">
            <FileExplorer />
        </div>

        <!-- Playlist Main Area -->
        <div class="col-md-5">
            <Playlist />
        </div>

        <!-- Controls and Preview Area -->
        <div class="col-md-4">
            <div class="sticky-top" style="top: 1rem;">
                <div class="mb-3">
                    <Preview />
                </div>
                <Controls />

                <!-- Quick Info / Help -->
                <div
                    class="card bg-dark text-muted mt-3 small border-secondary"
                >
                    <div class="card-body py-2">
                        <ul class="mb-0 ps-3">
                            <li>Doble clic para cargar y reproducir.</li>
                            <li>
                                Botón derecho en la lista para más opciones.
                            </li>
                            <li>Arrastra para reordenar la lista.</li>
                            <li>
                                Asegúrate de tener la fuente <strong
                                    >"playout"</strong
                                > en OBS.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .playout-page {
        background-color: #0c0c0c !important;
    }
    :global(body) {
        background-color: #0c0c0c !important;
    }
</style>
