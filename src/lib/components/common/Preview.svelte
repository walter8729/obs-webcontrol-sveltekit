<script>
    /**
     * @file Preview.svelte
     * @description Componente que muestra la captura de pantalla en tiempo real de la salida de OBS.
     * Utiliza un acordeón de Bootstrap para permitir colapsar la vista previa.
     */
    import { obsScreenshot } from "../../stores/obs.js";
</script>

<div class="accordion" id="accordionPreview">
    <div class="accordion-item bg-dark border-secondary">
        <div class="accordion-header d-grid" id="headingPreview">
            <button
                class="btn btn-secondary text-white dropdown-toggle fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapsePreview"
                aria-expanded="true"
                aria-controls="collapsePreview"
            >
                VISTA PREVIA DE PROGRAMA (AIR)
            </button>
        </div>
        <div
            id="collapsePreview"
            class="bg-dark accordion-collapse collapse show"
            aria-labelledby="headingPreview"
            data-bs-parent="#accordionPreview"
        >
            <div class="accordion-body p-0 m-0 bg-black text-center">
                {#if $obsScreenshot}
                    <img
                        class="img-fluid"
                        src={$obsScreenshot}
                        alt="OBS Program Output"
                        style="max-height: 400px; width: 100%; object-fit: contain"
                    />
                {:else}
                    <div class="p-5 text-muted italic">
                        Esperando señal de OBS...
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .accordion-button::after {
        filter: invert(1);
    }
</style>
