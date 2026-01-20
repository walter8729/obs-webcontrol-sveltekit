import sqlite3 from 'sqlite3'

// Conexión a la base de datos
const db = new sqlite3.Database('./src/zocalos.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Crear tabla de programas si no existe
db.run(`CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0
)`, (err) => {
  if (!err) {
    // Asegurar que exista al menos un programa por defecto
    db.get("SELECT count(*) as count FROM programs", (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO programs (name, active) VALUES ('GENERAL', 1)", function (err) {
          if (!err) {
            const generalId = this.lastID;
            // Seed generic zocalos for GENERAL
            db.run("INSERT INTO zocalos (f1, f2, program_id) VALUES ('TITULO GENERAL', 'SUBTITULO GENERAL', ?)", [generalId]);
            db.run("INSERT INTO zocalos (f1, f2, program_id) VALUES ('OTRO TITULO', 'OTRO SUBTITULO', ?)", [generalId]);
            // Ensure 3 aux slots for GENERAL
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 1, ?)", [generalId]);
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 2, ?)", [generalId]);
            db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 3, ?)", [generalId]);
          }
        });
      }
    });
  }
});

// Crear tabla de zocalos si no existe
db.run(`CREATE TABLE IF NOT EXISTS zocalos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  f1 TEXT NOT NULL,
  f2 TEXT NOT NULL,
  onAir INTEGER NOT NULL DEFAULT 0,
  program_id INTEGER DEFAULT 1,
  FOREIGN KEY(program_id) REFERENCES programs(id)
)`);

// Migración: Agregar program_id a zocalos si no existe
db.run(`ALTER TABLE zocalos ADD COLUMN program_id INTEGER DEFAULT 1`, (err) => {
  // Si da error es porque probablemente ya existe
});

// Crear tabla de zocalos dinamicos si no existe (ahora por programa y slot)
db.run(`CREATE TABLE IF NOT EXISTS zocalosDinamicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  f3 TEXT NOT NULL,
  onAir INTEGER NOT NULL DEFAULT 0,
  program_id INTEGER DEFAULT 1,
  slot INTEGER DEFAULT 1,
  UNIQUE(program_id, slot),
  FOREIGN KEY(program_id) REFERENCES programs(id)
)`);

// Migración: Agregar program_id a zocalosDinamicos si no existe
db.run(`ALTER TABLE zocalosDinamicos ADD COLUMN program_id INTEGER DEFAULT 1`, (err) => { });
// Migración: Agregar slot a zocalosDinamicos si no existe
db.run(`ALTER TABLE zocalosDinamicos ADD COLUMN slot INTEGER DEFAULT 1`, (err) => { });

// Crear tabla de usuario si no existe
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL 
)`);



// FUNCIONES DE PROGRAMAS
export function getAllPrograms() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM programs', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

export function getActiveProgram() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM programs WHERE active = 1', (err, row) => {
      if (err) reject(err);
      resolve(row || { id: 1, name: 'GENERAL' });
    });
  });
}

export function addProgram(name) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO programs (name) VALUES (?)', [name], function (err) {
      if (err) reject(err);
      const programId = this.lastID;
      // Initialize 3 aux slots for the new program
      db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 1, ?)", [programId]);
      db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 2, ?)", [programId]);
      db.run("INSERT INTO zocalosDinamicos (f3, slot, program_id) VALUES ('', 3, ?)", [programId]);
      resolve(programId);
    });
  });
}

export function updateProgram(id, name) {
  return new Promise((resolve, reject) => {
    if (id === 1) return reject(new Error("Cannot rename GENERAL program"));
    db.run('UPDATE programs SET name = ? WHERE id = ?', [name, id], function (err) {
      if (err) reject(err);
      resolve(this.changes);
    });
  });
}

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

// FUNCIONES ZOCALOS F1 Y F2 (Ahora por Programa)

// Obtener todos los zocalos de la base de datos (Global)
export function getAllZocalosGlobal() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM zocalos', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

// Obtener todos los zocalos de un programa
export function getAllZocalos(programId = 1) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM zocalos WHERE program_id = ?', [programId], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

// Agregar un nuevo zocalo a un programa
export function addZocalo(zocalo) {
  console.log("DB addZocalo received:", zocalo);
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO zocalos (f1, f2, onAir, program_id) VALUES (?, ?, ?, ?)`,
      [zocalo.f1 || "", zocalo.f2 || "", zocalo.onAir ? 1 : 0, zocalo.program_id || 1], function (err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
  });
}

// Actualizar un zocalo existente
export function updateZocalo(zocalo) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE zocalos SET f1 = ?, f2 = ?, onAir = ? WHERE id = ?`,
      [zocalo.f1, zocalo.f2, zocalo.onAir ? 1 : 0, zocalo.id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
  });
}

// Marcar a zocalo como activo globalmente
export function setOnAirZocalo(id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Set ALL zocalos in system to 0
      db.run(`UPDATE zocalos SET onAir = 0`);
      // Set specific one to 1
      db.run(`UPDATE zocalos SET onAir = 1 WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });
  });
}

// Eliminar un zocalo existente
export function deleteZocalo(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM zocalos WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      resolve(this.changes);
    });
  });
}

// FUNCIONES ZOCALOS F3 (Dinamicos por Programa)

// Obtener todos los zocalos dinamicos (Global)
export function getAllZocalosDinamicosGlobal() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM zocalosDinamicos', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

export function getZocaloDinamico(programId = 1) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Ensure 3 slots exist
      [1, 2, 3].forEach(s => {
        db.run(`INSERT OR IGNORE INTO zocalosDinamicos (f3, onAir, program_id, slot) VALUES ('', 0, ?, ?)`, [programId, s]);
      });
      // Retrieve them
      db.all('SELECT * FROM zocalosDinamicos WHERE program_id = ? ORDER BY slot ASC', [programId], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  });
}

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

export function setOnAirAuxiliary(id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Set ALL aux in the entire system to 0
      db.run('UPDATE zocalosDinamicos SET onAir = 0');
      // Set specific one to 1
      db.run('UPDATE zocalosDinamicos SET onAir = 1 WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });
  });
}

// Agregar un nuevo usuario
export function addUser(user) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [user.username, user.password], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
}

// Obtener todos los users
export function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}

// Obtener user
export function getUser(username) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users WHERE username=?', [username], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
}
