<script>
    import { onMount } from "svelte";
    import { slide, fade, fly, blur} from 'svelte/transition';

    $: zocalos = [];
    let f1 = "";
    let f2 = "";
    let f3 = "";
    $: onEdit = 0;
    $: zocaloDinamicoOnEdit = false;
    $: resetAddForm();

    let apiAddress = `http://192.168.1.154:5173/api/zocalos`;

    function resetAddForm() {
        f1 = "";
        f2 = "";
    }
    async function getAllZocalos() {
        try {
            let apiUrl = apiAddress + "?get=getAllZocalos";
            //console.log("La url de la api es: ", apiUrl);
            let fromApi = await fetch(apiUrl).then((res) => res.json());
            zocalos = [...fromApi];
            // console.log("getAllZocalos: \n", zocalos);
        } catch (error) {
            console.log(error);
        }
    }
    async function getZocaloDinamicoFromFile() {
        try {
            let apiUrl = apiAddress + "?get=getZocaloDinamicoFromFile";
            //console.log("La url de la api es: ", apiUrl);
            let fromApi = await fetch(apiUrl).then((res) => res.json());
            // console.log("getZocaloDinamicoFromFile: ", fromApi);
            if (f3 !== fromApi.f3 && !zocaloDinamicoOnEdit) {
                f3 = fromApi.f3;
            }
        } catch (error) {
            console.log(error);
        }
    }
    async function addZocalo(f1, f2) {
        resetAddForm();
        try {
            let apiUrl = apiAddress + "?set=addZocalo";
            f1 = f1.toUpperCase();
            f2 = f2.toUpperCase();
            //console.log("La url de la api es: ", apiUrl);
            let fromApi = await fetch(apiUrl, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, PUT, OPTIONS",
                },
                body: JSON.stringify({
                    f1,
                    f2,
                    onAir: false,
                }),
            })
                .then((res) => res.json())
                .then((data) => console.log(data));
                await getAllZocalos();
                console.log(fromApi);
                alert("Zocalo Agregado");
        } catch (error) {
            console.log(error);
        }
    }
    async function deleteZocalo(zocalo) {
        try {
            if (!zocalo.onAir) {
                let apiUrl = apiAddress + "?set=deleteZocalo";
                //console.log("La url de la api es: ", apiUrl);
                let fromApi = await fetch(apiUrl, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Methods":
                            "DELETE, POST, GET, PUT, OPTIONS",
                    },
                    // mode: "no-cors",
                    body: JSON.stringify({ id: zocalo.id }),
                }).then((res) => res.json());

                getAllZocalos();
                alert("Zocalo Eliminado: \n" + zocalo.f1 + " " + zocalo.f2);
            } else {
                alert("No se puede eliminar un zocalo cuando esta en uso");
            }
        } catch (error) {
            console.log(error);
        }
    }
    async function updateZocalo(zocalo) {
        try {
            let apiUrl = apiAddress + "?set=updateZocalo";
            //console.log("La url de la api es: ", apiUrl);
            let f1 = document
                .getElementById("f1text" + zocalo.id)
                .value.toUpperCase();
            let f2 = document
                .getElementById("f2text" + zocalo.id)
                .value.toUpperCase();

            let onAir;

            let fromApi = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, PUT, OPTIONS",
                },
                // mode: "no-cors",
                body: JSON.stringify({
                    id: zocalo.id,
                    f1,
                    f2,
                    onAir: zocalo.onAir,
                }),
            }).then((res) => res.json());

            // console.log(fromApi);

            await getAllZocalos();
            await writeZocaloToFile(zocalos);
            onEdit = 0;
            alert("Zocalo Actualizado");
        } catch (error) {
            console.log(error);
        }
    }
    async function setOnAirZocalo(id) {
        try {
            let apiUrl = apiAddress + "?set=onAir";
            //console.log("La url de la api es: ", apiUrl);
            let fromApi = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, PUT, OPTIONS",
                },
                // mode: "no-cors",
                body: JSON.stringify(id),
            }).then((res) => res.json());

            console.log("set on air return: ", fromApi);
            await getAllZocalos();
            await writeZocaloToFile();
        } catch (error) {
            console.log(error);
        }
    }
    async function writeZocaloToFile() {
        try {
            let apiUrl = apiAddress + "?set=writeZocaloToFile";
            let fromApi = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, PUT, OPTIONS",
                },
                // mode: "no-cors",
                body: JSON.stringify(zocalos),
            }).then((res) => res.json());

            console.log("respuesta desde write to file", fromApi);
        } catch (error) {
            console.log(error);
        }
    }
    async function writeZocaloDinamicoToFile() {
        try {
            zocaloDinamicoOnEdit = false;
            let f3 = document.getElementById("f3text").value.toUpperCase();
            let apiUrl = apiAddress + "?set=writeZocaloDinamicoToFile";
            let fromApi = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods":
                        "DELETE, POST, GET, PUT, OPTIONS",
                },
                // mode: "no-cors",
                body: JSON.stringify(f3),
            })
                .then((res) => res.json())
                .then(getZocaloDinamicoFromFile())
                .then(alert("Zocalo Auxiliar Actualizado"));
        } catch (error) {
            console.log(error);
        }
    }

    setInterval(async function () {
        await getAllZocalos();
        await getZocaloDinamicoFromFile();
        // console.log(zocaloDinamicoOnEdit);
    }, 1000);

    onMount(async function () {
        await getAllZocalos();
        await getZocaloDinamicoFromFile();
    });
</script>

<!-- ****ZOCALOS**** -->
<!-- ****ZOCALO DINAMICO**** -->
<div class="card bg-dark mt-1">
    <div class="card-header text-white">ZOCALO AUXILIAR</div>
    <div class="card-body">
        <form action="" method="post" class="row gy-2 gx-2 align-items-center">
            <div class="col-8">
                <!-- svelte-ignore a11y-autofocus -->
                <input
                    id="f3text"
                    class="form-control"
                    type="text"
                    bind:value={f3}
                    on:input={() => (zocaloDinamicoOnEdit = true)}
                    maxlength="85"
                    autofocus
                />
            </div>

            <div class="col-auto">
                <button
                    class="btn btn-outline-primary btn-md"
                    disabled={!zocaloDinamicoOnEdit}
                    on:click|preventDefault={writeZocaloDinamicoToFile}
                >
                    ACTUALIZAR
                </button>
            </div>
        </form>
    </div>
</div>

<!-- ****LISTA DE ZOCALOS**** -->
<div class="card bg-dark mt-1">
    <div
        class="card-header text-white justify-content-between align-items-center"
    >
        <form action="" method="post" class="row gy-2 gx-2 align-items-center">
            <h3>AGREGAR NUEVOS ZOCALOS</h3>
            <div class="col-5">
                <!-- svelte-ignore a11y-autofocus -->
                <input 
                    class="form-control"
                    type="text"
                    bind:value={f1}
                    maxlength="60"
                    autofocus
                />
            </div>

            <div class="col-5">
                <input
                    class="form-control"
                    type="text"
                    bind:value={f2}
                    maxlength="70"
                />
            </div>

            <div class="col-auto">
                <button
                    class="btn btn-info"
                    on:click|preventDefault={addZocalo(f1, f2)}
                >
                    Guardar
                </button>
            </div>
        </form>
    </div>

    <table class="table table-striped table-dark">
        <thead>
            <tr>
                <th>Index</th>
                <th>Zocalos</th>
                <!-- <th>Activo</th> -->
            </tr>
        </thead>
        <tbody>
            {#each zocalos as zocalo, i}
                <tr >
                    <td>{i + 1}</td>
                    <td>
                        <form 
                            class="row gy-2 gx-2 align-items-center"
                            id="form{zocalo.id}"
                        >
                            <div class="col-4">
                                <input
                                    id="f1text{zocalo.id}"
                                    on:input={() => (onEdit = zocalo.id)}
                                    class="form-control"
                                    type="text"
                                    name="f1"
                                    value={zocalo.f1}
                                    maxlength="60"
                                />
                            </div>
                            <div class="col-4">
                                <input
                                    id="f2text{zocalo.id}"
                                    on:input={() => (onEdit = zocalo.id)}
                                    class="form-control"
                                    type="text"
                                    name="f2"
                                    value={zocalo.f2}
                                    maxlength="70"
                                />
                            </div>

                            <div class="col-auto">
                                <button
                                    class="btn btn-danger"
                                    disabled={zocalo.onAir}
                                    on:click|preventDefault={deleteZocalo(
                                        zocalo
                                    )}
                                >
                                    ╳
                                </button>
                            </div>

                            <div class="col-auto">
                                <button
                                    type="submit"
                                    class="btn btn-primary"
                                    hidden={zocalo.id === onEdit ? false : true}
                                    on:click|preventDefault={updateZocalo(
                                        zocalo
                                    )}
                                >
                                    ✓
                                </button>
                            </div>
                            <div class="col-auto">
                                <button
                                    on:click|preventDefault={setOnAirZocalo(
                                        zocalo.id
                                    )}
                                    class={zocalo.onAir
                                        ? "btn btn-danger "
                                        : "btn btn-success"}
                                    disabled={zocalo.onAir}
                                >
                                    {zocalo.onAir ? "ON AIR" : "USAR"}
                                </button>
                            </div>
                        </form>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
