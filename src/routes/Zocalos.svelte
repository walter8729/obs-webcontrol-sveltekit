<script>
    import { onMount } from "svelte";
    import InfoPill from "./InfoPill.svelte";
    import { obsState, sendCommand as wsSendCommand } from "$lib/obs_store";

    // states from store (everything synced via websocket)
    $: allZocalos = $obsState.zocalos || [];
    $: allZocalosDinamicos = $obsState.zocalosDinamicos || [];
    $: programs = $obsState.programs || [];
    $: activeProgramId = $obsState.activeProgramId;

    // local state for simultaneous editing
    let editingProgramId = null;
    let newProgramName = "";

    // Initialize editingProgramId if not set
    $: if (editingProgramId === null && activeProgramId) {
        editingProgramId = activeProgramId;
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
        wsSendCommand("setOnAirZocalo", {
            id: zocalo.id,
            program_id: editingProgramId,
        });
        showInfo({
            type: "success",
            text: `ZOCALO SELECCIONADO EN ESTE PROGRAMA: ${zocalo.f1}`,
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

    function createProgram() {
        if (!newProgramName) return;
        wsSendCommand("addProgram", { name: newProgramName.toUpperCase() });
        newProgramName = "";
    }

    function removeProgram(id, name) {
        if (confirm(`¿Eliminar programa "${name}" y todos sus zocalos?`)) {
            wsSendCommand("deleteProgram", { id });
            if (editingProgramId === id) editingProgramId = programs[0].id;
        }
    }

    function setLive(id) {
        wsSendCommand("setActiveProgram", { id });
        showInfo({ type: "warning", text: "PROGRAMA EN VIVO CAMBIADO" });
    }
</script>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar Programas -->
        <div class="col-md-3">
            <div class="card bg-dark text-white mt-1">
                <div
                    class="card-header p-2 d-flex justify-content-between align-items-center"
                >
                    <h6 class="m-0">GESTIÓN DE PROGRAMAS</h6>
                </div>
                <div class="card-body p-2">
                    <div class="input-group input-group-sm mb-3">
                        <input
                            type="text"
                            class="form-control bg-secondary text-white border-0"
                            placeholder="Nuevo..."
                            bind:value={newProgramName}
                        />
                        <button
                            class="btn btn-info"
                            type="button"
                            on:click={createProgram}>+</button
                        >
                    </div>

                    <div
                        class="list-group list-group-flush"
                        style="font-size: 0.9rem;"
                    >
                        {#each programs as prog}
                            <div
                                class="list-group-item bg-dark border-secondary p-1"
                            >
                                <div
                                    class="d-flex justify-content-between align-items-center mb-1"
                                >
                                    <button
                                        class="btn btn-sm text-start flex-grow-1 {prog.id ===
                                        editingProgramId
                                            ? 'btn-info'
                                            : 'btn-outline-secondary text-white'}"
                                        on:click={() =>
                                            (editingProgramId = prog.id)}
                                    >
                                        {prog.id === editingProgramId
                                            ? "👁 "
                                            : ""}{prog.name}
                                    </button>
                                    {#if programs.length > 1}
                                        <button
                                            class="btn btn-sm btn-link text-danger p-0 ms-2"
                                            on:click={() =>
                                                removeProgram(
                                                    prog.id,
                                                    prog.name,
                                                )}>×</button
                                        >
                                    {/if}
                                </div>
                                <div class="d-flex gap-1 mt-1">
                                    {#if prog.id === activeProgramId}
                                        <span class="badge bg-danger w-100 py-1"
                                            >🔴 EN VIVO</span
                                        >
                                    {:else}
                                        <button
                                            class="btn btn-dark btn-sm w-100 border-secondary py-0"
                                            on:click={() => setLive(prog.id)}
                                            >VOLVER VIVO</button
                                        >
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="mt-2 small text-muted">
                        * Puedes editar cualquier programa sin afectar el que
                        está EN VIVO. El programa EN VIVO es el que escribe los
                        archivos .txt para OBS.
                    </div>
                </div>
            </div>
        </div>

        <!-- Zocalos Area -->
        <div class="col-md-9">
            <div class="card bg-secondary mt-1">
                <div
                    class="card-header text-white p-2 d-flex justify-content-between align-items-center"
                >
                    <h5 class="m-0">
                        EDITANDO: {programs.find(
                            (p) => p.id === editingProgramId,
                        )?.name || "..."}
                    </h5>
                    {#if editingProgramId === activeProgramId}
                        <span class="badge bg-danger blink">ESTÁ AL AIRE</span>
                    {/if}
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
