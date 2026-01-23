<script>
    /**
     * @file Zocalos.svelte
     * @description Componente de gestión de zócalos (Lower Thirds) F1, F2 y auxiliares F3.
     * Permite editar, agregar, eliminar y poner al aire los zócalos organizados por programa.
     */
    import { onMount } from "svelte";
    import InfoPill from "../common/InfoPill.svelte";
    import {
        obsState,
        sendCommand as wsSendCommand,
    } from "../../stores/obs.js";

    // Suscripciones reactivas divididas por tipo de datos del store global
    $: allZocalos = $obsState.zocalos || [];
    $: allZocalosDinamicos = $obsState.zocalosDinamicos || [];
    $: programs = $obsState.programs || [];
    $: activeProgramId = $obsState.activeProgramId;
    $: activeProgramName =
        programs.find((p) => Number(p.id) === Number(activeProgramId))?.name ||
        "DESCONOCIDO";

    /** @type {number|null} ID del programa que se está visualizando/editando actualmente en la UI */
    let editingProgramId = null;

    // Inicializar el programa en edición preferiblemente con el que está al aire
    $: if (editingProgramId === null && programs.length > 0) {
        if (activeProgramId) {
            editingProgramId = Number(activeProgramId);
        } else {
            editingProgramId = Number(programs[0].id);
        }
    }

    /** Filtrado reactivo de zócalos según el programa seleccionado en el dropdown */
    $: currentZocalos = allZocalos.filter(
        (z) => Number(z.program_id) === Number(editingProgramId),
    );

    /** Filtrado y ordenamiento de auxiliares (slots del 1 al 3) */
    $: currentZocalosDinamicos = allZocalosDinamicos
        .filter((z) => Number(z.program_id) === Number(editingProgramId))
        .sort((a, b) => a.slot - b.slot);

    /** @type {string} Texto F1 para el formulario de nuevo zócalo */
    let f1 = "";
    /** @type {string} Texto F2 para el formulario de nuevo zócalo */
    let f2 = "";

    /** @type {Object} Estado de la píldora de notificación */
    export let infoPillData = { type: "info", text: "" };
    let infoPillDataTimeOut;

    // Límites de caracteres para los campos de texto
    let f1Lenght = 60;
    let f2Lenght = 70;
    let f3Lenght = 65;

    /** @type {number} ID del zócalo F1/F2 que se está editando (para mostrar el botón de confirmar) */
    $: onEdit = 0;
    /** @type {number} ID del auxiliar F3 que se está editando */
    $: onEditAux = 0;

    /** Limpia los campos del formulario de creación */
    function resetAddForm() {
        f1 = "";
        f2 = "";
    }

    /**
     * Muestra un mensaje de notificación temporal.
     * @param {Object} data Objeto con {type, text}.
     */
    function showInfo(data) {
        if (infoPillData.text !== "") {
            resetShowInfo();
        }
        infoPillData = data;
        infoPillDataTimeOut = setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 5000);
    }

    /** Oculta la notificación y limpia el timer */
    function resetShowInfo() {
        infoPillData = { type: "info", text: "" };
        clearTimeout(infoPillDataTimeOut);
    }

    /**
     * Envía comando al servidor para agregar un nuevo zócalo.
     */
    async function addZocalo(f1Text, f2Text) {
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

    /**
     * Elimina un zócalo tras validar que no esté al aire.
     */
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

    /**
     * Actualiza los textos de un zócalo existente.
     */
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

    /**
     * Pone un zócalo F1/F2 al aire en OBS.
     */
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

    /**
     * Actualiza el contenido de un auxiliar (F3).
     */
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

    /**
     * Pone un auxiliar (F3) al aire en OBS.
     */
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

    /**
     * Limpia el texto de un auxiliar.
     */
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

<div class="zocalos-wrapper col-md-12">
    <div class="card bg-secondary mt-1 shadow">
        <!-- Cabecera con selector de programa y estado AL AIRE -->
        <div
            class="card-header text-white p-2 d-flex justify-content-between align-items-center gap-3 bg-dark"
        >
            <div class="d-flex align-items-center flex-grow-1">
                <label
                    for="programSelect"
                    class="me-2 text-nowrap fw-bold small text-info"
                    >PROGRAMA:</label
                >
                <select
                    id="programSelect"
                    class="form-select form-select-sm bg-dark text-white border-secondary fw-bold"
                    bind:value={editingProgramId}
                >
                    {#each programs as prog}
                        <option value={Number(prog.id)}>{prog.name}</option>
                    {/each}
                </select>
            </div>

            <div class="text-end">
                {#if Number(editingProgramId) === Number(activeProgramId)}
                    <span class="badge bg-danger blink border border-light p-2">
                        <i class="bi bi-broadcast me-1"></i> AL AIRE: {activeProgramName}
                    </span>
                {:else}
                    <span
                        class="badge bg-dark text-secondary border border-secondary p-2"
                    >
                        AIRE: {activeProgramName}
                    </span>
                {/if}
            </div>
        </div>

        <div class="card-body p-2 bg-dark">
            <!-- SECCIÓN ZÓCALOS AUXILIARES (F3) -->
            <h6 class="text-info mb-2 ms-1 fw-bold uppercase small mt-2">
                AUXILIARES (F3)
            </h6>
            <div class="card bg-dark border-secondary mb-3">
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
                                        : 'bg-dark text-light border-secondary'}"
                                    type="text"
                                    placeholder="Título Auxiliar"
                                    value={slotData.f3}
                                    on:input={() => (onEditAux = slotData.id)}
                                    maxlength={f3Lenght}
                                />
                            </div>
                            <div class="col-auto">
                                <div class="btn-group">
                                    <button
                                        type="button"
                                        class="btn btn-outline-danger btn-sm border-0"
                                        hidden={onEditAux === slotData.id}
                                        on:click|preventDefault={() =>
                                            clearAuxZocalo(slotData)}
                                        title="Limpiar">🗑</button
                                    >
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-sm"
                                        hidden={onEditAux !== slotData.id}
                                        >✓ ACTUALIZAR</button
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
                                        {slotData.onAir ? "AL AIRE" : "USAR"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    {/each}
                </div>
            </div>

            <!-- FORMULARIO PARA AGREGAR NUEVO ZÓCALO -->
            <h6 class="text-info mb-2 ms-1 fw-bold uppercase small">
                NUEVO ZÓCALO
            </h6>
            <div class="card bg-dark border-secondary mb-3">
                <div class="card-body p-2">
                    <form
                        class="row gy-1 gx-1 align-items-center"
                        on:submit|preventDefault={() => addZocalo(f1, f2)}
                    >
                        <div class="col-auto">
                            <span class="badge badge-light"
                                >{currentZocalos.length + 1}</span
                            >
                        </div>
                        <div class="col-5">
                            <input
                                class="form-control form-control-sm bg-dark text-light border-secondary"
                                type="text"
                                placeholder="Título (Línea 1)"
                                bind:value={f1}
                                maxlength={f1Lenght}
                            />
                        </div>
                        <div class="col-5">
                            <input
                                class="form-control form-control-sm bg-dark text-light border-secondary"
                                placeholder="Detalles (Línea 2)"
                                type="text"
                                bind:value={f2}
                                maxlength={f2Lenght}
                            />
                        </div>
                        <div class="col-auto">
                            <button
                                type="submit"
                                class="btn btn-info btn-sm fw-bold"
                                >AGREGAR</button
                            >
                        </div>
                    </form>
                </div>
            </div>

            <!-- LISTADO PRINCIPAL DE ZÓCALOS (F1/F2) -->
            <h6 class="text-info mb-2 ms-1 fw-bold uppercase small">
                LISTADO DE ZÓCALOS (F1-F2)
            </h6>
            <div
                class="zocalos-list p-1"
                style="max-height: 50vh; overflow-y: auto;"
            >
                {#each currentZocalos as zocalo, i}
                    <form
                        class="row gy-1 gx-1 align-items-center mb-1"
                        id="form{zocalo.id}"
                        on:submit|preventDefault={() => updateZocalo(zocalo)}
                    >
                        <div class="col-auto">
                            <span
                                class="badge {zocalo.onAir
                                    ? 'btn-danger'
                                    : 'btn-outline-light'}"
                            >
                                {i + 1 < 10 ? "0" : ""}{i + 1}
                            </span>
                        </div>
                        <div class="col-5">
                            <input
                                class="form-control form-control-sm {zocalo.onAir
                                    ? 'on-air-input'
                                    : 'bg-dark text-light border-secondary'}"
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
                                    : 'bg-dark text-light border-secondary'}"
                                id="f2text{zocalo.id}"
                                on:input={() => (onEdit = zocalo.id)}
                                type="text"
                                value={zocalo.f2}
                            />
                        </div>
                        <div class="btn-group col-auto p-0" role="group">
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
                                    : 'btn-success fw-bold'}"
                                disabled={zocalo.onAir}
                            >
                                {zocalo.onAir ? "AL AIRE" : "USAR"}
                            </button>
                        </div>
                    </form>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .on-air-input {
        background-color: #fff0f0 !important;
        border-color: #ff0000 !important;
        font-weight: bold;
        color: #b00 !important;
    }
    .blink {
        animation: smooth-blink 3s ease-in-out infinite;
    }

    @keyframes smooth-blink {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }

    .zocalos-list::-webkit-scrollbar {
        width: 6px;
    }
    .zocalos-list::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 10px;
    }

    .uppercase {
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>
