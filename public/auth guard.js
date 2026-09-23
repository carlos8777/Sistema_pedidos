// Se ejecuta antes que script.js para proteger index.html

let usuarioActual = null;
let clienteSupabaseGlobal = null;

// Pide la sesión a Supabase y el perfil (rol/nombre) a nuestro backend.
// Devuelve el usuario o null (y redirige a login) si no hay sesión válida.
async function inicializarSesion() {
    clienteSupabaseGlobal = await obtenerClienteSupabase();

    const { data: { session } } = await clienteSupabaseGlobal.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const res = await fetch('/api/auth/perfil', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!res.ok) {
            await cerrarSesion();
            return null;
        }

        const data = await res.json();
        usuarioActual = data.usuario; // { id, email, nombre, rol }

        const nombreEl = document.getElementById('session-nombre');
        const rolEl = document.getElementById('session-rol');
        const btnLogout = document.getElementById('btn-logout');

        if (nombreEl) nombreEl.textContent = usuarioActual.nombre || usuarioActual.email;
        if (rolEl) rolEl.textContent = usuarioActual.rol;
        if (btnLogout) btnLogout.addEventListener('click', cerrarSesion);

        return usuarioActual;
    } catch (error) {
        await cerrarSesion();
        return null;
    }
}

// Devuelve el token actual (Supabase lo refresca solo cuando es necesario)
async function obtenerToken() {
    const { data: { session } } = await clienteSupabaseGlobal.auth.getSession();
    return session ? session.access_token : null;
}

// Helper para armar los headers de cada fetch a nuestro backend
async function authHeaders(extra = {}) {
    const token = await obtenerToken();
    return { ...extra, 'Authorization': `Bearer ${token}` };
}

// Manejo centralizado de sesión inválida/expirada
async function manejarRespuestaAuth(res) {
    if (res.status === 401) {
        await cerrarSesion();
        return true;
    }
    return false;
}

async function cerrarSesion() {
    if (clienteSupabaseGlobal) await clienteSupabaseGlobal.auth.signOut();
    window.location.href = 'login.html';
}