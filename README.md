# OBS Web Control - SvelteKit

Una potente herramienta de control remoto para **OBS Studio** construida con **SvelteKit**, diseñada para simplificar la gestión de zócalos (CG), escenas y playout multimedia en entornos de producción en vivo de alta exigencia.

## 📋 Tabla de Contenidos
- [Características](#-características)
- [Estructura del Proyecto (Nueva)](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Uso](#-instalación-y-uso)
- [Soporte Offline](#-soporte-offline)
- [Playout Multimedia](#-playout-multimedia)

## ✨ Características
- **Control de Zócalos DTE**: Escritura directa a archivos de texto (`f1.txt`, `f2.txt`, `f3.txt`) para integración con OBS.
- **Gestión de Programas**: Organización de zócalos por programas (Noticieros, Entrevistas, etc.).
- **Playout Multimedia Profesional**: 
    - Lista de reproducción con arrastrar y soltar (Drag & Drop).
    - Control de velocidad en tiempo real con sincronización de posición.
    - Soporte para Bucle A-B avanzado gerenciado desde el servidor.
    - Auto-carga y transición automática de clips.
- **Soporte Offline Total**: Todas las dependencias (Bootstrap, JS, Fuentes sugeridas) se cargan localmente, permitiendo el uso en redes sin internet.
- **Previsualización en Vivo**: Monitor de programa integrado a baja latencia.
- **Control de Escenas**: Cambio de escenas y gestión de visibilidad de fuentes con un solo clic.

## 📂 Estructura del Proyecto
El proyecto ha sido reestructurado siguiendo las mejores prácticas de SvelteKit:

- `src/lib/server/`: Lógica pesada del servidor.
  - `db.js`: Gestión de base de datos SQLite y persistencia.
  - `obs.js`: Controlador WebSocket de OBS y lógica de playout.
- `src/lib/stores/`: Gestión de estados reactivos en el cliente.
  - `obs.js`: Sincronización de escenas y capturas.
  - `playout.js`: Gestión de la lista de reproducción y controles de transporte.
- `src/lib/components/`: Componentes UI modulares.
  - `playout/`: Controles, Explorador y Playlist.
  - `zocalos/`: Editor de generador de caracteres.
  - `common/`: Preview, Selectores de Escena, Login, Píldoras de Info.
- `src/lib/utils/`: Funciones de utilidad compartidas (formateo de tiempo, etc.).

## 🚀 Instalación y Uso

1. **Dependencias**:
   ```bash
   npm install
   ```

2. **Configuración de Conexión**:
   Edita `src/lib/config.js` con los datos de tu OBS WebSocket (puerto y contraseña).

3. **Ejecución**:
   ```bash
   npm run dev
   ```
   O usa el archivo `RUN.BAT` suministrado.

## 📶 Soporte Offline
Se han removido todas las dependencias de CDN. El sistema cargará correctamente incluso en redes aisladas (Intranets), garantizando que los estilos de Bootstrap y los scripts de funcionalidad estén siempre disponibles.

## 📼 Playout Multimedia
Para el uso correcto del Playout:
1. Asegúrate de tener una fuente de tipo **"Fuente multimedia"** o **"VLC Video Source"** llamada exactamente `playout` en tu escena actual de OBS.
2. El sistema controlará automáticamente esta fuente para cargar los archivos seleccionados en la web.

---
© 2026 Walter - OBS Web Control Profesional
