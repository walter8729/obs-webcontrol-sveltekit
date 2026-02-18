import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
    cookies.delete('session', { path: '/' });
    return json({ success: true });
}
