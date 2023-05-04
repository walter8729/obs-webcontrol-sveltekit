<script>
    export let infoPillData;
    import { slide, fade, fly, blur } from "svelte/transition";
</script>
<span class="infopildoras badge rounded-pill bg-success" transition:slide>i</span>
<span class="infopildoras badge rounded-pill bg-{infoPillData.type}" transition:slide>{infoPillData.text}</span>
