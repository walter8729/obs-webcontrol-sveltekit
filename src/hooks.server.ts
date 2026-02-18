import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ resolve, event }) => {
  const session = event.cookies.get('session');

  if (session) {
    // En este caso, el valor de la cookie es directamente el username
    event.locals.user = { username: session };
  }

  // Protección global: si no hay usuario, solo permitir '/' y '/api/login'
  const isProtected = event.url.pathname !== '/' && !event.url.pathname.startsWith('/api/login');
  if (!event.locals.user && isProtected) {
    // Si no es un archivo estático (no tiene extensión), redirigir
    if (!event.url.pathname.includes('.')) {
      throw redirect(302, '/');
    }
  }

  if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response(null, { status: 404 });
  }

  const response = await resolve(event);

  // Apply CORS header for API routes
  if (event.url.pathname.startsWith('/api')) {
    // Required for CORS to work
    if (event.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Methods': 'PUT, POST, GET, OPTIONS, DELETE',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    response.headers.append('Access-Control-Allow-Origin', `*`);
  }

  return response;
};