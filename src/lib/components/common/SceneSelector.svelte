<script>
    /**
     * @file SceneSelector.svelte
     * @description Selector de escenas de OBS. Permite cambiar la escena de programa (AIR)
     * mediante un menú desplegable.
     */
    import {
        obsState,
        sendCommand as wsSendCommand,
    } from "../../stores/obs.js";

    // Suscripción al estado de escenas y escena actual
    $: scenes = $obsState.scenes;
    $: programScene = $obsState.programScene;

    /**
     * Envía comando para cambiar la escena activa en OBS.
     * @param {string} sceneName Nombre de la escena destino.
     */
    async function switchScene(sceneName) {
        wsSendCommand("switchScene", { sceneName });
    }
</script>

<div class="btn-group d-grid shadow-sm">
    <button
        class="btn btn-secondary dropdown-toggle fw-bold"
        type="button"
        id="programasDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
    >
        <i class="bi bi-layers-fill me-2"></i>
        {programScene || "SELECCIONAR ESCENA"}
    </button>
    <div
        class="dropdown-menu dropdown-menu-dark w-100"
        aria-labelledby="programasDropdown"
    >
        {#each scenes as scene}
            <div class="px-2 py-1">
                <button
                    class="{scene.sceneName === programScene
                        ? 'btn btn-danger'
                        : 'btn btn-outline-info'} btn-sm w-100 text-start"
                    on:click={() => switchScene(scene.sceneName)}
                >
                    {scene.sceneName}
                </button>
            </div>
        {/each}
    </div>
</div>

<style>
    .dropdown-toggle::after {
        margin-left: auto;
    }
</style>
