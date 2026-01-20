<script>
    import { obsState, sendCommand as wsSendCommand } from "$lib/obs_store";

    $: programScene = $obsState.programScene;
    $: programSceneItemList = $obsState.programSceneItemList;

    async function switchOffAllSceneItem(sceneName) {
        programSceneItemList.forEach((item) => {
            if (item.sceneItemEnabled) {
                switchSceneItem(sceneName, item.sceneItemId, true);
            }
        });
    }

    async function switchSceneItem(sceneName, sceneItemId, enable) {
        wsSendCommand("toggleSceneItem", {
            sceneName,
            sceneItemId,
            enable,
        });
    }
</script>

<div class="card bg-dark mt-1">
    <div class="card-body d-grid gap-2 align-items-center">
        <div class="btn-group-vertical">
            <button
                class="btn btn-bg btn-warning mb-2"
                on:click={() => switchOffAllSceneItem(programScene)}
                >APAGAR TODOS LOS GRAFICOS</button
            >

            {#each programSceneItemList as item}
                <button
                    class="{item.sceneItemEnabled
                        ? 'btn btn-success btn-outline-light'
                        : 'btn btn-outline-light'} btn-bg"
                    on:click={() =>
                        switchSceneItem(
                            programScene,
                            item.sceneItemId,
                            item.sceneItemEnabled,
                        )}
                >
                    {item.sourceName}
                </button>
            {/each}
        </div>
    </div>
</div>
