<script>
    /**
     * @file +page.svelte (Programs)
     * @description Página de gestión de programas. Permite crear, renombrar y eliminar
     * programas del sistema. No se puede eliminar ni renombrar el programa GENERAL.
     */
    import { obsState, sendCommand as wsSendCommand } from "$lib/stores/obs.js";
    import InfoPill from "$lib/components/common/InfoPill.svelte";

    // Suscripción al estado global de programas
    $: programs = $obsState.programs || [];
    $: activeProgramId = $obsState.activeProgramId;

    // Estado local para formularios
    /** @type {string} Nombre del nuevo programa a crear */
    let newProgramName = "";
    /** @type {number|null} ID del programa que se está editando actualmente */
    let editingId = null;
    /** @type {string} Contenido temporal para el renombrado */
    let editNameContent = "";

    /** @type {Object} Estado de la notificación visual */
    let infoPillData = { type: "info", text: "" };
    let infoPillDataTimeOut;

    /**
     * Muestra información de estado temporal.
     * @param {Object} data
     */
    function showInfo(data) {
        if (infoPillData.text !== "") {
            clearTimeout(infoPillDataTimeOut);
        }
        infoPillData = data;
        infoPillDataTimeOut = setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 5000);
    }

    /**
     * Envía comando para crear un nuevo programa.
     */
    function createProgram() {
        if (!newProgramName.trim()) return;
        const nameUpper = newProgramName.toUpperCase();
        wsSendCommand("addProgram", { name: nameUpper });
        showInfo({
            type: "success",
            text: `PROGRAMA CREADO: ${nameUpper}`,
        });
        newProgramName = "";
    }

    /**
     * Elimina un programa tras confirmación del usuario.
     * @param {number} id
     * @param {string} name
     */
    function removeProgram(id, name) {
        if (id === 1) return; // Protección del programa base
        if (
            confirm(
                `¿Eliminar programa "${name}" y todos sus zócalos asociados?`,
            )
        ) {
            wsSendCommand("deleteProgram", { id });
            showInfo({ type: "danger", text: `PROGRAMA ELIMINADO: ${name}` });
        }
    }

    /**
     * Inicia el modo de edición de nombre para un programa.
     */
    function startEdit(prog) {
        if (prog.id === 1) return;
        editingId = prog.id;
        editNameContent = prog.name;
    }

    /** Cancela la edición actual */
    function cancelEdit() {
        editingId = null;
        editNameContent = "";
    }

    /** Guarda los cambios de nombre del programa */
    function saveEdit() {
        if (!editNameContent.trim()) return;
        const editUpper = editNameContent.toUpperCase();
        wsSendCommand("updateProgram", {
            id: editingId,
            name: editUpper,
        });
        showInfo({
            type: "primary",
            text: `PROGRAMA ACTUALIZADO: ${editUpper}`,
        });
        editingId = null;
    }
</script>

<div class="container-fluid pt-2 bg-black min-vh-100">
    <!-- Fila de notificaciones fija -->
    <div class="row sticky-top mb-2">
        <div class="col-12">
            <InfoPill {infoPillData} />
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card bg-dark text-white shadow-lg border-secondary">
                <div
                    class="card-header border-secondary d-flex justify-content-between align-items-center bg-dark"
                >
                    <h5 class="m-0 fw-bold uppercase">
                        <i class="bi bi-collection-play me-2"></i>GESTIÓN DE
                        PROGRAMAS
                    </h5>
                </div>
                <div class="card-body">
                    <!-- Formulario de creación -->
                    <div class="input-group mb-4 shadow-sm">
                        <input
                            type="text"
                            class="form-control bg-dark text-white border-secondary"
                            placeholder="Nombre del nuevo programa (ej: NOTICIERO)..."
                            bind:value={newProgramName}
                            on:keydown={(e) =>
                                e.key === "Enter" && createProgram()}
                        />
                        <button
                            class="btn btn-info fw-bold"
                            type="button"
                            on:click={createProgram}
                        >
                            <i class="bi bi-plus-lg me-1"></i> CREAR PROGRAMA
                        </button>
                    </div>

                    <!-- Listado de programas existentes -->
                    <div class="list-group gap-2">
                        {#each programs as prog}
                            <div
                                class="list-group-item bg-secondary text-white border-dark d-flex align-items-center justify-content-between rounded transition-all"
                                class:active-program={prog.id ===
                                    activeProgramId}
                            >
                                <div
                                    class="d-flex align-items-center flex-grow-1"
                                >
                                    {#if prog.id === activeProgramId}
                                        <span
                                            class="badge bg-danger me-3 p-2 blink"
                                            >EN VIVO</span
                                        >
                                    {/if}

                                    {#if editingId === prog.id}
                                        <input
                                            type="text"
                                            class="form-control form-control-sm bg-dark text-white border-info w-50"
                                            bind:value={editNameContent}
                                            on:keydown={(e) =>
                                                e.key === "Enter" && saveEdit()}
                                            autofocus
                                        />
                                    {:else}
                                        <span class="h5 m-0 fw-bold"
                                            >{prog.name}</span
                                        >
                                    {/if}
                                </div>

                                <div class="btn-group">
                                    {#if editingId === prog.id}
                                        <button
                                            class="btn btn-success btn-sm btn-confirm"
                                            on:click={saveEdit}
                                        >
                                            <i class="bi bi-check-lg"></i>
                                        </button>
                                        <button
                                            class="btn btn-outline-light btn-sm ms-1"
                                            on:click={cancelEdit}
                                        >
                                            <i class="bi bi-x-lg"></i>
                                        </button>
                                    {:else}
                                        <button
                                            class="btn btn-outline-info btn-sm border-0"
                                            on:click={() => startEdit(prog)}
                                            disabled={prog.id === 1}
                                            title="Renombrar"
                                        >
                                            <i class="bi bi-pencil-square"></i> EDITAR
                                        </button>
                                        <button
                                            class="btn btn-outline-danger btn-sm border-0 ms-2"
                                            on:click={() =>
                                                removeProgram(
                                                    prog.id,
                                                    prog.name,
                                                )}
                                            disabled={prog.id === 1}
                                            title="Eliminar"
                                        >
                                            <i class="bi bi-trash-fill"></i> ELIMINAR
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .list-group-item {
        transition: all 0.2s ease;
        background-color: #2c2c2c !important;
    }
    .list-group-item:hover {
        background-color: #3d3d3d !important;
        transform: translateX(5px);
    }
    .active-program {
        border-left: 5px solid #dc3545 !important;
    }
    .uppercase {
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .blink {
        animation: blink-animation 2s steps(5, start) infinite;
    }
    @keyframes blink-animation {
        to {
            visibility: hidden;
        }
    }
    .transition-all {
        transition: all 0.3s ease;
    }
    .btn-confirm {
        min-width: 40px;
    }
</style>
