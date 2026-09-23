let pedidoSeleccionado = null;
let listaPedido = [];
let esAdmin = false;

// Formulario de pedidos
const formPedido = document.getElementById('form-pedido');
const formTitle = document.getElementById('form-title');
const inputPedidoId = document.getElementById('pedido-id');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

// Vista Consulta (Solo Lectura)
const inputFechaConsulta = document.getElementById('filtro-fecha');
const btnBuscarConsulta = document.getElementById('buscar');
const tbodyConsulta = document.getElementById('tbody-pedidos-consulta');

// Vista Configuración (Gestión de Pedidos)
const inputFechaConfig = document.getElementById('filtro-fecha-config');
const btnBuscarConfig = document.getElementById('buscar-config');
const btnModificar = document.getElementById('editar');
const btnBorrar = document.getElementById('eliminar');
const tbodyConfig = document.getElementById('tbody-pedidos-config');

// Vista Configuración (Gestión de Usuarios)
const tbodyUsuarios = document.getElementById('tbody-usuarios');

// Navegación (SPA)
const vistas = {
    pedido: document.getElementById('seccion-pedido'),
    consulta: document.getElementById('seccion-consulta'),
    config: document.getElementById('seccion-configuracion')
};

const botonesNav = {
    pedido: document.getElementById('nav-pedido'),
    consulta: document.getElementById('nav-consulta'),
    config: document.getElementById('nav-config')
};

// Configuración de fecha actual
const hoy = new Date().toISOString().split('T')[0];
if (inputFechaConsulta) inputFechaConsulta.value = hoy;
if (inputFechaConfig) inputFechaConfig.value = hoy;

// --- FUNCIONES DE NAVEGACIÓN ---
function cambiarVista(vistaActiva) {
    Object.values(vistas).forEach(vista => {
        if (vista) vista.classList.add('oculto');
    });
    Object.values(botonesNav).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (vistas[vistaActiva]) vistas[vistaActiva].classList.remove('oculto');
    if (botonesNav[vistaActiva]) botonesNav[vistaActiva].classList.add('active');
}

// Event Listeners Menú Lateral
if (botonesNav.pedido) botonesNav.pedido.addEventListener('click', () => cambiarVista('pedido'));
if (botonesNav.consulta) botonesNav.consulta.addEventListener('click', () => cambiarVista('consulta'));
if (botonesNav.config) botonesNav.config.addEventListener('click', () => {
    cambiarVista('config');
    cargarUsuarios();
});

// Formato de fecha (DD/MM/AAAA)
function formatoFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Consulta para usuario
if (btnBuscarConsulta) {
    btnBuscarConsulta.addEventListener('click', async () => {
        const fecha = inputFechaConsulta.value;
        if (!fecha) return alert('Seleccione una fecha para consultar.');

        tbodyConsulta.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
        try {
            const res = await fetch(`/api/pedidos?fecha=${fecha}`, { headers: await authHeaders() });
            if (await manejarRespuestaAuth(res)) return;
            const pedidos = await res.json();

            if (!pedidos.length) {
                tbodyConsulta.innerHTML = '<tr><td colspan="6" class="text-center">No hay pedidos agendados.</td></tr>';
                return;
            }

            tbodyConsulta.innerHTML = '';
            pedidos.forEach(p => {
                tbodyConsulta.innerHTML += `
                    <tr>
                        <td><strong>${formatoFecha(p.fecha)}</strong></td>
                        <td>${p.horario || ''}</td>
                        <td>${p.metros} m³</td>
                        <td>${p.cliente}</td>
                        <td>${p.direccion}</td>
                        <td>${p.resistencia}</td>
                    </tr>
                `;
            });
        } catch (error) {
            tbodyConsulta.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Error al cargar los pedidos.</td></tr>';
        }
    });
}

//Configuracion solo admin
async function cargarUsuarios() {
    if (!tbodyUsuarios) return;
    tbodyUsuarios.innerHTML = '<tr><td colspan="3" class="text-center">Cargando usuarios...</td></tr>';

    try {
        const res = await fetch('/api/usuarios', { headers: await authHeaders() });
        if (await manejarRespuestaAuth(res)) return;

        const usuarios = await res.json();
        tbodyUsuarios.innerHTML = '';

        usuarios.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.email}</td>
                <td><span class="rol-badge">${(u.rol || 'usuario').toUpperCase()}</span></td>
                <td>
                    <select onchange="cambiarRol('${u.id}', this.value)" class="btn" style="background:#fff; border:1px solid #ccc; padding: 4px 8px;">
                        <option value="usuario" ${u.rol === 'usuario' ? 'selected' : ''}>Usuario</option>
                        <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </td>
            `;
            tbodyUsuarios.appendChild(tr);
        });
    } catch (error) {
        tbodyUsuarios.innerHTML = '<tr><td colspan="3" class="text-center" style="color:red;">Error al cargar usuarios.</td></tr>';
    }
}

window.cambiarRol = async function(userId, nuevoRol) {
    try {
        const res = await fetch(`/api/usuarios/${userId}/rol`, {
            method: 'PUT',
            headers: await authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ rol: nuevoRol })
        });

        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1500, showConfirmButton: false });
            cargarUsuarios();
        } else {
            Swal.fire('Error', 'No se pudo actualizar el rol', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Fallo de conexión', 'error');
    }
};

//Consulta de Pedidos para admin
if (btnBuscarConfig) {
    btnBuscarConfig.addEventListener('click', async () => {
        const fecha = inputFechaConfig.value;
        if (!fecha) return alert('Seleccione una fecha para buscar.');
        await cargarPedidosAdmin(fecha);
    });
}

async function cargarPedidosAdmin(fecha) {
    if (!tbodyConfig) return;
    tbodyConfig.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
    deseleccionarPedido();

    try {
        const res = await fetch(`/api/pedidos?fecha=${fecha}`, { headers: await authHeaders() });
        if (await manejarRespuestaAuth(res)) return;
        const pedidos = await res.json();

        listaPedido = pedidos;

        if (!pedidos.length) {
            tbodyConfig.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos agendados.</td></tr>';
            return;
        }

        tbodyConfig.innerHTML = '';
        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="radio" name="select-pedido" value="${p.id}" onclick="marcarSeleccion('${p.id}')"></td>
                <td><strong>${formatoFecha(p.fecha)}</strong></td>
                <td>${p.horario || ''}</td>
                <td>${p.metros} m³</td>
                <td>${p.cliente}</td>
                <td>${p.direccion}</td>
                <td>${p.resistencia}</td>
            `;
            tbodyConfig.appendChild(tr);
        });
    } catch (error) {
        tbodyConfig.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red;">Error al cargar los pedidos.</td></tr>';
    }
}

// Selección de pedido en la tabla de Configuración
window.marcarSeleccion = function(id) {
    pedidoSeleccionado = listaPedido.find(p => String(p.id) === String(id));
    if (btnModificar) btnModificar.disabled = false;
    if (btnBorrar) btnBorrar.disabled = false;
};

function deseleccionarPedido() {
    pedidoSeleccionado = null;
    if (btnModificar) btnModificar.disabled = true;
    if (btnBorrar) btnBorrar.disabled = true;

    const radio = document.querySelector('input[name="select-pedido"]:checked');
    if (radio) radio.checked = false;
}

//Edicion y eliminacion de pedidos
if (btnModificar) {
    btnModificar.addEventListener('click', () => {
        if (!pedidoSeleccionado) return;

        inputPedidoId.value = pedidoSeleccionado.id;
        document.getElementById('fecha').value = pedidoSeleccionado.fecha;
        document.getElementById('horario').value = pedidoSeleccionado.horario;
        document.getElementById('cliente').value = pedidoSeleccionado.cliente;
        document.getElementById('metros').value = pedidoSeleccionado.metros;
        document.getElementById('resistencia').value = pedidoSeleccionado.resistencia;
        document.getElementById('direccion').value = pedidoSeleccionado.direccion;

        formTitle.textContent = 'Editando pedido';
        btnGuardar.textContent = 'Actualizar pedido';
        btnCancelar.style.display = 'inline-block';

        // Llevar al usuario a la vista del formulario
        cambiarVista('pedido');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (btnBorrar) {
    btnBorrar.addEventListener('click', async () => {
        if (!pedidoSeleccionado) return;

        const result = await Swal.fire({
            title: '¿Confirmas la eliminación?',
            text: `Se eliminará el pedido del cliente "${pedidoSeleccionado.cliente}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/pedidos/${pedidoSeleccionado.id}`, { 
                    method: 'DELETE',
                    headers: await authHeaders()
                });

                if (await manejarRespuestaAuth(res)) return;

                if (res.ok) {
                    Swal.fire('¡Eliminado!', 'El pedido ha sido eliminado.', 'success');
                    await cargarPedidosAdmin(inputFechaConfig.value);
                } else {
                    const err = await res.json();
                    Swal.fire('Error', err.error || 'No se pudo eliminar.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Ocurrió un error al intentar eliminar el pedido.', 'error');
            }
        }
    });
}

//registrar y actualizar
if (formPedido) {
    formPedido.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = inputPedidoId ? inputPedidoId.value : '';

        const datos = {
            fecha: document.getElementById('fecha').value,
            horario: document.getElementById('horario').value,
            cliente: document.getElementById('cliente').value.trim(),
            metros: parseFloat(document.getElementById('metros').value),
            resistencia: document.getElementById('resistencia').value.trim(),
            direccion: document.getElementById('direccion').value.trim()
        };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/pedidos/${id}`, {
                    method: 'PUT',
                    headers: await authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(datos)
                });
            } else {
                res = await fetch('/api/pedidos', {
                    method: 'POST',
                    headers: await authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(datos)
                });
            }

            if (await manejarRespuestaAuth(res)) return;

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Operación exitosa',
                    text: id ? 'Pedido actualizado correctamente' : 'Pedido registrado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
                limpiarFormulario();
                
                // Si es admin, refrescar la lista en la pestaña de configuración
                if (esAdmin) {
                    if (inputFechaConfig) inputFechaConfig.value = datos.fecha;
                    await cargarPedidosAdmin(datos.fecha);
                }
            } else {
                const err = await res.json();
                alert(`Error del servidor: ${err.error || 'No se pudo guardar el pedido'}`);
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un problema al procesar el pedido.',
                confirmButtonColor: '#007bff'
            });
        }
    });
}

if (btnCancelar) btnCancelar.addEventListener('click', limpiarFormulario);

function limpiarFormulario() {
    if (inputPedidoId) inputPedidoId.value = '';
    if (formPedido) formPedido.reset();
    if (formTitle) formTitle.textContent = 'Nuevo pedido';
    if (btnGuardar) btnGuardar.textContent = 'Guardar pedido';
    if (btnCancelar) btnCancelar.style.display = 'none';
}

// roles
async function iniciar() {
    const usuario = await inicializarSesion();
    if (!usuario) return;

    esAdmin = usuario.rol === 'admin';

    if (!esAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => el.remove());
        if (vistas.consulta) vistas.consulta.remove();
        if (vistas.config) vistas.config.remove();
    } else {
        // Carga inicial para el administrador
        if (btnBuscarConsulta) btnBuscarConsulta.click();
    }
}

iniciar();