<script>
    import { obsState, sendCommand as wsSendCommand } from "$lib/obs_store";

    $: scenes = $obsState.scenes;
    $: programScene = $obsState.programScene;

    async function switchScene(sceneName) {
        wsSendCommand("switchScene", { sceneName });
    }
</script>

<div class="btn-group d-grid">
    <button
        class="btn btn-secondary dropdown-toggle"
        type="button"
        id="programas"
        data-bs-toggle="dropdown"
        aria-expanded="false"
    >
        {programScene}
    </button>
    <div class="dropdown-menu dropdown-menu-dark" aria-labelledby="programas">
        {#each scenes as scene}
            <div class="dropdown-item btn-group-vertical">
                <button
                    class="{scene.sceneName === programScene
                        ? 'btn btn-danger'
                        : 'btn btn-info'}  btn-sm"
                    on:click={() => switchScene(scene.sceneName)}
                >
                    {scene.sceneName}
                </button>
            </div>
        {/each}
    </div>
</div>
