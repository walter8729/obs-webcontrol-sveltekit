import sqlite3 from 'sqlite3';

/**
 * @file db.js
 * @description Módulo de gestión de la base de datos SQLite para el sistema de control de OBS.
 * Administra programas, zócalos, usuarios y configuraciones de playout.
 */

// Inicialización de la conexión a la base de datos
// La base de datos se almacena localmente en ./src/zocalos.db
const db = new sqlite3.Database('./src/zocalos.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite con éxito.');
    }
});

/**
 * Inicialización de las tablas de la base de datos.
 * Se ejecutan al importar el módulo por primera vez.
 */
db.serialize(() => {
    // Tabla de PROGRAMAS: Define los diferentes shows o bloques de programación
    db.run(`CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 0
  )`, (err) => {
        if (!err) {
            // Garantizar que siempre exista al menos el programa 'GENERAL'
            db.get("SELECT count(*) as count FROM programs", (err, row) => {
                if (row && row.count === 0) {
                    db.run("INSERT INTO programs (name, active) VALUES ('GENERAL', 1)", function (err) {
                        if (!err) {
                            const generalId = this.lastID;
                            // Datos iniciales para el programa GENERAL
                            db.run("INSERT INTO zocalos (f1, f2, program_id) VALUES ('TITULO GENERAL', 'SUBTITULO GENERAL', ?)", [generalId]);
                            db.run("INSERT INTO zocalos (f1, f2, program_id) VALUES ('OTRO TITULO', 'OTRO SUBTITULO', ?)", [generalId]);
                            // 3 slots auxiliares para GENERAL
                            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 1, ?)", [generalId]);
                            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 2, ?)", [generalId]);
                            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 3, ?)", [generalId]);
                        }
                    });
                }
            });
        }
    });

    // Tabla de ZOCALOS: Almacena los textos de los zócalos (Lower Thirds) F1 y F2
    db.run(`CREATE TABLE IF NOT EXISTS zocalos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    f1 TEXT NOT NULL,
    f2 TEXT NOT NULL,
    onAir INTEGER NOT NULL DEFAULT 0,
    program_id INTEGER DEFAULT 1,
    FOREIGN KEY(program_id) REFERENCES programs(id)
  )`);

    // Intentar agregar la columna program_id a zocalos por si no existe (migración simple)
    db.run(`ALTER TABLE zocalos ADD COLUMN program_id INTEGER DEFAULT 1`, (err) => { /* Ignorar si ya existe */ });

    // Tabla de ZOCALOS DINAMICOS: Almacena los auxiliares F3 organizados por programa y slot
    db.run(`CREATE TABLE IF NOT EXISTS zocalosDinamicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    f3 TEXT NOT NULL,
    onAir INTEGER NOT NULL DEFAULT 0,
    program_id INTEGER DEFAULT 1,
    slot INTEGER DEFAULT 1,
    UNIQUE(program_id, slot),
    FOREIGN KEY(program_id) REFERENCES programs(id)
  )`);

    // Migraciones para zocalosDinamicos
    db.run(`ALTER TABLE zocalosDinamicos ADD COLUMN program_id INTEGER DEFAULT 1`, (err) => { });
    db.run(`ALTER TABLE zocalosDinamicos ADD COLUMN slot INTEGER DEFAULT 1`, (err) => { });

    // --- TABLAS DEL SISTEMA DE PLAYOUT ---

    // Tabla de PLAYLIST: Lista de archivos multimedia para reproducción
    db.run(`CREATE TABLE IF NOT EXISTS playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle', -- Estados: 'idle', 'playing', 'next'
    sort_order INTEGER DEFAULT 0
  )`);

    // Tabla de PLAYOUT_SETTINGS: Configuraciones globales del sistema de reproducción
    db.run(`CREATE TABLE IF NOT EXISTS playout_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`, (err) => {
        if (!err) {
            // Valores por defecto para el playout
            const defaults = {
                'autoNext': 'true',
                'loopList': 'true',
                'loopFile': 'false',
                'stopAfterCurrent': 'false',
                'speed': '100',
                'loopABActive': 'false',
                'loopABStart': '0',
                'loopABEnd': '0'
            };
            Object.entries(defaults).forEach(([key, val]) => {
                db.run('INSERT OR IGNORE INTO playout_settings (key, value) VALUES (?, ?)', [key, val]);
            });
        }
    });

    // Tabla de USUARIOS: Para control de acceso básico
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL 
  )`);
});

// --- FUNCIONES DE GESTIÓN DE PROGRAMAS ---

/**
 * Obtiene todos los programas registrados.
 * @returns {Promise<Array>} Lista de objetos de programa.
 */
export function getAllPrograms() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM programs', (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

/**
 * Obtiene el programa marcado como activo.
 * @returns {Promise<Object>} El programa activo o el objeto por defecto 'GENERAL'.
 */
export function getActiveProgram() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM programs WHERE active = 1', (err, row) => {
            if (err) reject(err);
            resolve(row || { id: 1, name: 'GENERAL' });
        });
    });
}

/**
 * Crea un nuevo programa e inicializa sus slots auxiliares.
 * @param {string} name Nombre del programa.
 * @returns {Promise<number>} El ID del programa creado.
 */
export function addProgram(name) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO programs (name) VALUES (?)', [name], function (err) {
            if (err) reject(err);
            const programId = this.lastID;
            // Inicializar slots auxiliares para el nuevo programa
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 1, ?)", [programId]);
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 2, ?)", [programId]);
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 3, ?)", [programId]);
            resolve(programId);
        });
    });
}

/**
 * Actualiza el nombre de un programa.
 * @param {number} id ID del programa.
 * @param {string} name Nuevo nombre.
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
export function updateProgram(id, name) {
    return new Promise((resolve, reject) => {
        if (id === 1) return reject(new Error("No se puede renombrar el programa GENERAL"));
        db.run('UPDATE programs SET name = ? WHERE id = ?', [name, id], function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

/**
 * Establece un programa como el activo en el sistema.
 * @param {number} id ID del programa.
 */
export function setActiveProgram(id) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('UPDATE programs SET active = 0');
            db.run('UPDATE programs SET active = 1 WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    });
}

/**
 * Elimina un programa y sus zócalos asociados.
 * @param {number} id ID del programa a eliminar.
 */
export function deleteProgram(id) {
    return new Promise((resolve, reject) => {
        if (id === 1) return reject(new Error("No se puede eliminar el programa GENERAL"));
        db.serialize(() => {
            db.run('DELETE FROM zocalos WHERE program_id = ?', [id]);
            db.run('DELETE FROM zocalosDinamicos WHERE program_id = ?', [id]);
            db.run('DELETE FROM programs WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    });
}

// --- FUNCIONES DE GESTIÓN DE ZÓCALOS ---

/**
 * Obtiene todos los zócalos registrados en el sistema (todos los programas).
 * @returns {Promise<Array>}
 */
export function getAllZocalosGlobal() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM zocalos', (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

/**
 * Obtiene los zócalos de un programa específico.
 * @param {number} programId ID del programa.
 */
export function getAllZocalos(programId = 1) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM zocalos WHERE program_id = ?', [programId], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

/**
 * Agrega un nuevo registro de zócalo.
 * @param {Object} zocalo Datos del zócalo (f1, f2, program_id).
 */
export function addZocalo(zocalo) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO zocalos (f1, f2, onAir, program_id) VALUES (?, ?, ?, ?)`,
            [zocalo.f1 || "", zocalo.f2 || "", zocalo.onAir ? 1 : 0, zocalo.program_id || 1], function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
    });
}

/**
 * Actualiza los datos de un zócalo existente.
 */
export function updateZocalo(zocalo) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE zocalos SET f1 = ?, f2 = ?, onAir = ? WHERE id = ?`,
            [zocalo.f1, zocalo.f2, zocalo.onAir ? 1 : 0, zocalo.id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
    });
}

/**
 * Activa un zócalo en pantalla y desactiva el resto globalmente.
 * @param {number} id ID del zócalo.
 */
export function setOnAirZocalo(id) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`UPDATE zocalos SET onAir = 0`);
            db.run(`UPDATE zocalos SET onAir = 1 WHERE id = ?`, [id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    });
}

/**
 * Elimina un zócalo.
 */
export function deleteZocalo(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM zocalos WHERE id = ?`, [id], function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

// --- FUNCIONES DE ZÓCALOS DINÁMICOS (AUXILIARES F3) ---

/**
 * Obtiene todos los auxiliares del sistema.
 */
export function getAllZocalosDinamicosGlobal() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM zocalosDinamicos', (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

/**
 * Obtiene los auxiliares de un programa, asegurando que existan 3 slots.
 */
export function getZocaloDinamico(programId = 1) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            [1, 2, 3].forEach(s => {
                db.run(`INSERT OR IGNORE INTO zocalosDinamicos (f3, onAir, program_id, slot) VALUES ('', 0, ?, ?)`, [programId, s]);
            });
            db.all('SELECT * FROM zocalosDinamicos WHERE program_id = ? ORDER BY slot ASC', [programId], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    });
}

/**
 * Actualiza el contenido de un auxiliar (F3).
 */
export function updateZocaloDinamico(programId, f3, slot = 1) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM zocalosDinamicos WHERE program_id = ? AND slot = ?', [programId, slot], (err, row) => {
            if (row) {
                db.run('UPDATE zocalosDinamicos SET f3 = ? WHERE program_id = ? AND slot = ?', [f3, programId, slot], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            } else {
                db.run('INSERT INTO zocalosDinamicos (f3, program_id, slot) VALUES (?, ?, ?)', [f3, programId, slot], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            }
        });
    });
}

/**
 * Pone un auxiliar al aire y desactiva los demás.
 */
export function setOnAirAuxiliary(id) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('UPDATE zocalosDinamicos SET onAir = 0');
            db.run('UPDATE zocalosDinamicos SET onAir = 1 WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    });
}

// --- FUNCIONES DE USUARIOS ---

export function addUser(user) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [user.username, user.password], function (err) {
            if (err) reject(err);
            resolve(this.lastID);
        });
    });
}

export function getAllUsers() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

export function getUser(username) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users WHERE username=?', [username], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

// --- FUNCIONES DEL SISTEMA DE PLAYOUT ---

/**
 * Obtiene la lista de reproducción ordenada.
 */
export function getPlaylist() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM playlist ORDER BY sort_order ASC', (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
        });
    });
}

/**
 * Agrega un elemento a la lista de reproducción con el siguiente orden disponible.
 */
export function addToPlaylist(item) {
    return new Promise((resolve, reject) => {
        db.get('SELECT MAX(sort_order) as maxOrder FROM playlist', (err, row) => {
            const nextOrder = (row?.maxOrder || 0) + 1;
            db.run('INSERT INTO playlist (name, path, duration, sort_order) VALUES (?, ?, ?, ?)',
                [item.name, item.path, item.duration || 0, nextOrder], function (err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
        });
    });
}

/**
 * Elimina un elemento de la lista por ID.
 */
export function removeFromPlaylist(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM playlist WHERE id = ?', [id], function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

/**
 * Vacía la lista de reproducción.
 */
export function clearPlaylist() {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM playlist', function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

/**
 * Actualiza el orden de clasificación de un elemento.
 */
export function updatePlaylistSortOrder(id, order) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE playlist SET sort_order = ? WHERE id = ?', [order, id], function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

/**
 * Actualiza el estado de un elemento (playing, next, idle).
 * Garantiza que solo un elemento tenga el estado 'playing' o 'next'.
 */
export function updatePlaylistItemStatus(id, status) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            if (status === 'playing') {
                db.run("UPDATE playlist SET status = 'idle' WHERE status = 'playing'");
            } else if (status === 'next') {
                db.run("UPDATE playlist SET status = 'idle' WHERE status = 'next'");
            }
            db.run('UPDATE playlist SET status = ? WHERE id = ?', [status, id], function (err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    });
}

/**
 * Pone todos los elementos de la lista en modo de espera.
 */
export function setAllItemsIdle() {
    return new Promise((resolve, reject) => {
        db.run("UPDATE playlist SET status = 'idle'", function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}

/**
 * Obtiene todas las configuraciones de playout como un objeto clave-valor.
 */
export function getPlayoutSettings() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM playout_settings', (err, rows) => {
            if (err) reject(err);
            const settings = {};
            rows?.forEach(row => {
                settings[row.key] = row.value === 'true' ? true : (row.value === 'false' ? false : row.value);
            });
            resolve(settings);
        });
    });
}

/**
 * Actualiza o inserta una configuración de playout.
 */
export function updatePlayoutSetting(key, value) {
    return new Promise((resolve, reject) => {
        const valStr = typeof value === 'boolean' ? String(value) : String(value);
        db.run('INSERT OR REPLACE INTO playout_settings (key, value) VALUES (?, ?)', [key, valStr], function (err) {
            if (err) reject(err);
            resolve(this.changes);
        });
    });
}
