<script>
    import { obsState, sendCommand as wsSendCommand } from "$lib/obs_store";
    import InfoPill from "../InfoPill.svelte";

    // Global state
    $: programs = $obsState.programs || [];
    $: activeProgramId = $obsState.activeProgramId;

    // Local state
    let newProgramName = "";
    let editingId = null; // ID of program being renamed
    let editNameContent = ""; // Temp name content
    let infoPillData = { type: "info", text: "" };
    let infoPillDataTimeOut;

    function showInfo(data) {
        if (infoPillData.text !== "") {
            clearTimeout(infoPillDataTimeOut);
        }
        infoPillData = data;
        infoPillDataTimeOut = setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 5000);
    }

    function createProgram() {
        if (!newProgramName.trim()) return;
        wsSendCommand("addProgram", { name: newProgramName.toUpperCase() });
        showInfo({
            type: "success",
            text: `PROGRAMA CREADO: ${newProgramName.toUpperCase()}`,
        });
        newProgramName = "";
    }

    function removeProgram(id, name) {
        if (id === 1) return; // Standard protection
        if (confirm(`¿Eliminar programa "${name}" y todos sus zocalos?`)) {
            wsSendCommand("deleteProgram", { id });
            showInfo({ type: "danger", text: `PROGRAMA ELIMINADO: ${name}` });
        }
    }

    function startEdit(prog) {
        if (prog.id === 1) return; // Cannot edit GENERAL
        editingId = prog.id;
        editNameContent = prog.name;
    }

    function cancelEdit() {
        editingId = null;
        editNameContent = "";
    }

    function saveEdit() {
        if (!editNameContent.trim()) return;
        wsSendCommand("updateProgram", {
            id: editingId,
            name: editNameContent.toUpperCase(),
        });
        showInfo({ type: "primary", text: "PROGRAMA ACTUALIZADO" });
        editingId = null;
    }
</script>

<div class="container-fluid pt-2">
    <div class="row sticky-top mb-2">
        <div class="col-12">
            <InfoPill {infoPillData} />
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card bg-dark text-white">
                <div
                    class="card-header border-secondary d-flex justify-content-between align-items-center"
                >
                    <h5 class="m-0">GESTIÓN DE PROGRAMAS</h5>
                </div>
                <div class="card-body">
                    <!-- Create New -->
                    <div class="input-group mb-4">
                        <input
                            type="text"
                            class="form-control bg-secondary text-white border-secondary"
                            placeholder="Nombre del nuevo programa..."
                            bind:value={newProgramName}
                            on:keydown={(e) =>
                                e.key === "Enter" && createProgram()}
                        />
                        <button
                            class="btn btn-info"
                            type="button"
                            on:click={createProgram}
                        >
                            CREAR PROGRAMA
                        </button>
                    </div>

                    <!-- List -->
                    <div class="list-group">
                        {#each programs as prog}
                            <div
                                class="list-group-item bg-secondary text-white border-dark d-flex align-items-center justify-content-between mb-2 rounded"
                            >
                                <div
                                    class="d-flex align-items-center flex-grow-1"
                                >
                                    {#if prog.id === activeProgramId}
                                        <span class="badge bg-danger me-3 p-2"
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
                                        <span class="h5 m-0">{prog.name}</span>
                                    {/if}
                                </div>

                                <div>
                                    {#if editingId === prog.id}
                                        <button
                                            class="btn btn-success btn-sm"
                                            on:click={saveEdit}>✓</button
                                        >
                                        <button
                                            class="btn btn-outline-light btn-sm ms-1"
                                            on:click={cancelEdit}>×</button
                                        >
                                    {:else}
                                        <button
                                            class="btn btn-outline-info btn-sm border-0"
                                            on:click={() => startEdit(prog)}
                                            disabled={prog.id === 1}
                                        >
                                            ✎ EDITAR
                                        </button>
                                        <button
                                            class="btn btn-outline-danger btn-sm border-0 ms-2"
                                            on:click={() =>
                                                removeProgram(
                                                    prog.id,
                                                    prog.name,
                                                )}
                                            disabled={prog.id === 1}
                                        >
                                            🗑 ELIMINAR
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
        transition: transform 0.1s;
    }
</style>
