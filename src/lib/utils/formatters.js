/**
 * @file formatters.js
 * @description Funciones de utilidad para el formateo de datos en la interfaz.
 */

/**
 * Formatea una cantidad de milisegundos en una cadena legible (HH:MM:SS o DD HH:MM:SS).
 * @param {number} ms Tiempo en milisegundos.
 * @returns {string} Tiempo formateado.
 * @example
 * formatTime(65000) // "01:05"
 * formatTime(3665000) // "01:01:05"
 */
export function formatTime(ms) {
    if (!ms || isNaN(ms)) return "00:00";

    const secTotal = Math.floor(ms / 1000);
    const days = Math.floor(secTotal / 86400);
    const hours = Math.floor((secTotal % 86400) / 3600);
    const mins = Math.floor((secTotal % 3600) / 60);
    const secs = secTotal % 60;

    // Formateo de horas, minutos y segundos con ceros a la izquierda
    const hms = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    // Si hay días, mostrarlos delante
    if (days > 0) return `${days}d ${hms}`;

    // Si hay horas, mostrar HH:MM:SS
    if (hours > 0) return hms;

    // Por defecto mostrar MM:SS
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
