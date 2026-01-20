<script>
    import { onMount } from "svelte";
    import InfoPill from "./InfoPill.svelte";
    import { obsState, sendCommand as wsSendCommand } from "$lib/obs_store";

    // states from store (everything synced via websocket)
    $: allZocalos = $obsState.zocalos || [];
    $: allZocalosDinamicos = $obsState.zocalosDinamicos || [];
    $: programs = $obsState.programs || [];
    $: activeProgramId = $obsState.activeProgramId;
    $: activeProgramName =
        programs.find((p) => p.id === activeProgramId)?.name || "DESCONOCIDO";

    // local state for simultaneous editing
    let editingProgramId = null;

    // Initialize editingProgramId if not set, prefer active or first available
    $: if (editingProgramId === null && programs.length > 0) {
        // If active program exists, default to it, otherwise first one
        if (activeProgramId) {
            editingProgramId = activeProgramId;
        } else {
            editingProgramId = programs[0].id;
        }
    }

    // Filtered data for the CURRENT VIEW
    $: currentZocalos = allZocalos.filter(
        (z) => z.program_id === editingProgramId,
    );
    $: currentF3Data = allZocalosDinamicos.find(
        (z) => z.program_id === editingProgramId,
    ) || { f3: "" };
    $: currentF3 = currentF3Data.f3;

    let f1 = "";
    let f2 = "";

    // Info pill variables
    export let infoPillData = { type: "info", text: "" };
    let infoPillDataTimeOut;

    // limit texto zocalos form variables
    let f1Lenght = 60;
    let f2Lenght = 70;
    let f3Lenght = 65;

    // numero de id del zocalo siendo editado
    $: onEdit = 0;
    $: zocaloDinamicoOnEdit = false;

    function resetAddForm() {
        f1 = "";
        f2 = "";
    }

    function showInfo(data) {
        if (infoPillData.text !== "") {
            resetShowInfo();
        }
        infoPillData = data;
        infoPillDataTimeOut = setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 5000);
    }

    function resetShowInfo() {
        infoPillData = { type: "info", text: "" };
        clearTimeout(infoPillDataTimeOut);
    }

    async function addZocalo(f1Text, f2Text) {
        if (!f1Text || !f2Text) return;
        wsSendCommand("addZocalo", {
            f1: f1Text.toUpperCase(),
            f2: f2Text.toUpperCase(),
            onAir: false,
            program_id: editingProgramId,
        });
        resetAddForm();
        showInfo({
            type: "info",
            text: `AGREGASTE UN NUEVO ZOCALO: ${f1Text.toUpperCase()}`,
        });
    }

    async function deleteZocalo(zocalo) {
        if (zocalo.onAir && editingProgramId === activeProgramId) {
            alert(
                "No se puede eliminar un zocalo cuando esta al aire en el programa activo",
            );
            return;
        }
        wsSendCommand("deleteZocalo", { id: zocalo.id });
        showInfo({
            type: "danger",
            text: `ELIMINASTE EL ZOCALO: ${zocalo.f1}`,
        });
    }

    async function updateZocalo(zocalo) {
        const newF1 = document
            .getElementById("f1text" + zocalo.id)
            .value.toUpperCase();
        const newF2 = document
            .getElementById("f2text" + zocalo.id)
            .value.toUpperCase();
        wsSendCommand("updateZocalo", {
            id: zocalo.id,
            f1: newF1,
            f2: newF2,
            onAir: zocalo.onAir,
        });
        onEdit = 0;
        showInfo({ type: "primary", text: `ACTUALIZASTE EL ZOCALO: ${newF1}` });
    }

    async function setOnAirZocalo(zocalo) {
        // Backend handles auto-switching active program if needed
        wsSendCommand("setOnAirZocalo", {
            id: zocalo.id,
            program_id: editingProgramId,
        });
        showInfo({
            type: "success",
            text: `ZOCALO SELECCIONADO: ${zocalo.f1}`,
        });
    }

    async function writeZocaloDinamicoToFile() {
        const f3Text = document.getElementById("f3text").value.toUpperCase();
        wsSendCommand("writeZocaloDinamicoToFile", {
            program_id: editingProgramId,
            f3: f3Text,
        });
        zocaloDinamicoOnEdit = false;
        showInfo({
            type: "secondary",
            text: "ACTUALIZASTE EL ZOCALO AUXILIAR",
        });
    }
</script>

<div class="container-fluid">
    <div class="row">
        <!-- Zocalos Area: Using full width now -->
        <div class="col-md-12">
            <div class="card bg-secondary mt-1">
                <div
                    class="card-header text-white p-2 d-flex justify-content-between align-items-center gap-3"
                >
                    <!-- Program Selector -->
                    <div class="d-flex align-items-center flex-grow-1">
                        <label for="programSelect" class="me-2 text-nowrap"
                            >EDITANDO:</label
                        >
                        <select
                            id="programSelect"
                            class="form-select form-select-sm bg-dark text-white border-secondary fw-bold"
                            bind:value={editingProgramId}
                        >
                            {#each programs as prog}
                                <option value={prog.id}>{prog.name}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Status Badge -->
                    <div class="text-end">
                        {#if editingProgramId === activeProgramId}
                            <span
                                class="badge bg-danger blink fs-6 border border-light"
                            >
                                ESTA AL AIRE: {activeProgramName}
                            </span>
                        {:else}
                            <span
                                class="badge bg-dark text-secondary border border-secondary"
                            >
                                ESTA AL AIRE: {activeProgramName}
                            </span>
                        {/if}
                    </div>
                </div>

                <div class="card-body p-2 bg-dark">
                    <!-- ****ZOCALO DINAMICO**** -->
                    <div class="card bg-secondary mb-2">
                        <div class="card-body p-2">
                            <form class="row gy-1 gx-1 align-items-center">
                                <div class="col-auto">
                                    <span class="badge badge-light">AUX</span>
                                </div>
                                <div class="col">
                                    <input
                                        id="f3text"
                                        class="form-control form-control-sm"
                                        type="text"
                                        placeholder="Título Auxiliar"
                                        value={currentF3}
                                        on:input={() =>
                                            (zocaloDinamicoOnEdit = true)}
                                        maxlength={f3Lenght}
                                    />
                                </div>
                                <div class="col-auto">
                                    <button
                                        class="btn btn-info btn-sm"
                                        disabled={!zocaloDinamicoOnEdit}
                                        on:click|preventDefault={writeZocaloDinamicoToFile}
                                    >
                                        ACTUALIZAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- ****AGREGAR NUEVO ZOCALO**** -->
                    <div class="card bg-dark border-secondary mb-2">
                        <div class="card-body p-2">
                            <form class="row gy-1 gx-1 align-items-center">
                                <div class="col-auto">
                                    <span class="badge badge-light"
                                        >{currentZocalos.length + 1}</span
                                    >
                                </div>
                                <div class="col-5">
                                    <input
                                        class="form-control form-control-sm"
                                        type="text"
                                        placeholder="Título"
                                        bind:value={f1}
                                        maxlength={f1Lenght}
                                    />
                                </div>
                                <div class="col-5">
                                    <input
                                        class="form-control form-control-sm"
                                        placeholder="Detalles"
                                        type="text"
                                        bind:value={f2}
                                        maxlength={f2Lenght}
                                    />
                                </div>
                                <div class="col-auto">
                                    <button
                                        class="btn btn-info btn-sm"
                                        on:click|preventDefault={() =>
                                            addZocalo(f1, f2)}>AGREGAR</button
                                    >
                                </div>
                            </form>
                        </div>
                    </div>

                    <div
                        class="zocalos-list p-1"
                        style="max-height: 60vh; overflow-y: auto;"
                    >
                        {#each currentZocalos as zocalo, i}
                            <form
                                class="row gy-1 gx-1 align-items-center mb-1"
                                id="form{zocalo.id}"
                                on:submit|preventDefault={() =>
                                    updateZocalo(zocalo)}
                            >
                                <div class="col-auto">
                                    <span
                                        class="badge {zocalo.onAir
                                            ? 'btn-danger'
                                            : 'btn-outline-light'} "
                                        >{i + 1 < 10 ? "0" : ""}{i + 1}</span
                                    >
                                </div>
                                <div class="col-5">
                                    <input
                                        class="form-control form-control-sm {zocalo.onAir
                                            ? 'on-air-input'
                                            : ''}"
                                        id="f1text{zocalo.id}"
                                        on:input={() => (onEdit = zocalo.id)}
                                        type="text"
                                        value={zocalo.f1}
                                    />
                                </div>
                                <div class="col-5">
                                    <input
                                        class="form-control form-control-sm {zocalo.onAir
                                            ? 'on-air-input'
                                            : ''}"
                                        id="f2text{zocalo.id}"
                                        on:input={() => (onEdit = zocalo.id)}
                                        type="text"
                                        value={zocalo.f2}
                                    />
                                </div>
                                <div
                                    class="btn-group col-auto p-0"
                                    role="group"
                                >
                                    <button
                                        type="button"
                                        class="btn btn-outline-danger btn-sm border-0"
                                        disabled={zocalo.onAir &&
                                            editingProgramId ===
                                                activeProgramId}
                                        hidden={zocalo.id === onEdit}
                                        on:click|preventDefault={() =>
                                            deleteZocalo(zocalo)}>🗑</button
                                    >
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-sm"
                                        hidden={zocalo.id !== onEdit}>✓</button
                                    >
                                    <button
                                        type="button"
                                        on:click|preventDefault={() =>
                                            setOnAirZocalo(zocalo)}
                                        class="btn btn-sm {zocalo.onAir
                                            ? 'btn-danger'
                                            : 'btn-success'}"
                                        disabled={zocalo.onAir}
                                    >
                                        {zocalo.onAir ? "AIRE" : "USAR"}
                                    </button>
                                </div>
                            </form>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .on-air-input {
        background-color: #fff0f0;
        border-color: #ff0000;
        font-weight: bold;
    }
    .blink {
        animation: blink-animation 1s steps(5, start) infinite;
    }
    @keyframes blink-animation {
        to {
            visibility: hidden;
        }
    }
    .zocalos-list::-webkit-scrollbar {
        width: 5px;
    }
    .zocalos-list::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 10px;
    }
</style>
