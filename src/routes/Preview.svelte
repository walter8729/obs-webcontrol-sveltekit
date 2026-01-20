<script>
    import { obsScreenshot } from "$lib/obs_store";
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
                    src={$obsScreenshot}
                    alt="Program"
                    style="height: 100%; width: 100%; object-fit: contain"
                />
            </div>
        </div>
    </div>
</div>
