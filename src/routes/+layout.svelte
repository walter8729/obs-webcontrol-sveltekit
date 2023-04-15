<script>
  import "../app.scss";

  $: hora = "";

  setInterval(() => {
    // hora = new Date();
    hora = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "full",
      timeStyle: "full",
    }).format(new Date()).toLocaleUpperCase();
  }, 1000);
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark pb-md-2 sticky-top">
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
      <li class="nav-item ">
        <a class="nav-link" href="/settings">Settings</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/about">About</a>
      </li>
      <li class="nav-item">
        <a class="nav-link disabled" href="/">{hora}</a>
      </li>
    </ul>
  </div>
</nav>



<slot />
