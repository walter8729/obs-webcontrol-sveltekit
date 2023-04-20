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
    });
</script>

<!-- ****PREVIEW**** -->

        <div class="accordion" id="accordionExample">
            <div class="accordion-item bg-dark">
                <div class="accordion-header d-grid" id="headingOne">
                    <button
                        class="btn btn-secondary text-white dropdown-toggle"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseOne"
                        aria-expanded="true"
                        aria-controls="collapseOne"
                    >
                        PREVIEW
                    </button>
                </div>
                <div
                    id="collapseOne"
                    class="bg-dark accordion-collapse collapse show"
                    aria-labelledby="headingOne"
                    data-bs-parent="#accordionExample"
                >
                    <div class="accordion-body p-0 m-0">
                        <img
                            class="img-fluid bg-dark"
                            bind:this={program}
                            alt="Program"
                            style="height: 100%; width: 100%; object-fit: contain"
                        />
                    </div>
                </div>
            </div>

</div>
