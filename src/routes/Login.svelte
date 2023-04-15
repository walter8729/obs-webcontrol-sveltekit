<script>
    export let userName;
    export let userPassword;
    export let logged;

        function login() {
        console.log(logged);
        if (userName === `demo` && userPassword === `demo`) {
            logged = true;
            console.log(`ahora estas `, logged);
        }
    }

</script>

<section class="h-100 gradient-form" style="background-color: #eee;">
    <div class="container py-5 h-100">
        <div
            class="row d-flex justify-content-center align-items-center h-100"
        >
            <div class="col-xl-10">
                <div class="card rounded-3 text-black">
                    <div class="row g-0">
                        <div class="col-lg-6">
                            <div class="card-body p-md-5 mx-md-4">
                                <div class="text-center">
                                    <img
                                        src="../logomastv.png"
                                        style="width: 250px;"
                                        alt="logo"
                                    />
                                    <h4 class="mt-1 mb-5 pb-1">
                                        OBS STUDIO Web Control Mas Tv Canal
                                        51
                                    </h4>
                                </div>

                                <form>
                                    <div class="form-outline mb-4">
                                        <input
                                            type="email"
                                            id="userNameInput"
                                            class="form-control"
                                            placeholder="Tu nombre de usuario"
                                            bind:value={userName}
                                        />
                                        <label
                                            class="form-label"
                                            for="userNameInput"
                                            >Username</label
                                        >
                                    </div>

                                    <div class="form-outline mb-4">
                                        <input
                                            type="password"
                                            id="passwordInput"
                                            class="form-control"
                                            placeholder="Tu password"
                                            bind:value={userPassword}
                                        />
                                        <label
                                            class="form-label"
                                            for="passwordInput"
                                            >Password</label
                                        >
                                    </div>

                                    <div class="text-center pt-1 mb-5 pb-1">
                                        <button
                                            class="btn btn-primary btn-block fa-lg gradient-custom-2 mb-3"
                                            type="button"
                                            on:click|preventDefault={login}
                                            >Log in</button
                                        >
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div
                            class="col-lg-6 d-flex align-items-center bg-dark"
                        >
                            <div
                                class="text-white px-3 py-4 p-md-5 mx-md-4"
                            >
                                <h4 class="mb-4">
                                    Programa sencillo y eficiente para
                                    controlar graficos de Obs Studio.
                                </h4>
                                <hr />
                                <p class="small mb-0">
                                    En la izquierda apareceran controles de
                                    seleccion de escenas.
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Por segurida se apagaran todos items de
                                    la actual escena antes de cambiar a la
                                    siguiente.
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Al centro se tiene una pantalla con el
                                    preview de la Pantalla.
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Abajo botones para cada item grafico y
                                    un boton para apagar a todos.
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Hacia el lado derecho se tiene el edito
                                    de los textos de los zocalos, ademas de
                                    botones que permitiran editar, meter o
                                    sacar del aire dicho texto.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>