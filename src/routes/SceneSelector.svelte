<script>
    import { obs, sendCommand } from "../obs";
    import { onMount } from "svelte";
    import {switchOffAllSceneItem} from "./SceneItemSelector.svelte"
    export let scenes;
    export let programScene;
    export let previewScene;

    async function getSceneList() {
        try {
            //obtenemos la lista de scenas
            let data = await sendCommand("GetSceneList");
            //console.log('GetSceneList', data);
            programScene = data.currentProgramSceneName || "";
            previewScene = data.currentPreviewSceneName;
            //lo guardamos invertido
            scenes = data.scenes.slice().reverse();
            scenes = [...scenes];
            console.log(scenes);
        } catch (e) {
            console.log(e);
        }
    }

    async function switchScene(sceneName) {
        try {
            await switchOffAllSceneItem(programScene);
            // await switchOffAllSceneItem(sceneName);
            await sendCommand("SetCurrentProgramScene", { sceneName });
        } catch (error) {
            console.log(error);
        }
    }

    obs.on("StudioModeStateChanged", async (data) => {
        console.log("StudioModeStateChanged", data.studioModeEnabled);
        isStudioMode = data.studioModeEnabled;
        if (isStudioMode) {
            previewScene = programScene;
        }
    });

    obs.on("SceneListChanged", async (data) => {
        console.log("SceneListChanged", data.scenes.length);
        await getSceneList();

    });

    obs.on("SceneCreated", async (data) => {
        console.log("SceneCreated", data);
        await getSceneList();

    });

    obs.on("SceneRemoved", async (data) => {
        console.log("SceneRemoved", data);
        await getSceneList();

    });

    obs.on("SceneNameChanged", async (data) => {
        console.log("SceneNameChanged", data);
        await getSceneList();

    });

    obs.on("CurrentProgramSceneChanged", async (data) => {
        console.log("CurrentProgramSceneChanged", data);
        await getSceneList();

    });

    obs.on("CurrentPreviewSceneChanged", async (data) => {
        console.log("CurrentPreviewSceneChanged", data);
        await getSceneList();

    });

    onMount(async function () {
       await getSceneList();
    });

</script>

<!-- ****DROPDOWN DE SCENAS**** -->
<div class="dropdown d-grid gap-2">
    <button
        class="btn btn-outline-info dropdown-toggle"
        type="button"
        id="dropdownMenuButton2"
        data-bs-toggle="dropdown"
        aria-expanded="true"
    >
        SELECCIONA EL PROGRAMA
    </button>
    <ul
        class="dropdown-menu dropdown-menu-dark"
        aria-labelledby="dropdownMenuButton2"
    >
        {#each scenes as scene}
            <button
                class="{scene.sceneName === programScene
                    ? 'btn btn-danger'
                    : ' btn btn-info'} btn-sm"
                on:click={switchScene(scene.sceneName)}
            >
                {scene.sceneName}
            </button>
        {/each}

        <li><hr class="dropdown-divider" /></li>
    </ul>
</div>


