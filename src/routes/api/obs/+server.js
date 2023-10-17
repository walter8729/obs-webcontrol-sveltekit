import { obs, sendCommand } from '../../../obs';
import { error } from '@sveltejs/kit';

const address = 'ws://192.168.1.154:4455';
const password = '000000';

let errorMessage = '';
let connected;
let scenes = [];
let programScene = {};
let previewScene = {};
let programSceneItemList = {};
let isStudioMode;


async function connect() {
    //   firts we need to disconect
    console.log('Disconnecting old conection...');
    await disconnect();

    console.log('Connecting to:', address, '- using password:', password);
    //get object with vercion and rpcVersion
    try {
        const { obsWebSocketVersion, negotiatedRpcVersion } = await obs.connect(
            address,
            password
        );
        console.log(
            `Connected to obs-websocket version ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
        );
        //actualizamos coneccion
        connected = true;
        //if error
    } catch (e) {
        console.log(e);
        errorMessage = e.message;
    }
}

async function disconnect() {
    await obs.disconnect();
    connected = false;
    errorMessage = 'Disconnected';
}


///lets handle events
obs.on('ConnectionClosed', () => {
    connected = false;
    console.log('Connection closed');
});

obs.on('Identified', async () => {
    console.log('Connected');
    connected = true;
});


obs.on('SceneListChanged', async (data) => {
    console.log('SceneListChanged', data.scenes.length)
    await getSceneList();
    await getSceneItemList();
})

obs.on('SceneCreated', async (data) => {
    console.log('SceneCreated', data)
    await getSceneList();
    await getSceneItemList();
})

obs.on('SceneRemoved', async (data) => {
    console.log('SceneRemoved', data)
    await getSceneList();
    await getSceneItemList();
})

obs.on('SceneNameChanged', async (data) => {
    console.log('SceneNameChanged', data)
    await getSceneList();
    await getSceneItemList();
})

obs.on('CurrentProgramSceneChanged', async (data) => {
    console.log('CurrentProgramSceneChanged', data)
    await getSceneList();
    await getSceneItemList();
})

obs.on('CurrentPreviewSceneChanged', async (data) => {
    console.log('CurrentPreviewSceneChanged', data)
    await getSceneList();
    await getSceneItemList();
})

obs.on('SceneItemEnableStateChanged', async (data) => {
    console.log("algun item ha sido cambiado", data);
    await getSceneList();
    await getSceneItemList();
})

obs.on('SceneListChanged', async (data) => {
    console.log('SceneListChanged', data);
    await getSceneList();
    await getSceneItemList();
})

// metodos para obtener datos
async function getSceneList() {
    try {
        //obtenemos la lista de scenas
        let data = await sendCommand('GetSceneList')
        // cconsole.log('GetSceneList', data);
        programScene = data.currentProgramSceneName || '';
        previewScene = data.currentPreviewSceneName;
        //lo guardamos invertido
        scenes = data.scenes.slice().reverse();
    } catch (e) {
        console.log(e);
        errorMessage = e.message;
    }
}

async function getSceneItemList() {
    try {
        //obtener lista de item de la escena actual
        let data = await sendCommand('GetSceneItemList', { sceneName: programScene });
        //guardamos la lista invertida
        programSceneItemList = data.sceneItems.slice().reverse();
        // console.log('estos son los items del program actual ', programSceneItemList);
    } catch (e) {
        console.log(e);
        errorMessage = e.message;
    }
}

/**
 * 
 * @param {string} sceneName Nombre de la escena 
 * @param {string} sourceName Nombre del source en la escena 
 * @param {boolean} enable true para activar y false para desactiva
 */
async function switchSceneItem(sceneName, sceneItemId, enable) {

    await sendCommand(`SetSceneItemEnabled`, {
        sceneName,
        sceneItemId,
        sceneItemEnabled: !enable
    })

}

async function switchScene(sceneName) {

    await sendCommand('SetCurrentProgramScene', { sceneName })

}



//llamar a los demonios
await connect();
await getSceneList();
await getSceneItemList();


// export async function GET({ request, url }) 

export const GET = async ({ request, url }) => {

    const authHeader = request.headers.get('Authorization');

    if (authHeader !== '') {
        // console.log("la cabecera de auntenticacion es ", authHeader);
    }

    const parameter = url.searchParams.get('get');

    switch (parameter) {
        case 'connected':
            return new Response(JSON.stringify(connected));

        case 'scenes':
            return new Response(JSON.stringify(scenes));

        case 'programScene':
            return new Response(JSON.stringify(programScene));

        case 'previewScene':
            return new Response(JSON.stringify(previewScene));

        case 'programSceneItemList':
            return new Response(JSON.stringify(programSceneItemList));

        default:
            return new Response(JSON.stringify("Not get"));
    }
}

export const POST = async ({ request, url }) => {

    const body = await request.json();
    console.log(body);
    let postFunction = body.postFunction;
    console.log(postFunction);


    switch (postFunction) {
        case 'toggleSceneItem':
            switchSceneItem(body.sceneName, body.sceneItemId, body.enable)
            return new Response(JSON.stringify(body));
        case 'switchScene':
            switchScene(body.sceneName)
            return new Response(JSON.stringify(body));
        default:
            return new Response(JSON.stringify("operacion no admitida"));
    }

}