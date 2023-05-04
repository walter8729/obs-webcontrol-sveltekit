<script>
  export let data;
  import "../app.scss";
  let user = "desconocido";

  $: hora = "";

  setInterval(() => {
    // hora = new Date();
    hora = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
      timeStyle: "medium",
    })
      .format(new Date())
      .toLocaleUpperCase();
  }, 1000);
</script>

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
          <a class="nav-link" href="/settings">Settings</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/about">About</a>
        </li>
        <li class="nav-item">
          <a class="nav-link disabled" href="/">{hora}</a>
        </li>
        <span class="navbar-text">
          Hola {user}
        </span>
      </ul>
    </div>
  </div>
</nav>

<slot /> 