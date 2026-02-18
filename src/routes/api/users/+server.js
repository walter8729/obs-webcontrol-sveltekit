import { json } from '@sveltejs/kit';
import { getAllUsers, addUser, updateUser, deleteUser } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    if (!locals.user) return json({ message: 'No autorizado' }, { status: 401 });

    const users = await getAllUsers();
    return json(users);
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (!locals.user) return json({ message: 'No autorizado' }, { status: 401 });

    const { username, password } = await request.json();
    if (!username || !password) return json({ message: 'Datos incompletos' }, { status: 400 });

    try {
        await addUser({ username, password });
        return json({ success: true });
    } catch (e) {
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
    if (!locals.user) return json({ message: 'No autorizado' }, { status: 401 });

    const { id, username, password } = await request.json();
    if (!id || !username || !password) return json({ message: 'Datos incompletos' }, { status: 400 });

    try {
        await updateUser(id, username, password);
        return json({ success: true });
    } catch (e) {
        return json({ success: false, message: e.message }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
    if (!locals.user) return json({ message: 'No autorizado' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return json({ message: 'ID faltante' }, { status: 400 });

    try {
        await deleteUser(id);
        return json({ success: true });
    } catch (e) {
        return json({ success: false, message: e.message }, { status: 500 });
    }
}
