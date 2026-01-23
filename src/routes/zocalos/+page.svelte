<script>
    import InfoPill from "$lib/components/common/InfoPill.svelte";
    import Zocalos from "$lib/components/zocalos/Zocalos.svelte";

    /** @type {Object} Datos para la píldora de información superior */
    $: infoPillData = { type: "info", text: "" };
</script>

<div class="container">
    <div class="row sticky-top">
        <div class="col-12">
            <InfoPill {infoPillData} />
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <Zocalos bind:infoPillData />
        </div>
    </div>
</div>
