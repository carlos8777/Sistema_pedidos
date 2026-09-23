(async () => {
    const client = await obtenerClienteSupabase();

    const { data: { session } }= await client.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
        return;
    }

    const formRegistro = document.getElementById('form-registro');
    const mensajeError = document.getElementById('mensaje-error');

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeError.textContent = '';

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;

        if(password !== password2){
            mensajeError.textContent = 'Las contraseñas no coinciden';
            return;
        }

        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: { data: { nombre }}
        });

        if(error){
            mensajeError.textContent = error.message;
            return;
        }

        await Swal.fire({
            icon: 'success',
            title: 'Cuenta creada',
            text: data.session
                ? 'Tu cuenta fue creada y ya iniciaste sesión'
                : 'Revisa tu correo para confirmar la cuenta antes de iniciar sesión',
                confirmButtonText: 'Entendido'
        });
        window.location.href = data.session ? 'index.html' : 'login.html';
    });
})();