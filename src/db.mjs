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

    db.get(`SELECT COUNT(*) AS onAirCount FROM zocalos WHERE onAir = ? `, [true], (err, row) => {
      if (row.onAirCount > 0) {
        // console.log('ya hay zocalos en el aire');
        db.run(`UPDATE zocalos SET onAir = ?`, [0], function (err) {
          if (err) {
            reject(err);
          }
        });
        db.run(`UPDATE zocalos SET onAir = ? WHERE id = ?`, [1, id], function (err) {
          if (err) {
            reject(err);
          }
          resolve(this.changes);
        });
      } else {
        db.run(`UPDATE zocalos SET onAir = ? WHERE id = ?`, [1, id], function (err) {
          if (err) {
            reject(err);
          }
          resolve(this.changes);
        });
      }
    })
  })
}

// Eliminar un contacto existente
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