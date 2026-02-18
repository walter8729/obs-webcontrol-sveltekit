<script>
    /**
     * @file LoginPortal.svelte
     * @description Pantalla de inicio de sesión de la aplicación.
     * Gestiona la validación de credenciales (demo por ahora) y muestra
     * información introductoria sobre las capacidades del sistema.
     */

    import { invalidateAll } from "$app/navigation";

    let userName = "";
    let userPassword = "";

    /**
     * Valida las credenciales contra el servidor.
     */
    async function login() {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: userName,
                password: userPassword,
            }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            await invalidateAll();
        } else {
            alert(data.message || "Credenciales incorrectas");
        }
    }
</script>

<section class="h-100 gradient-form" style="background-color: #121212;">
    <div class="container py-5 h-100">
        <div class="row d-flex justify-content-center align-items-center h-100">
            <div class="col-xl-10">
                <div class="card rounded-3 text-black shadow-lg border-0">
                    <div class="row g-0">
                        <!-- Columna de Formulario -->
                        <div class="col-lg-6 bg-white">
                            <div class="card-body p-md-5 mx-md-4">
                                <div class="text-center">
                                    <!-- Importante: En producción, usar una imagen local -->
                                    <h2
                                        class="mt-1 mb-5 pb-1 fw-bold text-dark"
                                    >
                                        OBS CONTROL <span class="text-primary"
                                            >WEB</span
                                        >
                                    </h2>
                                </div>

                                <form on:submit|preventDefault={login}>
                                    <p class="text-muted mb-4 small">
                                        Por favor, ingresa a tu cuenta
                                    </p>

                                    <div class="form-outline mb-4">
                                        <label
                                            class="form-label fw-bold small"
                                            for="userNameInput">Usuario</label
                                        >
                                        <input
                                            type="text"
                                            id="userNameInput"
                                            class="form-control"
                                            placeholder="Ingresa usuario"
                                            bind:value={userName}
                                            required
                                        />
                                    </div>

                                    <div class="form-outline mb-4">
                                        <label
                                            class="form-label fw-bold small"
                                            for="passwordInput"
                                            >Contraseña</label
                                        >
                                        <input
                                            type="password"
                                            id="passwordInput"
                                            class="form-control"
                                            placeholder="Ingresa contraseña"
                                            bind:value={userPassword}
                                            required
                                        />
                                    </div>

                                    <div
                                        class="text-center pt-1 mb-5 pb-1 d-grid"
                                    >
                                        <button
                                            class="btn btn-primary gradient-custom-2 mb-3 fw-bold py-2"
                                            type="submit">INICIAR SESIÓN</button
                                        >
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- Columna Informativa -->
                        <div
                            class="col-lg-6 d-flex align-items-center bg-dark text-white rounded-end"
                        >
                            <div class="px-3 py-4 p-md-5 mx-md-4">
                                <h4 class="mb-4 fw-bold">
                                    Gestión Profesional de Gráficos y Playout
                                </h4>
                                <hr class="border-secondary opacity-50" />
                                <div class="small-info">
                                    <p class="mb-3">
                                        <i class="bi bi-display me-2 text-info"
                                        ></i>
                                        Control de escenas y previsualización en
                                        tiempo real.
                                    </p>
                                    <p class="mb-3">
                                        <i
                                            class="bi bi-input-cursor-text me-2 text-info"
                                        ></i>
                                        Editor dinámico de zócalos F1, F2 y auxiliares
                                        F3.
                                    </p>
                                    <p class="mb-3">
                                        <i
                                            class="bi bi-play-circle me-2 text-info"
                                        ></i>
                                        Sistema de playout completo con lista de
                                        reproducción y control de velocidad.
                                    </p>
                                    <p class="mb-0 text-white-50 mt-4 italic">
                                        * Diseñado para funcionamiento offline
                                        en red local.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .gradient-custom-2 {
        background: linear-gradient(
            to right,
            #ee7724,
            #d8363a,
            #dd3675,
            #b44593
        );
        border: none;
    }
    .card {
        overflow: hidden;
    }
    .small-info p {
        font-size: 0.9rem;
        line-height: 1.6;
    }
</style>
