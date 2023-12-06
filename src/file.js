//Manejar lectura y escritura de los zocalos como archivo

import { readFile, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs';

let f1 = '';
let f2 = '';
let f3 = '';


export async function readZocaloFromFile() {
    try {
        let f1 = readFileSync('src/f1.txt', 'utf8');
        let f2 = readFileSync('src/f2.txt', 'utf8');

        return { f1, f2 }
    } catch (error) {
        console.log('Ha ocurrido un error leyendo archivos ', error);
    }
}

export async function readZocaloDinamicoFromFile() {
    try {
        let f3 = readFileSync('src/f3.txt', 'utf8');
        return { f3 }
    } catch (err) {
        console.log('Ha ocurrido un error leyendo archivos ', err);
    }
}

export async function writeZocaloToFile(zocalos) {

    let zocalo = zocalos.find((zocalo) => zocalo.onAir == true);
    // console.log(zocalo);

    if (zocalo) {
        writeFile('src/f1.txt', zocalo.f1, (err, data) => {
            try {
                console.log("Se escribio f1:", zocalo.f1);
            } catch {
                return err;
            }
        });
        writeFile('src/f2.txt', zocalo.f2, (err, data) => {
            try {

                console.log("Se escribio f2:", zocalo.f2);
            } catch {
                return err;
            }
        });
        return zocalo;
    }

};

export async function writeZocaloDinamicoToFile(textoDinamico) {
    writeFile('src/f3.txt', textoDinamico, (err, data) => {
        try {
            console.log("Se escribio f3:", textoDinamico);
        } catch {
            return err;
        }
    });
    return { f3: textoDinamico }

};







