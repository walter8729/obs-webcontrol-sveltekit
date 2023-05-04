<script>
    import InfoPill from "../InfoPill.svelte";
    import Zocalos from "../Zocalos.svelte";
    //Info pill variables
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
            <Zocalos bind:infoPillData/>
        </div>
    </div>
</div>
