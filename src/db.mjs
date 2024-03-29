import sqlite3 from 'sqlite3'

// Conexión a la base de datos
const db = new sqlite3.Database('./src/zocalos.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Crear tabla de zocalos si no existe
db.run(`CREATE TABLE IF NOT EXISTS zocalos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  f1 TEXT NOT NULL,
  f2 TEXT NOT NULL,
  onAir INTEGER NOT NULL DEFAULT 0
  
)`);

// Crear tabla de zocalos dinamicos si no existe
db.run(`CREATE TABLE IF NOT EXISTS zocalosDinamicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  f3 TEXT NOT NULL,
  onAir INTEGER NOT NULL DEFAULT 0
  
)`);

// Crear tabla de usuario si no existe
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL 
)`);



//FUNCIONES ZOCALOS F1 Y F2

// Obtener todos los zocalos
export function getAllZocalos() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM zocalos', (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
}


// Agregar un nuevo zocalo
export function addZocalo(zocalo) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO zocalos (f1, f2, onAir) VALUES (?, ?, ?)`, [zocalo.f1, zocalo.f2, zocalo.onAir], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
}

// Actualizar un zocalo existente
export function updateZocalo(zocalo) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE zocalos SET f1 = ?, f2 = ?, onAir = ? WHERE id = ?`, [zocalo.f1, zocalo.f2, zocalo.onAir, zocalo.id], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  });
}

// Marcar a zocalo como activo
export function setOnAirZocalo(id) {
  return new Promise((resolve, reject) => {
    //ponemos on false el onAir Actual
    db.run(`UPDATE zocalos SET onAir = ? WHERE onAir = ? `, [false, true], function (err) {
      if (err) {
        reject(err);
      }
    });
    //luego en true 
    db.run(`UPDATE zocalos SET onAir = ? WHERE id = ?`, [true, id], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  })
}

// Eliminar un zocalo existente
export function deleteZocalo(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM zocalos WHERE id = ?`, [id], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  });
}



//FUNCIONES ZOCALOS F3

// Obtener todos los zocalos
export function getAllZocalosDinamicos() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM zocalosDinamicos', (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
}


// Agregar un nuevo zocalo dinamico
export function addZocaloDinamico(zocaloDinamico) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO zocalosDinamicos (f3, onAir) VALUES (?, ?)`, [zocaloDinamico.f3, zocaloDinamico.onAir], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
}

// Actualizar un zocalo dinamico existente
export function updateZocaloDinamico(zocaloDinamico) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE zocalosDinamicos SET f3 = ?, onAir = ? WHERE id = ?`, [zocaloDinamico.f3, zocaloDinamico.onAir, zocaloDinamico.id], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  });
}

// Marcar a zocalo dinamico como activo
export function setOnAirZocaloDinamico(idZocaloDinamico) {
  return new Promise((resolve, reject) => {
    //ponemos on false el onAir Actual
    db.run(`UPDATE zocalosDinamicos SET onAir = ? WHERE onAir = ? `, [false, true], function (err) {
      if (err) {
        reject(err);
      }
    });
    //luego en true 
    db.run(`UPDATE zocalosDinamicos SET onAir = ? WHERE id = ?`, [true, idZocaloDinamico], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  })
}

// Eliminar un zocalo dinamico existente
export function deleteZocaloDinamico(idZocaloDinamico) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM zocalosDinamicos WHERE id = ?`, [idZocaloDinamico], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.changes);
    });
  });
}



// Agregar un nuevo usuario
export function addUser(user) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (user, password) VALUES (?, ?)`, [user.username, user.password], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
}


// Obtener todos los users
export function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
}


// Obtener user
export function getUser(username) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users WHERE username=?', [username], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
}