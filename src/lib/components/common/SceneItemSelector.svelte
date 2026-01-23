<script>
    /**
     * @file SceneItemSelector.svelte
     * @description Controlador de fuentes (items) dentro de la escena activa.
     * Permite encender/apagar fuentes individuales y ofrece un botón de pánico
     * para apagar todos los elementos visuales de la escena actual.
     */
    import {
        obsState,
        sendCommand as wsSendCommand,
    } from "../../stores/obs.js";

    // Datos reactivos de la escena de programa y sus fuentes
    $: programScene = $obsState.programScene;
    $: programSceneItemList = $obsState.programSceneItemList;

    /**
     * Apaga todas las fuentes que estén habilitadas actualmente en la escena.
     * @param {string} sceneName Nombre de la escena actual.
     */
    async function switchOffAllSceneItem(sceneName) {
        programSceneItemList.forEach((item) => {
            if (item.sceneItemEnabled) {
                switchSceneItem(sceneName, item.sceneItemId, true);
            }
        });
    }

    /**
     * Alterna la visibilidad de una fuente específica.
     * @param {string} sceneName Escena que contiene la fuente.
     * @param {number} sceneItemId ID del item en OBS.
     * @param {boolean} enable Estado actual (se invertirá en el comando).
     */
    async function switchSceneItem(sceneName, sceneItemId, enable) {
        wsSendCommand("toggleSceneItem", {
            sceneName,
            sceneItemId,
            enable,
        });
    }
</script>

<div class="card bg-dark mt-1 border-secondary shadow-sm">
    <div class="card-body d-grid gap-2 align-items-center">
        <div class="btn-group-vertical gap-1">
            <!-- Botón de pánico (apagar todo) -->
            <button
                class="btn btn-warning mb-2 fw-bold"
                on:click={() => switchOffAllSceneItem(programScene)}
            >
                <i class="bi bi-eye-slash-fill me-2"></i> APAGAR TODOS LOS GRÁFICOS
            </button>

            <!-- Lista de fuentes de la escena actual -->
            {#each programSceneItemList as item}
                <button
                    class="{item.sceneItemEnabled
                        ? 'btn btn-success border-light shadow'
                        : 'btn btn-outline-light'} py-2"
                    on:click={() =>
                        switchSceneItem(
                            programScene,
                            item.sceneItemId,
                            item.sceneItemEnabled,
                        )}
                >
                    <i
                        class="bi {item.sceneItemEnabled
                            ? 'bi-check-circle-fill'
                            : 'bi-circle'} me-2"
                    ></i>
                    {item.sourceName}
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    .btn {
        text-align: left;
        transition: all 0.2s ease;
    }
</style>
