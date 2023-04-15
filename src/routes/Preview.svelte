<script>
    import { obs, sendCommand } from "../obs.js";
    import { onMount } from "svelte";
    export let programScene;
    let program = {};
    

    async function getScreenShot() {
        setInterval(async () => {
            if (!programScene) return;
            // console.log("Solicitando ScreenShoot de: ", programScene);
            let data = await sendCommand("GetSourceScreenshot", {
                sourceName: programScene,
                imageCompressionQuality: -1,
                imageFormat: "jpg",
                imageWidth: 854,
                imageHeight: 480,
            });
            if (data && data.imageData && program) {
                // console.log("Mostrando ScreenShoot en Preview");
                program.src = data.imageData;
                program.className = "preview";
            }
        }, 1000);
    }

    onMount(async () => {
        await getScreenShot();
    } );

    
</script>

<!-- ****PREVIEW**** -->
<div class="card bg-dark mt-1">
    <div class="card-header text-white">Preview</div>
    <div class="card-body">
            <img
            class="img-fluid bg-dark"
            bind:this={program}
            alt="Program"
            style="height: 100%; width: 100%; object-fit: contain"
        />
    </div>
</div>
