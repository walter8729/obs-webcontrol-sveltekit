<script>
    import { onMount } from "svelte";
    import Zocalos from "./Zocalos.svelte";
    import Log from "./Log.svelte";
    import Preview from "./Preview.svelte";
    import SceneSelector from "./SceneSelector.svelte";
    import SceneItemSelector from "./SceneItemSelector.svelte";
    import InfoPill from "./InfoPill.svelte";
    import {
        obsState,
        obsConnected,
        sendCommand as wsSendCommand,
    } from "$lib/obs_store";

    // states from store
    $: connected = $obsConnected;

    // variables for zocalos
    $: logged = false;
    $: infoPillData = { type: "info", text: "" };

    onMount(async () => {
        // Request screen wakelock
        if ("wakeLock" in navigator) {
            try {
                await navigator.wakeLock.request("screen");
                document.addEventListener("visibilitychange", async () => {
                    if (document.visibilityState === "visible") {
                        await navigator.wakeLock.request("screen");
                    }
                });
            } catch (e) {}
        }
    });

    // In this new architecture, the backend handles the connection.
    // The "CONECTAR" button could trigger a backend reconnect if needed,
    // but for now the backend auto-reconnects.
    function reconnect() {
        console.log("Requesting backend to check OBS connection...");
        // wsSendCommand("reconnectOBS"); // We can add this if needed
    }
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
                            Estado: Desconectado
                        </div>
                        <div class="card-body">
                            <span class="text-white"
                                >OBS no está disponible o el servidor está
                                conectando...</span
                            >
                            <button
                                class="btn btn-warning mt-2"
                                on:click={reconnect}>REINTENTAR</button
                            >
                        </div>
                    </div>
                {:else}
                    <!-- ****PREVIEW**** -->
                    <div class="card bg-dark mt-1">
                        <div class="card-body">
                            <Preview />
                        </div>
                    </div>

                    <!-- ****CARD SCENAS**** -->
                    <div class="card bg-dark mt-1">
                        <div class="card-body">
                            <SceneSelector />
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
