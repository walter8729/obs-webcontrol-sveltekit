# OBS Web Control - SvelteKit

Una potente herramienta de control remoto para OBS Studio construida con SvelteKit, diseñada para simplificar la gestión de zócalos (CG) y escenas en entornos de producción en vivo.

## 📋 Tabla de Contenidos
- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características
- **Control de Zócalos DTE**: Gestión completa de zócalos con escritura directa a archivos de texto (`f1.txt`, `f2.txt`, `f3.txt`) para integración instantánea con OBS.
- **Gestión de Programas**: Crea y organiza zócalos por programas. El programa "GENERAL" está protegido para garantizar estabilidad.
- **Zócalos Auxiliares (F3)**: 3 slots fijos por programa para información dinámica global.
- **Sincronización Global**: Lógica de "On Air" sincronizada; solo un zócalo (normal o auxiliar) puede estar activo a la vez en todo el sistema.
- **Previsualización en Tiempo Real**: Recepción de capturas de pantalla de la salida de OBS cada segundo.
- **Control de Escenas y Fuentes**: Cambia escenas y oculta/muestra elementos de fuente directamente desde la web.
- **Notificaciones Descriptivas**: Sistema de alertas (InfoPill) que informa sobre cada acción realizada con detalles específicos.
- **Persistencia en SQLite**: Todos los datos se guardan en una base de datos local para mayor fiabilidad.

## 🚀 Tecnologías Utilizadas
- **Frontend**: [SvelteKit](https://kit.svelte.dev/) con Bootstrap 5.
- **Backend**: Node.js con [Socket.IO](https://socket.io/) para comunicación en tiempo real.
- **Base de Datos**: SQLite3.
- **Integración OBS**: [obs-websocket-js](https://github.com/obsproject/obs-websocket-js).

## 🛠 Requisitos Previos
- **Node.js**: Versión 16 o superior.
- **OBS Studio**: Instalado y funcionando.
- **OBS WebSocket Plugin**: Habilitado en OBS (Herramientas -> Ajustes de WebSockets).

## 📥 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/walter8729/obs-webcontrol-sveltekit.git
   cd obs-webcontrol-sveltekit
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## ⚙️ Configuración

Edita el archivo `src/lib/config.js` para configurar la conexión con tu OBS:

```javascript
export const OBS_ADDRESS = "ws://localhost:4455"; // Dirección y puerto de OBS WebSocket
export const OBS_PASSWORD = "tu_password";      // Contraseña configurada en OBS
```

## 🎮 Uso

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   O usa el archivo `RUN.BAT` en sistemas Windows.

2. Abre tu navegador en `http://localhost:5173` (o la dirección que indique la consola).

3. **Zócalos**: Ve a la pestaña de Zócalos para gestionar los contenidos. Al presionar "USAR" o "AIRE", el contenido se escribirá en los archivos `.txt` dentro de `src/`.
4. **Programas**: Organiza tus zócalos creando diferentes programas según la necesidad de tu producción.

## 📂 Estructura del Proyecto
- `src/routes/`: Componentes y páginas de la aplicación.
- `src/lib/server/`: Lógica del servidor y conexión WebSocket con OBS.
- `src/db.mjs`: Gestión de la base de datos SQLite.
- `src/file.js`: Utilidades para escritura de archivos de texto.
- `static/`: Archivos estáticos y fuentes.

> [!NOTE]
> Las capturas de pantalla se añadirán próximamente.

## 🤝 Contribución
Si deseas colaborar, por favor abre un *Issue* para discutir los cambios o envía un *Pull Request*.

## 📄 Licencia
Este proyecto es privado. Para más información, contactar con el desarrollador.

---
© 2026 Walter - OBS Web Control
