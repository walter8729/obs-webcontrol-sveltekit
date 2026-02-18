<script>
  /**
   * Layout principal de la aplicación.
   * Se encarga de la navegación global, el estado de la conexión OBS
   * y la visualización de la hora actual.
   */
  import "../app.scss";
  import { onMount } from "svelte";
  import { initWebSocket, obsConnected } from "$lib/stores/obs.js";
  import { invalidateAll } from "$app/navigation";

  /** @type {import('./$types').LayoutData} */
  export let data;

  /** @type {string} Cadena formateada con la fecha y hora actual */
  let hora = "";

  // Intervalo para actualizar la hora cada segundo
  setInterval(() => {
    hora = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "medium",
    })
      .format(new Date())
      .toLocaleUpperCase();
  }, 1000);

  onMount(async () => {
    // Importar Bootstrap JS de forma dinámica para soporte offline total (solo cliente)
    await import("bootstrap/dist/js/bootstrap.bundle.min.js");
    initWebSocket();
  });

  async function logout() {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) {
      await invalidateAll();
    }
  }
</script>

{#if data.user}
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark pb-md-2">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">Obs Control MasTv</a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarItems"
        aria-controls="#navbarItems"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <div class="collapse navbar-collapse" id="navbarItems">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <a class="nav-link" href="/zocalos">Zocalos</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/playout">Playout</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/programs">Programas</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/settings">Settings</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/admin/users">Usuarios</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/about">About</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="/">{hora}</a>
          </li>
        </ul>
        <div class="d-flex align-items-center gap-3">
          {#if data.user}
            <span class="navbar-text text-info fw-bold">
              <i class="bi bi-person-circle me-1"></i> Hola {data.user.username}
            </span>
            <button class="btn btn-outline-danger btn-sm" on:click={logout}>
              <i class="bi bi-box-arrow-right me-1"></i> SALIR
            </button>
          {/if}
        </div>
      </div>
    </div>
  </nav>
{/if}

<slot />
