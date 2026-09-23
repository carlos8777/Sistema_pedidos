let supabaseClientPromise = null;

function obtenerClienteSupabase(){
    if(!supabaseClientPromise){
        supabaseClientPromise = fetch('/api/config')
        .then(res => res.json())
        .then(config => supabase.createClient(config.supabaseUrl, config.supabaseAnonKey));
    }
    return supabaseClientPromise;
}