<script>
    import { onMount } from "svelte";
    import InfoPill from "./InfoPill.svelte";

    //zocalos variables
    $: zocalos = [];
    let f1 = "";
    let f2 = "";
    let f3 = "";

    //Info pill variables
    export let infoPillData = { type: "info", text: "" };
    export let infoPillDataTimeOut;

    // limite texto zocalos form variables
    let f1Lenght = 60;
    let f2Lenght = 70;
    let f3Lenght = 65;

    //numero de id del  zocalo siendo editado, por default 0
    $: onEdit = 0;

    //si esque se esta editando el zocalo dinamico
    $: zocaloDinamicoOnEdit = false;

    //reset formulario de agregar nuevo zocalo
    $: resetAddForm();

    let apiAddress = `http://192.168.1.154:5000/api/zocalos`;

    //reseteo de binds de formulario de agregar zocalo
    function resetAddForm() {
        f1 = "";
        f2 = "";
    }
    //info del ultimo cambio que se realizo, para evitar usar confirm y alerts
    async function showInfo(data) {
        //si hay una info lo resetea
        if (infoPillData.text !== "") {
            resetShowInfo();
        }
        //luego mostramos info.
        infoPillData = data;
        infoPillDataTimeOut = setTimeout(() => {
            infoPillData = { type: "info", text: "" };
        }, 5000);
    }

    //funcion que resetea el show info, y rompe el setTimeOut
    async function resetShowInfo() {
        infoPillData = { type: "info", text: "" };
        clearTimeout(infoPillDataTimeOut);
    }
    //Pedimos al api la lista completa de zocalos
    async function getAllZocalos() {
        try {
            let apiUrl = apiAddress + "?get=getAllZocalos";
            //console.log("La url de la api es: ", apiUrl);
            let fromApi = await fetch(apiUrl).then((res) => res.json());
            //declaracion reactiva de svelte
            zocalos = [...fromApi];
            // console.log("getAllZocalos: \n", zocalos);
        } catch (error) {
            console.log(error);
        }
    }
    //Pedimos al api el txt dinamico en fichero esta no la lee de DB.
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
                .then(await getAllZocalos())
                .then(
                    showInfo({
                        type: "info",
                        text:
                            "AGREGASTE UN NUEVO ZOCALO N°: " +
                            zocalos.length +
                            " - " +
                            f1 +
                            " - " +
                            f2,
                    })
                );
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
                })
                    .then((res) => res.json())

                    .then(
                        showInfo({
                            type: "danger",
                            text:
                                "ELIMINASTE EL ZOCALO N°: " +
                                (zocalos.indexOf(zocalo) + 1) +
                                " - " +
                                zocalo.f1 +
                                " - " +
                                zocalo.f2,
                        })
                    );

                await getAllZocalos();
                // alert("Zocalo Eliminado: \n" + zocalo.f1 + " " + zocalo.f2);
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
            })
                .then((res) => res.json())

                .then(
                    showInfo({
                        type: "primary",
                        text:
                            "ACTUALIZASTE EL ZOCALO N°: " +
                            (zocalos.indexOf(zocalo) + 1 < 10 ? "0" : "") +
                            (zocalos.indexOf(zocalo) + 1) +
                            " - " +
                            f1 +
                            " - " +
                            f2,
                    })
                );

            // console.log(fromApi);
            await getAllZocalos();
            await writeZocaloToFile(zocalos);
            onEdit = 0;
        } catch (error) {
            console.log(error);
        }
    }
    async function setOnAirZocalo(zocalo) {
        // let data = zocalos.find((zocalo) => zocalo.id == id);
        console.log(zocalo);
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
                body: JSON.stringify({ id: zocalo.id }),
            }).then((res) =>
                res.json().then(
                    showInfo({
                        type: "success",
                        text:
                            "AL AIRE EL ZOCALO N°: " +
                            (zocalos.indexOf(zocalo) + 1 < 10 ? "0" : "") +
                            (zocalos.indexOf(zocalo) + 1) +
                            " - " +
                            zocalo.f1 +
                            " - " +
                            zocalo.f2,
                    })
                )
            );

            //console.log("set on air return: ", fromApi);
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
                .then(
                    showInfo({
                        type: "secondary",
                        text: "ACTUALIZASTE EL ZOCALO AUXILIAR: " + f3,
                    })
                );

            console.log(
                "respuesta desde write Zocalo Dinamico to file",
                fromApi
            );
            await getZocaloDinamicoFromFile();
        } catch (error) {
            console.log(error);
        }
    }

    //Intervalo principal de Actualización
    setInterval(async function () {
        await getAllZocalos();
        await getZocaloDinamicoFromFile();
    }, 3000);

    onMount(async function () {
        await getAllZocalos();
        await getZocaloDinamicoFromFile();
    });
</script>

<!-- ****ZOCALOS**** -->
<!-- ****ZOCALO DINAMICO**** -->
<div class="container-fluid">
    <div class="row justify-content-center">
        <div class="col-12">
            <div class="card bg-secondary mt-1">
                <div class="card-header text-white">
                    <h1>ZOCALO AUXILIAR</h1>
                </div>

                <form
                    action=""
                    method="post"
                    class="row mb-1 gy-1 gx-1 align-items-center"
                >
                    <div class="col-auto">
                        <span class="badge badge-light">00</span>
                    </div>
                    <div class="col-7">
                        <!-- svelte-ignore a11y-autofocus -->
                        <input
                            id="f3text"
                            class="form-control form-floating form-control-sm"
                            type="text"
                            placeholder="Título Auxiliar"
                            bind:value={f3}
                            on:input={() => (zocaloDinamicoOnEdit = true)}
                            maxlength={f3Lenght}
                            autofocus
                        />
                    </div>

                    <div class="col-1">
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
    </div>
    <div class="col-12">
        <!-- ****AGREGAR NUEVO ZOCALO**** -->
        <div class="card bg-dark mt-1">
            <div class="card-header text-white">
                <h1>AGREGAR NUEVO ZOCALO</h1>
            </div>

            <form
                action=""
                method="post"
                class="row gb-1 gx-1 align-items-center mb-2"
            >
                <div class="col-auto">
                    <span class="badge badge-light">{zocalos.length + 1}</span>
                </div>
                <div class="col-4">
                    <!-- svelte-ignore a11y-autofocus -->
                    <input
                        class="form-control form-control-sm form-floating"
                        type="text"
                        placeholder="Título"
                        bind:value={f1}
                        maxlength={f1Lenght}
                        autofocus
                    />
                </div>

                <div class="col-5">
                    <input
                        class="form-control form-control-sm form-floating"
                        placeholder="Detalles"
                        type="text"
                        bind:value={f2}
                        maxlength={f2Lenght}
                    />
                </div>

                <div class="col-auto">
                    <button
                        class="btn btn-info btn-sm"
                        on:click|preventDefault={addZocalo(f1, f2)}
                    >
                        AGREGAR
                    </button>
                </div>
            </form>

            <!-- <div class="table-responsive-sm">
                <table class="table  table-striped table-dark table-sm">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Zocalos</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        {#each zocalos as zocalo, i}
                            <tr>
                                <td class="col-1">{i + 1}</td>
                                <td>
                                    <form
                                        class="row gy-1 gx-1 align-items-left"
                                        id="form{zocalo.id}"
                                    >
                                        <div class="col-5">
                                            <input
                                                id="f1text{zocalo.id}"
                                                on:input={() => (onEdit = zocalo.id)}
                                                class="form-control form-control-sm"
                                                type="text"
                                                name="f1"
                                                value={zocalo.f1}
                                                maxlength="60"
                                            />
            
                                        </div>
                                        <div class="col-5">
                                            <input
                                                id="f2text{zocalo.id}"
                                                on:input={() => (onEdit = zocalo.id)}
                                                class="form-control form-control-sm"
                                                type="text"
                                                name="f2"
                                                value={zocalo.f2}
                                                maxlength="70"
                                            />
                                        </div>
            
                                        <div class="col-auto">
                                            <button
                                                title="Eliminar"
                                                class="btn btn-danger btn-sm"
                                                disabled={zocalo.onAir}
                                                on:click|preventDefault={deleteZocalo(
                                                    zocalo
                                                )}
                                            >
                                                🗑
                                            </button>
                                        </div>
            
                                        <div class="col-auto">
                                            <button
                                            title="Guardar las modificaciones"
                                                type="submit"
                                                class="btn btn-primary btn-sm"
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
                                            title="Usar este Zocalo"
                                                on:click|preventDefault={setOnAirZocalo(
                                                    zocalo.id
                                                )}
                                                class={zocalo.onAir
                                                    ? "btn btn-danger btn-sm active"
                                                    : "btn btn-success btn-sm"}
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
            </div> -->
            <!-- ****LISTA DE ZOCALOS**** -->
            <div class="card-header text-white">
                <h1>LISTA DE ZOCALOS</h1>
            </div>
            <div>
                {#each zocalos as zocalo, i}
                    <form
                        class="row gy-1 gx-1 align-items-center mb-1"
                        id="form{zocalo.id}"
                    >
                        <div class="col-auto">
                            <span
                                class="badge badge-light {zocalo.onAir
                                    ? 'text-danger bg-white'
                                    : 'text-white'}"
                                >{i + 1 < 10 ? "0" : ""}{i + 1}</span
                            >
                        </div>
                        <div class="col-4">
                            <input
                                style={zocalo.onAir
                                    ? "background-color: rgb(255,225,225); border-color: rgb(255,0,0);"
                                    : ""}
                                class="form-control form-control-sm"
                                id="f1text{zocalo.id}"
                                on:input={() => (onEdit = zocalo.id)}
                                on:keypress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        updateZocalo(zocalo);
                                    }
                                }}
                                type="text"
                                name="f1"
                                value={zocalo.f1}
                                maxlength={f1Lenght}
                            />
                        </div>
                        <div class="col-5">
                            <input
                                style={zocalo.onAir
                                    ? "background-color: rgb(255,225,225); border-color: rgb(255,0,0);"
                                    : ""}
                                id="f2text{zocalo.id}"
                                on:input={() => (onEdit = zocalo.id)}
                                on:keypress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        updateZocalo(zocalo);
                                    }
                                }}
                                class="form-control form-control-sm"
                                type="text"
                                name="f2"
                                value={zocalo.f2}
                                maxlength={f2Lenght}
                            />
                        </div>
                        <div
                            class="btn-group col-auto justify-content-center"
                            role="group"
                        >
                            <button
                                title="Eliminar"
                                class="btn btn-danger btn-sm"
                                disabled={zocalo.onAir}
                                hidden={zocalo.id === onEdit ? true : false}
                                on:click|preventDefault={deleteZocalo(zocalo)}
                            >
                                🗑
                            </button>
                            <button
                                title="Guardar las modificaciones"
                                type="submit"
                                class="btn btn-primary btn-sm"
                                hidden={zocalo.id === onEdit ? false : true}
                                on:click|preventDefault={updateZocalo(zocalo)}
                            >
                                ✓
                            </button>

                            <button
                                title="Usar este Zocalo"
                                on:click|preventDefault={setOnAirZocalo(zocalo)}
                                class={zocalo.onAir
                                    ? "btn btn-danger btn-sm"
                                    : "btn btn-success btn-sm"}
                                disabled={zocalo.onAir && false}
                            >
                                {zocalo.onAir ? "AIRE" : "USAR"}
                                <span
                                    class={zocalo.onAir && zocalo.id
                                        ? "spinner-grow spinner-grow-sm"
                                        : ""}
                                />
                            </button>
                        </div>
                    </form>
                {/each}
            </div>
        </div>
    </div>
</div>
