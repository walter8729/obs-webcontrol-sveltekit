<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import InfoPill from "$lib/components/common/InfoPill.svelte";

    let users = [];
    let newUser = { username: "", password: "" };
    let editingUser = null;
    let infoPillData = { type: "info", text: "" };

    function showInfo(type, text) {
        infoPillData = { type, text };
        setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 3000);
    }

    async function fetchUsers() {
        const res = await fetch("/api/users");
        if (res.ok) {
            users = await res.json();
        }
    }

    async function handleAdd() {
        if (!newUser.username || !newUser.password) return;
        const res = await fetch("/api/users", {
            method: "POST",
            body: JSON.stringify(newUser),
        });
        if (res.ok) {
            newUser = { username: "", password: "" };
            await fetchUsers();
            showInfo("success", "USUARIO AGREGADO");
        } else {
            showInfo("danger", "ERROR AL AGREGAR");
        }
    }

    async function handleUpdate() {
        if (!editingUser.username || !editingUser.password) return;
        const res = await fetch("/api/users", {
            method: "PUT",
            body: JSON.stringify(editingUser),
        });
        if (res.ok) {
            editingUser = null;
            await fetchUsers();
            showInfo("primary", "USUARIO ACTUALIZADO");
        }
    }

    async function handleDelete(id) {
        if (!confirm("¿Seguro que desea eliminar este usuario?")) return;
        const res = await fetch("/api/users", {
            method: "DELETE",
            body: JSON.stringify({ id }),
        });
        if (res.ok) {
            await fetchUsers();
            showInfo("warning", "USUARIO ELIMINADO");
        }
    }

    onMount(fetchUsers);
</script>

<div class="container mt-4">
    <div class="row">
        <div class="col-md-12">
            <InfoPill {infoPillData} />
        </div>
    </div>

    <div class="card bg-dark text-white shadow">
        <div
            class="card-header bg-primary text-white d-flex justify-content-between align-items-center"
        >
            <h5 class="mb-0">GESTIÓN DE USUARIOS</h5>
            <span class="badge bg-light text-dark">Total: {users.length}</span>
        </div>
        <div class="card-body">
            <div class="row mb-4">
                <div class="col-md-5">
                    <input
                        type="text"
                        class="form-control bg-dark text-white border-secondary"
                        placeholder="Nuevo Usuario"
                        bind:value={newUser.username}
                    />
                </div>
                <div class="col-md-5">
                    <input
                        type="password"
                        class="form-control bg-dark text-white border-secondary"
                        placeholder="Contraseña"
                        bind:value={newUser.password}
                    />
                </div>
                <div class="col-md-2 d-grid">
                    <button class="btn btn-success fw-bold" on:click={handleAdd}
                        >AGREGAR</button
                    >
                </div>
            </div>

            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>USUARIO</th>
                        <th>CONTRASEÑA</th>
                        <th class="text-end">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    {#each users as user}
                        <tr>
                            <td>{user.id}</td>
                            <td>
                                {#if editingUser && editingUser.id === user.id}
                                    <input
                                        type="text"
                                        class="form-control form-control-sm bg-dark text-white"
                                        bind:value={editingUser.username}
                                    />
                                {:else}
                                    {user.username}
                                {/if}
                            </td>
                            <td>
                                {#if editingUser && editingUser.id === user.id}
                                    <input
                                        type="text"
                                        class="form-control form-control-sm bg-dark text-white"
                                        bind:value={editingUser.password}
                                    />
                                {:else}
                                    ••••••••
                                {/if}
                            </td>
                            <td class="text-end">
                                {#if editingUser && editingUser.id === user.id}
                                    <button
                                        class="btn btn-primary btn-sm me-2"
                                        on:click={handleUpdate}>GUARDAR</button
                                    >
                                    <button
                                        class="btn btn-secondary btn-sm"
                                        on:click={() => (editingUser = null)}
                                        >CANCELAR</button
                                    >
                                {:else}
                                    <button
                                        class="btn btn-info btn-sm me-2"
                                        on:click={() =>
                                            (editingUser = { ...user })}
                                        >EDITAR</button
                                    >
                                    <button
                                        class="btn btn-danger btn-sm"
                                        on:click={() => handleDelete(user.id)}
                                        disabled={user.username === "admin"}
                                        >ELIMINAR</button
                                    >
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    .table td {
        vertical-align: middle;
    }
</style>
