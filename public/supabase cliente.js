let supabaseClientPromise = null;

function obtenerClienteSupabase(){
    if(!supabaseClientPromise){
        supabaseClientPromise = fetch('/api/config')
        .then(res => res.json())
        .then(config => supabaseClientPromise.createClient(config.supabaseUrl, config.supabaseAnonKey));
    }
    return supabaseClientPromise;
}