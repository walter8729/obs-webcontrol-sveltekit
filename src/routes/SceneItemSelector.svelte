<script context="module">
    export async function switchOffAllSceneItem(sceneName) {
        console.log("todo off");

        let data = await sendCommand("GetSceneItemList", { sceneName });
        let sceneItems = data.sceneItems;
        // console.log(items);

        Object.entries(sceneItems).forEach(async ([index, item]) => {
            console.log(index);
            console.log(item);

            await sendCommand(`SetSceneItemEnabled`, {
                sceneName,
                sceneItemId: item.sceneItemId,
                sceneItemEnabled: false,
            });
        });
    }
</script>

<script>
    import { obs, sendCommand } from "../obs";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";

    export let programScene;

    $: programSceneItemList = [];

    async function getSceneItemList() {
        try {
            let data = await sendCommand("GetSceneList");
            //console.log('GetSceneList', data);
            programScene = data.currentProgramSceneName || "";

            //obtener lista de item de la escena actual
            data = await sendCommand("GetSceneItemList", {
                sceneName: programScene,
            });
            //guardamos la lista invertida
            programSceneItemList = data.sceneItems.slice().reverse();

            console.log(
                "estos son los items del program actual ",
                programSceneItemList
            );
        } catch (e) {
            console.log(e);
        }
    }

    async function switchSceneItem(sceneName, sceneItemId, enable) {
        //si esta apagado lo encendemos y viceversa
        try {
            await sendCommand(`SetSceneItemEnabled`, {
                sceneName,
                sceneItemId,
                sceneItemEnabled: !enable,
            });
        } catch (error) {
            console.log(error);
        }
    }

    obs.on("SceneListChanged", async (data) => {
        console.log("SceneListChanged", data);
        await getSceneItemList();
    });

    obs.on("SceneItemEnableStateChanged", async (data) => {
        console.log("SceneItemEnableStateChanged", data);
        await getSceneItemList();
    });

    obs.on("SceneItemListReindexed", async (data) => {
        console.log("SceneItemListReindexed", data);
        await getSceneItemList();
    });

    obs.on("SceneItemCreated", async (data) => {
        console.log("SceneItemCreated", data);
        await getSceneItemList();
    });

    obs.on("SceneItemRemoved", async (data) => {
        console.log("SceneItemRemoved", data);
        await getSceneItemList();
    });

    obs.on("StudioModeStateChanged", async (data) => {
        console.log("StudioModeStateChanged", data);
        await getSceneItemList();
    });

    obs.on("SceneCreated", async (data) => {
        console.log("SceneCreated", data);
        await getSceneItemList();
    });

    obs.on("SceneRemoved", async (data) => {
        console.log("SceneRemoved", data);
        await getSceneItemList();
    });

    obs.on("SceneNameChanged", async (data) => {
        console.log("SceneNameChanged", data);
        await getSceneItemList();
    });

    obs.on("CurrentProgramSceneChanged", async (data) => {
        console.log("CurrentProgramSceneChanged", data);
        await getSceneItemList();
    });

    obs.on("CurrentPreviewSceneChanged", async (data) => {
        console.log("CurrentPreviewSceneChanged", data);
        await getSceneItemList();
    });

    onMount(async function () {
        await getSceneItemList();
    });
</script>

<div class="card bg-dark mt-1">
    <!-- <div class="card-header text-white d-flex justify-content-center">
        ITEMS GRAFICOS DEL LA SELECCION
    </div> -->
    <div class="card-body d-grid gap-2 align-items-center">
        <div class="btn-group-vertical">
            <button
                class="btn btn-bg btn-warning mb-2"
                on:click={switchOffAllSceneItem(programScene)}
                >APAGAR TODOS LOS GRAFICOS</button
            >

            {#each programSceneItemList as item}
                <button
                    class="{item.sceneItemEnabled
                        ? 'btn btn-success btn-outline-light'
                        : 'btn btn-outline-light'} btn-bg"
                    on:click={switchSceneItem(
                        programScene,
                        item.sceneItemId,
                        item.sceneItemEnabled
                    )}
                >
                    {item.sourceName}
                </button>
            {/each}
        </div>
    </div>
</div>
