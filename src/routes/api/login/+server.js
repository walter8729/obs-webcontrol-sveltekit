import { json } from '@sveltejs/kit';
import { getUser } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    const { username, password } = await request.json();

    try {
        const user = await getUser(username);

        if (user && user.password === password) {
            // En una app real usaríamos JWT o tokens aleatorios persistidos en BD.
            // Por simplicidad y según el requerimiento, usamos el username como sesión básica.
            cookies.set('session', user.username, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 semana
            });

            return json({ success: true, user: { username: user.username } });
        }

        return json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
    } catch (e) {
        return json({ success: false, message: 'Error en el servidor' }, { status: 500 });
    }
}
