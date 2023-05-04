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
                                    Programa sencillo para
                                    controlar graficos de Obs Studio.
                                </h4>
                                <hr />
                                <p class="small mb-0">
                                    En la izquierda apareceran 
                                    Una Pantalla de preview un selector de escenas
                                    y un switcher de los elementos de la escena.
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Por seguridad se apagaran todos items de la 
                                    escena actual antes de cambiar a la siguiente.
                                </p>
                                <br />
                                
                                <p class="small mb-0">
                                    Tambien se cuenta con un boton que 
                                    apagara todos los items de la escena
                                </p>
                                <br />
                                <p class="small mb-0">
                                    Hacia el lado derecho se tiene el editor
                                    de los textos de los zocalos, ademas de
                                    botones que permitiran borrar, editar(aparece cuando se edita) 
                                    y para setear uso en el zocalo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>