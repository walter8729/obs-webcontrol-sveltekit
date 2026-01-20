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
        programs.find((p) => Number(p.id) === Number(activeProgramId))?.name ||
        "DESCONOCIDO";

    // local state for simultaneous editing
    let editingProgramId = null;

    // Initialize editingProgramId if not set, prefer active or first available
    $: if (editingProgramId === null && programs.length > 0) {
        if (activeProgramId) {
            editingProgramId = Number(activeProgramId);
        } else {
            editingProgramId = Number(programs[0].id);
        }
    }

    // Filtered data for the CURRENT VIEW
    $: currentZocalos = allZocalos.filter(
        (z) => Number(z.program_id) === Number(editingProgramId),
    );
    // currentZocalosDinamicos will be an array of 3 objects
    $: currentZocalosDinamicos = allZocalosDinamicos
        .filter((z) => Number(z.program_id) === Number(editingProgramId))
        .sort((a, b) => a.slot - b.slot);

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
    // Track which aux slot ID is being edited
    $: onEditAux = 0;

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
        // Permitir vacios como pidió el usuario
        const f1Upper = (f1Text || "").toUpperCase();
        wsSendCommand("addZocalo", {
            f1: f1Upper,
            f2: (f2Text || "").toUpperCase(),
            onAir: false,
            program_id: Number(editingProgramId),
        });
        resetAddForm();
        showInfo({
            type: "info",
            text: `ZOCALO AGREGADO: ${f1Upper || "SIN TITULO"}`,
        });
    }

    async function deleteZocalo(zocalo) {
        if (
            zocalo.onAir &&
            Number(editingProgramId) === Number(activeProgramId)
        ) {
            alert(
                "No se puede eliminar un zocalo cuando esta al aire en el programa activo",
            );
            return;
        }
        wsSendCommand("deleteZocalo", { id: zocalo.id });
        showInfo({
            type: "danger",
            text: `ELIMINASTE EL ZOCALO: ${zocalo.f1 || "SIN TITULO"}`,
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
        showInfo({
            type: "primary",
            text: `ACTUALIZASTE EL ZOCALO: ${newF1 || "SIN TITULO"}`,
        });
    }

    async function setOnAirZocalo(zocalo) {
        wsSendCommand("setOnAirZocalo", {
            id: zocalo.id,
            program_id: Number(editingProgramId),
        });
        showInfo({
            type: "success",
            text: `ZOCALO AL AIRE: ${zocalo.f1 || "SIN TITULO"}`,
        });
    }

    async function updateAuxZocalo(slotData) {
        const newF3 = document
            .getElementById(`f3text_${slotData.id}`)
            .value.toUpperCase();
        wsSendCommand("writeZocaloDinamicoToFile", {
            program_id: Number(editingProgramId),
            f3: newF3,
            slot: slotData.slot,
        });
        onEditAux = 0;
        showInfo({
            type: "primary",
            text: `ACTUALIZASTE AUXILIAR ${slotData.slot}: ${newF3 || "VACIO"}`,
        });
    }

    async function setOnAirAuxiliary(slotData) {
        wsSendCommand("setOnAirAuxiliary", {
            id: slotData.id,
            program_id: Number(editingProgramId),
        });
        showInfo({
            type: "success",
            text: `AUXILIAR ${slotData.slot} EN USO: ${slotData.f3 || "VACIO"}`,
        });
    }

    async function clearAuxZocalo(slotData) {
        wsSendCommand("writeZocaloDinamicoToFile", {
            program_id: Number(editingProgramId),
            f3: "",
            slot: slotData.slot,
        });
        showInfo({
            type: "warning",
            text: `LIMPIASTE AUXILIAR ${slotData.slot}`,
        });
    }
</script>

<div class="container-fluid">
    <div class="row">
        <div class="col-md-12">
            <div class="card bg-secondary mt-1">
                <div
                    class="card-header text-white p-2 d-flex justify-content-between align-items-center gap-3"
                >
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
                                <option value={Number(prog.id)}
                                    >{prog.name}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <div class="text-end">
                        {#if Number(editingProgramId) === Number(activeProgramId)}
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
                    <!-- ****ZOCALOS AUXILIARES**** -->
                    <h6 class="text-white mb-2 ms-1">
                        ZOCALOS AUXILIARES (F3)
                    </h6>
                    <div class="card bg-secondary mb-3">
                        <div class="card-body p-2">
                            {#each currentZocalosDinamicos as slotData (slotData.id)}
                                <form
                                    class="row gy-1 gx-1 align-items-center mb-1"
                                    on:submit|preventDefault={() =>
                                        updateAuxZocalo(slotData)}
                                >
                                    <div class="col-auto">
                                        <span
                                            class="badge {slotData.onAir
                                                ? 'btn-danger'
                                                : 'btn-outline-light'}"
                                        >
                                            0{slotData.slot}
                                        </span>
                                    </div>
                                    <div class="col">
                                        <input
                                            id="f3text_{slotData.id}"
                                            class="form-control form-control-sm {slotData.onAir
                                                ? 'on-air-input'
                                                : ''}"
                                            type="text"
                                            placeholder="Título Auxiliar"
                                            value={slotData.f3}
                                            on:input={() =>
                                                (onEditAux = slotData.id)}
                                            maxlength={f3Lenght}
                                        />
                                    </div>
                                    <div class="col-auto">
                                        <div class="btn-group">
                                            <button
                                                type="button"
                                                class="btn btn-outline-danger btn-sm border-0"
                                                hidden={onEditAux ===
                                                    slotData.id}
                                                on:click|preventDefault={() =>
                                                    clearAuxZocalo(slotData)}
                                                title="Limpiar">🗑</button
                                            >

                                            <button
                                                type="submit"
                                                class="btn btn-primary btn-sm"
                                                hidden={onEditAux !==
                                                    slotData.id}>✓</button
                                            >

                                            <button
                                                type="button"
                                                class="btn btn-sm {slotData.onAir
                                                    ? 'btn-danger'
                                                    : 'btn-success'}"
                                                disabled={slotData.onAir}
                                                on:click|preventDefault={() =>
                                                    setOnAirAuxiliary(slotData)}
                                            >
                                                {slotData.onAir
                                                    ? "EN USO"
                                                    : "USAR"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            {/each}
                        </div>
                    </div>

                    <!-- ****AGREGAR NUEVO ZOCALO**** -->
                    <h6 class="text-white mb-2 ms-1">AGREGAR ZOCALO</h6>
                    <div class="card bg-dark border-secondary mb-3">
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

                    <!-- ****LISTA DE ZOCALOS**** -->
                    <h6 class="text-white mb-2 ms-1">LISTA DE ZOCALOS</h6>
                    <div
                        class="zocalos-list p-1"
                        style="max-height: 50vh; overflow-y: auto;"
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
                                            Number(editingProgramId) ===
                                                Number(activeProgramId)}
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
