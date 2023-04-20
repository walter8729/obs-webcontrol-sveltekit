<script>
    import { onMount } from "svelte";
    import { each, empty, prevent_default } from "svelte/internal";
    import { obs, sendCommand } from "../obs";
    import Zocalos from "./Zocalos.svelte";
    import Login from "./Login.svelte";
    import Preview from "./Preview.svelte";
    import SceneSelector from "./SceneSelector.svelte";
    import SceneItemSelector from "./SceneItemSelector.svelte";
    const obsAddress = "ws://192.168.1.154:4455";
    const password = "000000";

    $: status = "";
    $: connected = false;
    $: scenes = [];
    $: previewScene = "";
    $: programScene = "";

    //variables para zocalos
    $: logged = false;
    $: f1 = "";
    $: f2 = "";
    $: f3 = "";

    onMount(async () => {
        try {
            await connect();
        } catch (error) {}
    });

    async function connect() {
        status = "Connecting";
        console.log(
            "Connecting to:",
            obsAddress,
            "- using password:",
            password
        );
        //get object with vercion and rpcVersion
        try {
            const { obsWebSocketVersion, negotiatedRpcVersion } =
                await obs.connect(obsAddress, password);
            console.log(
                `Connected to obs-websocket version ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
            );
            //actualizamos coneccion
            connected = true;
            status = "Connected";
            //if error
        } catch (e) {
            console.log(e);
            status = e;
        }
    }

    async function disconnect() {
        await obs.disconnect();
        connected = false;
    }

    // OBS events
    obs.on("ConnectionClosed", () => {
        connected = false;
        console.log("Connection closed");
    });

    //////////////funciones de zocalo
</script>

{#if logged}
    <Login bind:logged />
{:else}
    <div class="container-fluid pt-2">
        <div class="row justify-content-start">
            <div class="col-md-4 m-0">
                {#if !connected}
                    <div class="card bg-dark mt-1">
                        <div class="card-header text-white">
                            Info: {connected ? "conectado" : "desconetado"}
                        </div>
                        <div class="card-body">
                            <span class="text-white">Obs No esta Abierto</span>
                            <button on:click={connect}> CONECTAR</button>
                        </div>
                    </div>
                {:else if previewScene}
                    <div class="card bg-dark mt-1">
                        <div class="card-header text-white">
                            Info {connected ? "conectado" : "desconectado"}
                        </div>
                        <div class="card-body">
                            <span class="text-white"
                                >DEBES APAGAR EL MODO ESTUDIO</span
                            >
                            <button>APAGAR</button>
                        </div>
                    </div>
                    >
                {/if}

                {#if connected && !previewScene}
                    <!-- ****PREVIEW**** -->
                    <div class="card bg-dark mt-1">
                        <div class="card-body">
                            <Preview {programScene} />
                        </div>
                    </div>

                    <!-- ****CARD SCENAS**** -->
                    <div class="card bg-dark mt-1">
                        <div class="card-body">
                            <!-- ****DROPDOWN DE SCENAS**** -->
                            <SceneSelector
                                bind:scenes
                                bind:programScene
                                bind:previewScene
                            />
                        </div>
                    </div>

                    <!-- ****BOTONES DE ITEMS**** -->
                    <SceneItemSelector />
                {/if}
            </div>

            <div class="col-md-8">
                <Zocalos />
            </div>
        </div>
    </div>
{/if}
