<script>
    /**
     * @file InfoPill.svelte
     * @description Pequeña píldora de información para mostrar estados o mensajes rápidos
     * con transiciones visuales.
     */

    /**
     * @type {Object} Datos de la píldora.
     * @property {string} type Tipo de alerta (success, danger, info, etc. de bootstrap).
     * @property {string} text Mensaje a mostrar.
     */
    export let infoPillData;

    import { slide } from "svelte/transition";
</script>

<span class="infopildoras badge rounded-pill bg-success" transition:slide
    >i</span
>
<span
    class="infopildoras badge rounded-pill bg-{infoPillData.type}"
    transition:slide
>
    {infoPillData.text}
</span>

<style>
    .infopildoras {
        font-size: 0.8rem;
        margin-right: 5px;
    }
</style>
