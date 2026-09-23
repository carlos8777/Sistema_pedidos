const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({ error: 'No se proporciono un token de acceso'});
    }

    const { data, error }= await supabaseAdmin.auth.getUser(token);

    if(error || !data.user){
        return res.status(403).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión'});
    }
    
    const { data: perfil, error: errorPerfil } = await supabaseAdmin
        .from('perfiles')
        .select('nombre, rol')
        .eq('id', data.user.id)
        .maybeSingle();

    if(errorPerfil || !perfil){
        return res.status(403).json({ error: 'No se encontró el perfil de este usuario'});
    }

    req.usuario = {
        id: data.user.id,
        email: data.user.email,
        nombre: perfil.nombre,
        rol: perfil.rol
    };
    next();
}

function soloAdmin(req, res, next){
    if(!req.usuario || req.usuario.rol !== 'admin'){
        return res.status(403).json({ error: 'No tiene permiso para realizar esta accion.'});
        next();
    }
}