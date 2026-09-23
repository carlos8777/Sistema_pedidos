(async () => {
    const client = await obtenerClienteSupabase();

    const { data: { session} }= await client.auth.getSession();
    if(session){
        window.location.href = 'index.html';
        return;
    }

    const formLogin = document.getElementById('form-login');
    const mensajeError = document.getElementById('mensaje-error');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeError.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const { error } = await client.auth.signInWithPassword({ email, password });

        if(error){
            mensajeError.textContent = error.message === 'Credenciales incorrectas'
            ? 'Correo o contraseña incorrecta'
            : error.message;
            return;
        }
        window.location.href = 'index.html';
    });
})();