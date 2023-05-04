<script>
    // import { PUBLIC_OBS_ADDRESS, PUBLIC_OBS_PASSWORD } from '$env/static/public';
    export const obsAddress = "";
</script>

<div class="container">
    <div class="row">
        <div class="col-6">
            <form class="bg-light">
                <div class="m-3 pt-2">
                    <label for="obsUrl" class="form-label">OBS URL</label>
                    <input
                        type="url"
                        class="form-control"
                        id="obsUrl"
                        aria-describedby="urlHelp"
                    />
                    <div id="urlHelp" class="form-text">
                        Ejemplo: "ws://192.168.1.150:4455"
                    </div>
                </div>
                <div class="m-3">
                    <label for="obsPassword" class="form-label">OBS Password</label>
                    <input
                        type="password"
                        class="form-control"
                        id="obsPassword"
                    />
                </div>
                <button type="submit" class="btn btn-primary m-3">Guardar</button>
            </form>
        </div>
        <div class="col-6">
            <form class="bg-light">
                <div class="m-3 pt-2">
                    <label for="apiUrl" class="form-label">API URL</label>
                    <input
                        type="url"
                        class="form-control"
                        id="apiUrl"
                        aria-describedby="urlHelp"
                    />
                    <div id="urlHelp" class="form-text">
                        Ejemplo: "http://192.168.1.150/api/zocalo"
                    </div>
                </div>
                <div class="m-3">
                    <label for="apiKey" class="form-label">API KEY</label>
                    <input
                        type="text"
                        class="form-control"
                        id="apiKey"
                    />
                </div>
                <button type="submit" class="btn btn-primary m-3">Guardar</button>
            </form>
        </div>
    </div>
</div>

