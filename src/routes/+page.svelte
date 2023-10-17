<script>
    import { onMount } from "svelte";
    import { each, empty, prevent_default } from "svelte/internal";
    import { obs, sendCommand } from "../obs";
    import Zocalos from "./Zocalos.svelte";
    import Log from "./Log.svelte";
    import Preview from "./Preview.svelte";
    import SceneSelector from "./SceneSelector.svelte";
    import SceneItemSelector from "./SceneItemSelector.svelte";
    import InfoPill from "./InfoPill.svelte";
    const obsAddress = "ws://192.168.1.154:4455";
    const password = "000000";

    //stados obs
    $: status = "";
    $: connected = false;
    let isStudioMode = false;
    $: scenes = [];
    $: previewScene = "";
    $: programScene = "";

    //variables para zocalos
    $: logged = false;
    $: f1 = "";
    $: f2 = "";
    $: f3 = "";

    //Info pill variables
    $: infoPillData = { type: "info", text: "" };

    onMount(async () => {
        // Request screen wakelock
        if ("wakeLock" in navigator) {
            try {
                await navigator.wakeLock.request("screen");
                // Re-request when coming back
                document.addEventListener("visibilitychange", async () => {
                    if (document.visibilityState === "visible") {
                        await navigator.wakeLock.request("screen");
                    }
                });
            } catch (e) {}
        }

        try {
            await connect();
        } catch (error) {}

        // Export the sendCommand() function to the window object
        window.sendCommand = sendCommand;
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

    async function switchOffStudioMode() {
        try {
            await sendCommand("SetStudioModeEnabled", {
                studioModeEnabled: false,
            });
            // isStudioMode = false;
        } catch (e) {
            console.log(e);
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

    obs.on("Identified", async () => {
        console.log("Connected");
        connected = true;
        // isStudioMode =
        //     (await sendCommand("GetStudioModeEnabled")).studioModeEnabled ||
        //     false;
        // console.log("Studio Mode is " + isStudioMode);
    });
</script>

{#if logged}
    <Log bind:logged />
{:else}
    <div class="container-fluid pt-1 justify-content-start">
        <div class="row sticky-top">
            <div class="col-md-12">
                <InfoPill {infoPillData} />
            </div>
        </div>
        <div class="row">
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
                {:else if isStudioMode}
                    <div class="card bg-dark mt-1">
                        <div class="card-header text-white">
                            Info {connected ? "conectado" : "desconectado"}
                        </div>
                        <div class="card-body">
                            <span class="text-white"
                                >DEBES APAGAR EL MODO ESTUDIO</span
                            >
                            <button on:click={switchOffStudioMode}
                                >APAGAR</button
                            >
                        </div>
                    </div>
                    >
                {/if}

                {#if connected && !isStudioMode}
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
                                bind:isStudioMode
                            />
                        </div>
                    </div>

                    <!-- ****BOTONES DE ITEMS**** -->
                    <SceneItemSelector />
                {/if}
            </div>
            <div class="col-md-8 aling-content-start">
                <Zocalos bind:infoPillData />
            </div>
        </div>
    </div>
{/if}
