// import { Router } from 'express';
import { getAllZocalos, addZocalo, updateZocalo, deleteZocalo, setOnAirZocalo } from '../../../db.mjs';
import { writeZocaloToFile, writeZocaloDinamicoToFile, readZocaloFromFile, readZocaloDinamicoFromFile } from '../../../file.js'
// const router = Router();

// // Obtener todos los zocalos

export const GET = async ({ request, url }) => {

    const authHeader = request.headers.get('Authorization');

    if (authHeader !== '') {
        // console.log("la cabecera de auntenticacion es ", authHeader);
    }

    const parameter = url.searchParams.get('get');
    // console.log(parameter);

    switch (parameter) {
        case 'getAllZocalos':
            return new Response(JSON.stringify(await getAllZocalos()), { "status": 200 });
        case 'getZocaloDinamicoFromFile':
            return new Response(JSON.stringify(await readZocaloDinamicoFromFile()), { "status": 200 });

        default:
            return new Response(JSON.stringify("Not get"));
    }
}

export const POST = async ({ request, url }) => {

    const body = await request.json();
    // console.log(body);
    let postFunction = url.searchParams.get('set');
    console.log(postFunction);


    switch (postFunction) {
        case 'addZocalo':
            let addZocaloRes = await addZocalo(body)
            console.log("Respuesta addZocalo from DB ", addZocaloRes);
            return new Response(JSON.stringify(addZocaloRes), { status: 200 });
        default:
            return new Response(JSON.stringify("operacion no admitida"), { status: 400 });
    }

}

export const PUT = async ({ request, url }) => {

    const body = await request.json();
    let postFunction = url.searchParams.get('set');
    console.log(postFunction);


    switch (postFunction) {
        case 'onAir':
            let onAirDbResponse = await setOnAirZocalo(body.id);
            console.log("Respuesta onAir from DB ", onAirDbResponse);
            return new Response(JSON.stringify(onAirDbResponse), { status: 200 });
        case 'updateZocalo':
            let updateDbResponse = await updateZocalo(body);
            console.log("Respuesta updateZocalo from DB ", updateDbResponse);
            return new Response(JSON.stringify(updateDbResponse), { status: 200 });
        case 'writeZocaloToFile':
            // await writeZocaloToFile(body);
            // console.log("Zocalo escrito en fichero ", body);
            return new Response(JSON.stringify(await writeZocaloToFile(body)), { status: 200 });
        case 'writeZocaloDinamicoToFile':
            // await writeZocaloDinamicoToFile(body);
            // console.log("Zocalo escrito en fichero ", body);
            return new Response(JSON.stringify(await writeZocaloDinamicoToFile(body)), { status: 200 });
        default:
            return new Response(JSON.stringify("operacion no admitida"), { status: 400 });
    }


}

export const DELETE = async ({ request, url }) => {
    const body = await request.json();
    let postFunction = url.searchParams.get('set');
    console.log(postFunction);

    switch (postFunction) {
        case 'deleteZocalo':
            let res = deleteZocalo(body.id)
            return new Response(JSON.stringify(res), { "status": 200 });
        default:
            return new Response(JSON.stringify("operacion no admitida"), { "status": 301 });
    }

}






